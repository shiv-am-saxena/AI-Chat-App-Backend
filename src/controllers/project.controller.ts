import { Project } from '../models/project.model.js';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { apiResponse } from '../utils/apiResponse.js';

const createProject = asyncHandler(async (req: Request, res: Response) => {
	const { name } = req.body;
	const userId = (req as any).user._id;
	if (
		[name].some((field) => field?.trim() === '' || typeof field === 'undefined')
	) {
		throw new ApiError(400, 'All feilds are required');
	} // checks if the user has provided the name of the project
	const project = await Project.create({ projectName: name, users: [userId] });

	if (!project) {
		throw new ApiError(500, 'Something went wrong while creating the project');
	}
	res
		.status(200)
		.json(new apiResponse(200, project, 'Project has been created successfully'));
});

export { createProject };
