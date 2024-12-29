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

// Extend the Socket.IO module to include custom properties
import type { Socket as BaseSocket } from 'socket.io';
import { jwtPayload } from './types/jwtPayload.js';

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
		origin: ['https://adhyay-lime.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173'], // Use CLIENT_URL from .env if available
		methods: ['GET', 'POST'],
		credentials: true
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
		async (data: { message: string; sender: string }) => {
			try {
				const msgData = {
					message: data.message,
					sender: data.sender,
					email: await populateUser(data.sender)
				};

				await Chat.updateOne({ pid: projectId }, { $push: { chats: msgData } });
				io.to(projectId!.toString()).emit('project-message', msgData);
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
