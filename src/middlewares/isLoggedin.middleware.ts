import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import redisClient from '../services/redis.service.js';
import jwt from 'jsonwebtoken';

const isLoggedIn = asyncHandler(
	async (req: Request, res: Response, next: NextFunction) => {
		const token =
			req.cookies.authToken || req.headers.authorization?.split(' ')[1];

		//Early exit for missing token
		if (!token) {
			throw new ApiError(401, 'Unauthorized: Missing Token');
		}

		//Check Blacklist First (for performance)
		const isBlacklisted = await redisClient.get(token);
		if (isBlacklisted) {
			throw new ApiError(401, 'Unauthorized: Token Blacklisted');
		}

		try {
			const payload = jwt.verify(token, `${process.env.ACCESS_TOKEN_SECRET}`) as {
				id: string;
				email: string;
			};
			const user = await User.findById(payload.id).select('-password');

			if (!user) {
				throw new ApiError(401, 'Unauthorized: User not found');
			}

			(req as any).user = user; //Augment Request Object
			next();
		} catch (error: any) {
			//Handle Specific Errors for better debugging
			if (error instanceof ApiError) {
				throw error; //Re-throw ApiError for consistent error handling
			} else if (error.name === 'TokenExpiredError') {
				throw new ApiError(401, 'Unauthorized: Token Expired');
			} else if (error.name === 'JsonWebTokenError') {
				throw new ApiError(401, 'Unauthorized: Invalid Token');
			}
			throw new ApiError(500, 'Internal Server Error during authentication'); //Generic Server Error
		}
	}
);

export { isLoggedIn };
