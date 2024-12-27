import { User } from '../models/user.model.js';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import redisClient from '../services/redis.service.js';
// create the user in the database
const createUser = asyncHandler(async (req: Request, res: Response) => {
	const { fullName, email, password } = req.body;
	if (
		[fullName, email, password].some(
			(field) => field?.trim() === '' || typeof field === 'undefined'
		)
	) {
		throw new ApiError(400, 'All fields are required');
	} // Checks if user has filled all the field or not if not The API throws an error
	const existingUser = await User.findOne({ email });
	if (existingUser) {
		throw new ApiError(400, 'User already exists');
	} //checks if the user already exist in the database
	const pswd = await User.hashPassword(password); // hash the password in the encrypted form
	const user = await User.create({
		fullName,
		email,
		password: pswd
	});

	let usr = await User.findById(user._id).select('-password'); //Removing password field from the database response object
	if (!usr) {
		throw new ApiError(500, 'Something went wrong in registering the user');
	}
	const authToken: string = usr.genJWT(); // Generating JWT Auth Token for user at the time of registration

	if (!authToken) {
		throw new ApiError(500, 'Error in token generation');
	}
	res
		.status(201)
		.setHeader('Authorization', authToken)
		.cookie('authToken', authToken) // setting auth token as cookie
		.json(
			new apiResponse(
				200,
				{ token: authToken, user: usr },
				'User Registered Successfully'
			)
		);
});
// Login the user if the user in already existing in the database
const loginUser = asyncHandler(async (req: Request, res: Response) => {
	const { email, password } = req.body;
	if (
		[email, password].some((feild) => {
			feild?.trim() === '' || typeof feild === 'undefined';
		})
	) {
		throw new ApiError(401, 'All feilds are required');
	}
	const existingUser = await User.findOne({ email });
	if (!existingUser) {
		throw new ApiError(401, 'User not found');
	}
	const validPassword = await existingUser.isValidPassword(password);
	if (!validPassword) {
		throw new ApiError(401, 'Invalid Password');
	}
	const authToken = existingUser.genJWT();
	if (!authToken) {
		throw new ApiError(500, 'Error in token generation');
	}
	const user = await User.findById(existingUser._id).select('-password');
	res
		.status(200)
		.cookie('authToken', authToken)
		.json(
			new apiResponse(
				200,
				{ token: authToken, user },
				'User logged in successfully'
			)
		);
});
// Returns the user profile if user is logged in
const profile = asyncHandler(async (req: Request, res: Response) => {
	const user = await User.findById((req as any).user._id).select('-password');
	if (!user) {
		throw new ApiError(404, 'User not found');
	}
	res
		.status(200)
		.json(new apiResponse(200, user, 'User profile fetched successfully'));
});
const logout = asyncHandler(async (req: Request, res: Response) => {
	const authToken =
		req.cookies?.authToken || req.headers.authorization?.split(' ')[1];
	if (!authToken) {
		throw new ApiError(400, 'Auth token not found');
	}
	redisClient.set(authToken, 'logout', 'EX', 60 * 60 * 24);

	res
		.status(200)
		.clearCookie('authToken')
		.json(new apiResponse(200, 'Logged out successfully'));
});
const allUsers = asyncHandler(async (req: Request, res: Response) => {
	const id = (req as any).user._id;

	if(!id){
		throw new ApiError(400, 'Invalid User');
	}
	const allUser = await User.find({ _id: {$ne: id}});
	if(!allUser){
		throw new ApiError(500, 'Failed to fetch all users');
	}
	res.status(200).json(new apiResponse(200, allUser, 'Fetched all users successfully'));
});
export { createUser, loginUser, profile, logout, allUsers };
