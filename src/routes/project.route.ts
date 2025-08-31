import { Router } from 'express';
import {
	createProject,
	fetchProjects,
	deleteProject,
	addUser,
	getProjectById,
	leaveProject
} from '../controllers/project.controller.js';
import { isLoggedIn } from '../middlewares/isLoggedin.middleware.js';

const projectRouter = Router();

projectRouter.route('/all').get(isLoggedIn, fetchProjects);
projectRouter.route('/create').post(isLoggedIn, createProject);
projectRouter.route('/delete/:id').delete(isLoggedIn, deleteProject);
projectRouter.route('/addUser').put(isLoggedIn, addUser);
projectRouter.route('/:id').get(isLoggedIn, getProjectById);
projectRouter.route('/leave').put(isLoggedIn, leaveProject);
export default projectRouter;
