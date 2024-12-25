import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import redisClient from '../services/redis.service.js';
export const isLoggedin = asyncHandler(
	async (req: Request, res: Response, next: NextFunction) => {
		const token =
			req.cookies.authToken || req.headers.authorization?.split(' ')[1];
		if (!token) {
			throw new ApiError(401, 'Unauthorized User');
		}
		const isBlacklisted = await redisClient.get(token);
		if (isBlacklisted) {
			throw new ApiError(401, 'Unauthorized user');
		}
		jwt.verify(
			token,
			`${process.env.ACCESS_TOKEN_SECRET}`,
			async (err: any, payload: any) => {
				if (err) {
					throw new ApiError(401, 'Unauthorized User');
				}
				const { id, email } = payload;
				const user = await User.findById(id).select('-password');
				if (!user) {
					throw new ApiError(401, 'Unauthorized user');
				}
				(req as any).user = user;
				next();
			}
		);
	}
);
