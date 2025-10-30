import { Request, Response, NextFunction } from 'express';

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Storage Error:', error);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}

