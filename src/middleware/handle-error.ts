import express, { NextFunction } from 'express';
import { ErrorHandler } from '../utils/error.handler';

export function handleError(err: any, _req: express.Request, res: express.Response, next: NextFunction) {
  if (err) {
    const customError = ErrorHandler.handleCustomError('Something went wrong', err)
    return res.status(customError.statusCode).json({ status: 'error', error: customError.message });
  }
  next(err);
}