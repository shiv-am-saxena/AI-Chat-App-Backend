import { Router } from 'express';
import { createProject } from '../controllers/project.controller.js';
import { isLoggedin } from '../middlewares/isLoggedin.middleware.js';

const projectRouter = Router();

projectRouter.route('/create').post(isLoggedin,createProject);
export default projectRouter;
