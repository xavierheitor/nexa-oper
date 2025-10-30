import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-storage-key'];

  if (!key || key !== config.storageKey) {
    return res.status(401).json({ error: 'Unauthorized - Invalid storage key' });
  }

  next();
}

