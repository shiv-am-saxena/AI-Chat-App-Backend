import { Router } from 'express';
import { fetchChat } from '../controllers/chat.controller.js';
import { isLoggedin } from '../middlewares/isLoggedin.middleware.js';

const chatRouter = Router();

chatRouter.route('/:pid').get(isLoggedin, fetchChat);
export default chatRouter;
