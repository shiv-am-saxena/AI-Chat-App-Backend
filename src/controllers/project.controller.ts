import { Project } from '../models/project.model.js';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

// Ensure the interfaces are properly imported and used
import { IUser } from '../models/user.model';
import { IProject } from '../models/project.model';

// Create Project
const createProject = asyncHandler(async (req: Request, res: Response) => {
	const { name } = req.body;
	const email = (req as any).user.email;

	// Validate fields
	if (
		[name].some((field) => field?.trim() === '' || typeof field === 'undefined')
	) {
		throw new ApiError(400, 'All fields are required');
	}

	// Check if the project name already exists
	const existingName = await Project.findOne({ projectName: name });
	if (existingName) {
		throw new ApiError(400, 'Project with the same name already exists');
	}

	// Find the user by email
	const user = (await User.findOne({ email })) as IUser;
	const userId = user?._id;

	// Create a new project
	const project = (await Project.create({ projectName: name, users: [userId] }));

	if (!project) {
		throw new ApiError(500, 'Something went wrong while creating the project');
	}

	// Send response
	res
		.status(200)
		.json(new apiResponse(200, project, 'Project has been created successfully'));
});

// Fetch Projects
const fetchProjects = asyncHandler(async (req: Request, res: Response) => {
	const userId = (req as any).user._id;
	const projects = await Project.find({ users: { $in: userId } }).populate('users');
	if (!projects) {
		throw new ApiError(500, 'Something went wrong while fetching your projects');
	}
	res
		.status(200)
		.json(new apiResponse(200, projects, 'Projects fetched successfully'));
});

// Delete Project
const deleteProject = asyncHandler(async (req: Request, res: Response) => {
	const projectId = req.params.id;
	const userId = (req as any).user._id;
	const projects = await Project.deleteOne({
		_id: projectId,
		users: { $in: userId }
	});
	if (!projects) {
		throw new ApiError(500, 'Something went wrong while deleting your project');
	}
	res
		.status(200)
		.json(new apiResponse(200, projects, 'Project deleted successfully'));
});

// Add User to Project
const addUser = asyncHandler(async (req: Request, res: Response) => {
	const { email, pid } = req.body;
	if (
		[email, pid].some(
			(field) => field?.trim() === '' || typeof field === 'undefined'
		)
	) {
		throw new ApiError(400, 'All fields are required');
	}
	const newUser = await User.findOne({ email });
	if (!newUser) {
		throw new ApiError(400, 'User Not Found');
	}
	const project = await Project.findByIdAndUpdate(
		pid,
		{ $push: { users: newUser._id } },
		{ new: true, runValidators: true }
	);
	if (!project) {
		throw new ApiError(500, 'Error while adding user to the project');
	}
	res.status(200).json(new apiResponse(200, project, 'User added'));
});

// Get Project by ID
const getProjectById = asyncHandler(async (req: Request, res: Response) => {
	const projectId = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(projectId)) {
		throw new ApiError(400, 'Invalid Project ID');
	}
	const project = await Project.findById(projectId).populate('users');
	if (!project) {
		throw new ApiError(500, 'Failed to fetch the project');
	}
	res
		.status(200)
		.json(new apiResponse(200, project, 'Project fetched successfully'));
});

export { createProject, fetchProjects, deleteProject, addUser, getProjectById };
