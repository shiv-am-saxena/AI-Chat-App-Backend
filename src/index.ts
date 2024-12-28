import 'dotenv/config.js';
import http from 'http';
import app from './app.js'; // Server configuration
import connectDb from './db/mongooseConnection.js';
import errorHandler from './middlewares/errorHandler.js';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from './models/user.model.js';
import { IProject, Project } from './models/project.model.js';
import { Chat } from './models/chat.model.js';
import { jwtPayload } from './types/jwtPayload.js';
import { ApiError } from './utils/ApiError.js';

// Extend the Socket.IO module to include custom properties
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
		origin: "*",
		// credentials: true,
		// methods: ['GET', 'POST'],
		// allowedHeaders: ['Content-Type', 'Authorization']
	}
});

// Helper Functions
const populateUser = async (id: string) => {
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
	socket: Socket,
	next: (err?: Error) => void
) => {
	try {
		// Extract token
		const token =
			socket.handshake.auth?.token ||
			socket.handshake.headers.authorization?.split(' ')[1];

		if (!token)
			throw new ApiError(401, 'Authentication error: Token not provided');

		// Validate project ID
		const projectId = socket.handshake.query.projectId as string;
		if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
			throw new ApiError(400, 'Invalid or missing Project ID');
		}

		// Verify project and user
		const project = await Project.findById(projectId);
		if (!project) throw new ApiError(404, 'Project not found');

		const decoded = jwt.verify(
			token,
			process.env.ACCESS_TOKEN_SECRET!
		) as jwtPayload;
		const user = await User.findById(decoded.id).select('-password');
		if (!user) throw new ApiError(404, 'User not found');

		// Attach user and project to socket
		socket.project = project;
		socket.user = { id: user.id, email: user.email };
		next();
	} catch (error) {
		console.error('Socket authentication error:', error);
		next(new ApiError(401, 'Authentication failed'));
	}
};

// Apply Authentication Middleware
io.use(authenticateSocket);

// Socket.IO Event Handlers
io.on('connection', (socket: Socket) => {
	console.log('User connected:', socket.user?.email);

	// Join project room
	const projectId = socket.project._id.toString();
	if (projectId) socket.join(projectId);

	// Handle project messages
	socket.on('project-message', async (data) => {
		try {
			const msgData = {
				message: data.message,
				sender: data.sender,
				email: await populateUser(data.sender)
			};

			// Add message to database
			await Chat.updateOne({ pid: projectId }, { $push: { chats: msgData } });

			// Broadcast message to other users in the room
			socket.broadcast.to(projectId).emit('project-message', msgData);
		} catch (error) {
			console.error('Error handling project-message:', error);
			socket.emit('error', 'Message delivery failed');
		}
	});

	// Handle disconnect
	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.user?.email);
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
