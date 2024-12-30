import { Request, Response } from 'express';
import { Chat } from '../models/chat.model.js';
import { ApiError } from '../utils/ApiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import flashResult from '../services/gemini.service.js';
const fetchChat = asyncHandler(async (req: Request, res: Response) => {
	const projectId = req.params.pid;
	if (!projectId) {
		throw new ApiError(401, 'Project Id is required');
	}
	const chat = await Chat.findOne({ pid: projectId });
	if (!chat) {
		throw new ApiError(500, 'Failed to fetch chats');
	}
	res
		.status(200)
		.json(new apiResponse(200, chat.chats, 'Chats fetched successfully'));
});
const getAiRes = asyncHandler(async (req: Request, res: Response) => {
	const { prompt } = req.query;
	if (!prompt) {
		throw new ApiError(405, 'Prompt not given');
	}
	const result = await flashResult(prompt as string);
	if (!result) {
		throw new ApiError(500, 'Generation Failed');
	}
	res.status(200).json(new apiResponse(200, result, 'Result Generated'));
});
export { fetchChat, getAiRes };
