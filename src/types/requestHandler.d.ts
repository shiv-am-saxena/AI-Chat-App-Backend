import { Request, Response, NextFunction } from 'express';

export interface RequestHandler {
	(req: Request, res: Response, next: NextFunction): void | Promise<void>;
}
