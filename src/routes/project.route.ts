import { Router } from 'express';
import {
	createProject,
	fetchProjects,
	deleteProject,
	addUser,
	getProjectById
} from '../controllers/project.controller.js';
import { isLoggedin } from '../middlewares/isLoggedin.middleware.js';

const projectRouter = Router();

projectRouter.route('/all').get(isLoggedin, fetchProjects);
projectRouter.route('/create').post(isLoggedin, createProject);
projectRouter.route('/delete/:id').delete(isLoggedin, deleteProject);
projectRouter.route('/addUser').put(isLoggedin, addUser);
projectRouter.route('/:id').get(isLoggedin, getProjectById);
export default projectRouter;
