import { Router } from 'express';
import {
	allUsers,
	createUser,
	loginUser,
	logout,
	profile
} from '../controllers/auth.controller.js';
import { isLoggedIn } from '../middlewares/isLoggedin.middleware.js';

const authRouter = Router();

authRouter.route('/signup').post(createUser);
authRouter.route('/signin').post(loginUser);
authRouter.route('/profile').get(isLoggedIn, profile);
authRouter.route('/logout').get(isLoggedIn, logout);
authRouter.route('/all').get(isLoggedIn, allUsers);
export default authRouter;
