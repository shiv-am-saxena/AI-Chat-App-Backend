import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRouter from './routes/auth.route.js';
import { isLoggedin } from './middlewares/isLoggedin.middleware.js';
import { apiResponse } from './utils/apiResponse.js';
import projectRouter from './routes/project.route.js';
import chatRouter from './routes/chats.route.js';
const app = express();
app.use(morgan('dev'));
app.use(
	cors()
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req: Request, res: Response) => {
	res.status(200);
});
app.get('/temp', isLoggedin, (req: Request, res: Response) => {
	const user = (req as any).user;
	res.status(200).json(new apiResponse(200, user, 'Success'));
});
app.use('/auth', authRouter);
app.use('/project', projectRouter);
app.use('/chat', chatRouter);
export default app;
