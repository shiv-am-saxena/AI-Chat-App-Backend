import { Router } from 'express';
import { createUser, loginUser, logout, profile } from '../controllers/auth.controller.js';
import { isLoggedin } from '../middlewares/isLoggedin.middleware.js';

const authRouter = Router();

authRouter.route('/signup').post(createUser);
authRouter.route('/signin').post(loginUser);
authRouter.route('/profile').get(isLoggedin ,profile);
authRouter.route('/logout').get(isLoggedin ,logout);
export default authRouter;
