import 'dotenv/config.js';
import http from 'http';
import app from './app.js'; // Server configuration
import connectDb from './db/mongooseConnection.js';
import errorHandler from './middlewares/errorHandler.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { IUser, User } from './models/user.model.js';
import { IProject, Project } from './models/project.model.js';
import { Chat } from './models/chat.model.js';
import { ApiError } from './utils/ApiError.js';
import type { Socket } from 'socket.io';
import { jwtPayload } from './types/jwtPayload.js';

declare module 'socket.io' {
	interface Socket {
		project?: IProject;
		user?: IUser;
	}
}
import flashResult from './services/gemini.service.js';
import getCompletion from './services/openai.service.js';
import proResult from './services/pro.service.js';
import winston from 'winston';

// Logger configuration
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [new winston.transports.Console()]
});

// Validate environment variables
if (!process.env.ACCESS_TOKEN_SECRET) {
	throw new ApiError(500, 'ACCESS_TOKEN_SECRET not set');
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
		logger.error(`Error fetching user with ID ${id}:`, error);
		return '@ai';
	}
};

const handleAIResponse = async (
	tag: '@gemini' | '@gpt' | '@pro',
	prompt: string,
	projectId: mongoose.Types.ObjectId,
	sender: string,
	io: Server
) => {
	const services = {
		'@gemini': { service: flashResult, email: 'Gemini 1.5 Flash' },
		'@gpt': { service: getCompletion, email: 'GPT 4o-mini' },
		'@pro': { service: proResult, email: 'Gemini 1.5 PRO' }
	};

	try {
		const { service, email: aiEmail } = services[tag];
		const result = await service(prompt);
		const data = { message: result, sender: '_ai', email: aiEmail };
		await Chat.updateOne({ pid: projectId }, { $push: { chats: data } });
		io.to(projectId.toString()).emit('project-message', data);
	} catch (error) {
		throw new ApiError(500, `Error handling AI response for tag ${tag}: ${error}`);
	}
};
// Authentication Middleware
const authenticateSocket = async (
	socket: Socket,
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
		const user = await User.findById((decoded as jwtPayload).id).select(
			'-password'
		);
		if (!user) throw new ApiError(404, 'User not found');

		socket.project = project;
		socket.user = user;
		next();
	} catch (error) {
		logger.error('Socket authentication error:', error);
		const message =
			process.env.NODE_ENV === 'production'
				? 'Authentication failed'
				: (error as Error).message;
		next(new Error(message));
	}
};
// Apply Authentication Middleware
io.use(authenticateSocket);

// Socket.IO Event Handlers
io.on('connection', (socket) => {
	logger.info('User connected:', { email: socket.user?.email });

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
				socket.broadcast.to(projectId!.toString()).emit('project-message', msgData);

				const tags = ['@gemini', '@gpt', '@pro'];
				for (const tag of tags) {
					if (incomingMessage.message.includes(tag)) {
						await handleAIResponse(
							tag as '@gemini' | '@gpt' | '@pro',
							incomingMessage.message.replace(tag, ''),
							projectId as unknown as mongoose.Types.ObjectId,
							incomingMessage.sender,
							io
						);
					}
				}
			} catch (error) {
				logger.error('Error handling project-message:', error);
				socket.emit('error', 'Message delivery failed');
			}
		}
	);

	socket.on('disconnect', (reason: string) => {
		logger.info('User disconnected:', {
			email: socket.user?.email,
			reason
		});
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
		console.log('Database connection failed:', err);
	});

app.use(errorHandler);

// Graceful Shutdown
process.on('SIGINT', async () => {
	logger.info('Gracefully shutting down...');
	await mongoose.disconnect();
	server.close(() => {
		logger.info('Server closed');
		process.exit(0);
	});
});
