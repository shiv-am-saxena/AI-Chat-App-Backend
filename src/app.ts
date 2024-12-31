import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRouter from './routes/auth.route.js';
import { isLoggedIn } from './middlewares/isLoggedin.middleware.js';
import { apiResponse } from './utils/apiResponse.js';
import projectRouter from './routes/project.route.js';
import chatRouter from './routes/chats.route.js';

const app = express();

// Middleware configuration
app.use(morgan('dev'));
app.use(
	cors({
		origin: ['https://adhyay-lime.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173'], 
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: ['Content-Type', 'Authorization']
	})
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
	res.status(200).json(new apiResponse(200, null, 'Welcome to the API'));
});

// Temporary endpoint for testing authentication
app.get('/temp', isLoggedIn, (req: Request, res: Response) => {
	const user = (req as any).user;
	res.status(200).json(new apiResponse(200, user, 'Success'));
});

// Route configurations
app.use('/auth', authRouter);
app.use('/project', projectRouter);
app.use('/chat', chatRouter);

export default app;
