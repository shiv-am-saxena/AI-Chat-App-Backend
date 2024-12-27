import 'dotenv/config.js'; //.env file configuration
import http from 'http';
import app from './app.js'; //server configuration
import connectDb from './db/mongooseConnection.js';
import errorHandler from './middlewares/errorHandler.js';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { jwtPayload } from './types/jwtPayload.js';
import { ApiError } from './utils/ApiError.js';
import { User } from './models/user.model.js';
import mongoose from 'mongoose';
import { IProject, Project } from './models/project.model.js';
import { Chat } from './models/chat.model.js';

// Extend the Socket.io module to include a user property
declare module 'socket.io' {
	interface Socket {
		user?: jwtPayload;
		project: IProject;
	}
}

const server = http.createServer(app); //server creation
const port = process.env.PORT || 8080;
const authenticateSocket = async (
	socket: Socket,
	next: (err?: Error) => void
) => {
	try {
		const token =
			socket.handshake.auth?.token ||
			socket.handshake.headers.authorization?.split(' ')[1];

		if (!token) {
			return next(new ApiError(401, 'Authentication error: Token not provided'));
		}
		const projectId = socket.handshake.query.projectId;
		console.log(projectId);
		if (!projectId) {
			throw next(new ApiError(400, 'Project ID not found'));
		}
		if (!mongoose.Types.ObjectId.isValid(projectId as string)) {
			throw next(new ApiError(400, 'Invalid Project ID'));
		}
		const project = await Project.findById({ _id: projectId });
		if (!project) {
			return next(new ApiError(400, 'Project not found'));
		}
		const { id } = jwt.verify(
			token,
			`${process.env.ACCESS_TOKEN_SECRET}`
		) as jwtPayload;
		const user = await User.findById({ _id: id }).select('-password');
		if (!user) {
			return next(new ApiError(400, 'Authentication error: User not found'));
		}
		socket.project = project;
		socket.user = { id: user.id, email: user.email };
		next();
	} catch (err) {
		return next(new ApiError(400, 'Authentication error: Invalid token'));
	}
};
const io = new Server(server, {
	cors: {
		origin: ['https://adhyay-lime.vercel.app', 'http://localhost:5173'],
		methods: ['GET', 'POST']
	}
});

// Use the authentication middleware
io.use(authenticateSocket);
const populateUser = async (id: string) => {
	if (!id) {
		return '@ai';
	}
	const user = await User.findOne({ _id: id });
	return user?.email;
};
// Socket connection
io.on('connection', (socket: Socket) => {
	console.log('A user connected:', socket.user);
	const id = socket.project._id.toString();
	socket.join(id);
	socket.on('project-message', async (data) => {
		const msgData = {
			message: data.message,
			sender: data.sender,
			email: await populateUser(data.sender)
		};
	
		// Push msgData into the chats array of the corresponding chat document
		await Chat.updateOne(
			{ pid: id },
			{ $push: { chats: msgData } }
		);
	
		// Broadcast the message to other users in the project room
		socket.broadcast.to(id).emit('project-message', msgData);
	});

	socket.on('disconnect', () => {
		console.log('A user disconnected:', socket.user);
	});
});

// Database connection
connectDb()
	.then(() => {
		server.listen(port, () => {
			console.log(`Server is running at port ${port}`);
		});
	})
	.catch((err: Error) => {
		console.log(`Connection to the database failed due to ${err}`);
	});

app.use(errorHandler);
