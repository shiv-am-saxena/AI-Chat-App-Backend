import { Router } from 'express';
import { createProject, fetchProjects, deleteProject } from '../controllers/project.controller.js';
import { isLoggedin } from '../middlewares/isLoggedin.middleware.js';

const projectRouter = Router();


projectRouter.route('/all').get(isLoggedin,fetchProjects);
projectRouter.route('/create').post(isLoggedin,createProject);
projectRouter.route('/delete/:id').delete(isLoggedin,deleteProject);
export default projectRouter;
