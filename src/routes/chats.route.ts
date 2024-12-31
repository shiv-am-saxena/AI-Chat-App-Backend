import { Router } from 'express';
import { fetchChat, getAiRes } from '../controllers/chat.controller.js';
import { isLoggedIn } from '../middlewares/isLoggedin.middleware.js';

const chatRouter = Router();

chatRouter.route('/get/:pid').get(isLoggedIn, fetchChat);
chatRouter.route('/gen-ai').get(getAiRes);
export default chatRouter;
