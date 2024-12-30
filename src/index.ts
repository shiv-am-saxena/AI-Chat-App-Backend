import 'dotenv/config.js';
import http from 'http';
import app from './app.js'; // Server configuration
import connectDb from './db/mongooseConnection.js';
import errorHandler from './middlewares/errorHandler.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from './models/user.model.js';
import { IProject, Project } from './models/project.model.js';
import { Chat } from './models/chat.model.js';
import { ApiError } from './utils/ApiError.js';
import type { Socket as BaseSocket } from 'socket.io';
import { jwtPayload } from './types/jwtPayload.js';
import flashResult from './services/gemini.service.js';
import getCompletion from './services/openai.service.js';
import proResult from './services/pro.service.js';

declare module 'socket.io' {
	interface Socket {
		user?: jwtPayload;
		project: IProject;
	}
}

const port = process.env.PORT || 8080;

// Initialize HTTP and Socket.IO servers
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*'
	}
});

// Helper Functions
const populateUser = async (id: string): Promise<string> => {
	try {
		const user = await User.findById(id);
		return user ? user.email : '@ai';
	} catch (error) {
		console.error(`Error fetching user with ID ${id}:`, error);
		return '@ai';
	}
};

// Authentication Middleware
const authenticateSocket = async (
	socket: BaseSocket,
	next: (err?: Error) => void
): Promise<void> => {
	try {
		const token =
			socket.handshake.auth?.token ||
			socket.handshake.headers.authorization?.split(' ')[1];

		if (!token)
			throw new ApiError(401, 'Authentication error: Token not provided');

		const projectId = socket.handshake.query.projectId as string;
		if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
			throw new ApiError(400, 'Invalid or missing Project ID');
		}

		const project = await Project.findById(projectId);
		if (!project) throw new ApiError(404, 'Project not found');

		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
		const user = await User.findById((decoded as { id: string }).id).select(
			'-password'
		);
		if (!user) throw new ApiError(404, 'User not found');

		socket.project = project;
		socket.user = { id: user.id, email: user.email };
		next();
	} catch (error) {
		console.error('Socket authentication error:', error);
		next(new Error('Authentication failed'));
	}
};

// Apply Authentication Middleware
io.use(authenticateSocket);

// Socket.IO Event Handlers
io.on('connection', (socket: BaseSocket) => {
	console.log('User connected:', socket.user?.email);

	const projectId = socket.project?._id;
	if (projectId) socket.join(projectId.toString());

	socket.on(
		'project-message',
		async (incomingMessage: { message: string; sender: string }) => {
			try {
				const msgData = {
					message: incomingMessage.message,
					sender: incomingMessage.sender,
					email: await populateUser(incomingMessage.sender)
				};
				await Chat.updateOne({ pid: projectId }, { $push: { chats: msgData } });
				const containAI = incomingMessage.message.includes('@gemini');
				const containGPT = incomingMessage.message.includes('@gpt');
				const containPRO = incomingMessage.message.includes('@pro');
				socket.broadcast.to(projectId!.toString()).emit('project-message', msgData);
				if (containAI) {
					const prompt = incomingMessage.message.replace('@gemini', '');
					const result = await flashResult(prompt);
					const data = {
						message: result,
						sender: '_ai',
						email: 'Gemini 1.5 Flash'
					};
					await Chat.updateOne({ pid: projectId }, { $push: { chats: data } });
					io.to(projectId!.toString()).emit('project-message', data);
				}
				if (containGPT) {
					const prompt = incomingMessage.message.replace('@gpt', '');
					const result = await getCompletion(prompt);
					const data = {
						message: result,
						sender: '_ai',
						email: 'GPT 4o-mini'
					};
					await Chat.updateOne({ pid: projectId }, { $push: { chats: data } });
					io.to(projectId!.toString()).emit('project-message', data);
				}
				if (containPRO) {
					const prompt = incomingMessage.message.replace('@pro', '');
					const result = await proResult(prompt);
					const data = {
						message: result,
						sender: '_ai',
						email: 'Gemini 1.5 PRO'
					};
					await Chat.updateOne({ pid: projectId }, { $push: { chats: data } });
					io.to(projectId!.toString()).emit('project-message', data);
				}
			} catch (error) {
				console.error('Error handling project-message:', error);
				socket.emit('error', 'Message delivery failed');
			}
		}
	);

	socket.on('disconnect', (reason: string) => {
		console.log('User disconnected:', socket.user?.email, 'Reason:', reason);
	});
});

// Start Server
connectDb()
	.then(() => {
		server.listen(port, () => {
			console.log(`Server running on port ${port}`);
		});
	})
	.catch((err: Error) => {
		console.error('Database connection failed:', err);
	});

app.use(errorHandler);
