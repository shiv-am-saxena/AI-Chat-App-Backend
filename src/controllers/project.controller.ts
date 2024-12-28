import { Project } from '../models/project.model.js';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import { Chat } from '../models/chat.model.js';

// Ensure the interfaces are properly imported and used

// Create Project
const createProject = asyncHandler(async (req: Request, res: Response) => {
	const { name } = req.body;
	const userId = (req as any).user._id;

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

	// Create a new project
	const project = await Project.create({ projectName: name, users: [userId] });

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
	const projects = await Project.find({ users: { $in: userId } })
		.populate('users')
		.select('-password');
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
	const chat = await Chat.deleteOne({ pid: projectId });
	if (!projects) {
		throw new ApiError(500, 'Something went wrong while deleting your project');
	}
	if (!chat) {
		throw new ApiError(500, 'Someting went wrong, Failed to delete chats.');
	}
	res
		.status(200)
		.json(new apiResponse(200, projects, 'Project deleted successfully'));
});

// Add User to Project
const addUser = asyncHandler(async (req: Request, res: Response) => {
	const { id, pid } = req.body;

	if (
		!Array.isArray(id) ||
		id.length === 0 ||
		typeof pid === 'undefined' ||
		pid.trim() === ''
	) {
		throw new ApiError(
			400,
			'Invalid input: ID must be a non-empty array and PID is required'
		);
	}

	// Validate each ID in the array
	const validUsers = await User.find({ _id: { $in: id } });
	if (validUsers.length !== id.length) {
		throw new ApiError(400, 'One or more User IDs are invalid');
	}

	// Update the project with the valid IDs
	const project = await Project.findByIdAndUpdate(
		pid,
		{ $addToSet: { users: { $each: id } } },
		{ new: true, runValidators: true }
	);

	if (!project) {
		throw new ApiError(500, 'Error while adding users to the project');
	}

	res
		.status(200)
		.json(new apiResponse(200, project, 'Users added successfully'));
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
