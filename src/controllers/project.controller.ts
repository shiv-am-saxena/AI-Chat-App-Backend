import { Project } from '../models/project.model.js';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { User } from '../models/user.model.js';

const createProject = asyncHandler(async (req: Request, res: Response) => {
	const { name } = req.body;
	const userId = (req as any).user._id;
	if (
		[name].some((field) => field?.trim() === '' || typeof field === 'undefined')
	) {
		throw new ApiError(400, 'All feilds are required');
	} // checks if the user has provided the name of the project

	const existingName = await Project.findOne({ projectName: name });
	if (existingName) {
		throw new ApiError(400, 'Project with same name already exists');
	} //checks if the project already exist in the database
	const project = await Project.create({ projectName: name, users: [userId] });

	if (!project) {
		throw new ApiError(500, 'Something went wrong while creating the project');
	}
	res
		.status(200)
		.json(new apiResponse(200, project, 'Project has been created successfully'));
});
const fetchProjects = asyncHandler(async (req: Request, res: Response) => {
	const userId = (req as any).user._id;
	const projects = await Project.find({ users: { $in: userId } })
	if (!projects) {
		throw new ApiError(500, 'Something went wrong while fetching your projects');
	}
	res
		.status(200)
		.json(new apiResponse(200, projects, 'Projects fetched successfully'));
});
const deleteProject = asyncHandler(async (req: Request, res: Response) => {
	const projectId = req.params.id;
	const userId = (req as any).user._id;
	const projects = await Project.deleteOne({ _id: projectId, users: { $in: userId }  });
	if (!projects) {
		throw new ApiError(500, 'Something went wrong while deleting your project');
	}
	res
		.status(200)
		.json(new apiResponse(200, projects, 'Project deleted successfully'));
});
const addUser = asyncHandler(async (req: Request, res: Response) => {
	const { email, pid } = req.body;
	if (
		[email, pid].some(
			(feild) => feild?.trim() === '' || typeof feild === 'undefined'
		)
	) {
		throw new ApiError(400, 'All feilds are required');
	}
	const newUser = await User.findOne({ email });
	if (!newUser) {
		throw new ApiError(400, 'User Not Found');
	}
	const project = await Project.findByIdAndUpdate(
		{ _id: pid },
		{ $push: { users: newUser._id } },
		{ new: true, runValidators: true }
	);
	if (!project) {
		throw new ApiError(500, 'Error while adding user to the project');
	}
	res.status(200).json(new apiResponse(200, project, 'User added'));
});
export { createProject, fetchProjects, deleteProject, addUser };
