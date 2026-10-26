import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUserPayload {
  _id: string;
  name: string;
  email: string;
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload | null;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('[Security Warning] JWT_SECRET is not configured in environment.');
    return res.status(500).json({ error: 'Authentication service configuration error.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthUserPayload;
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

export default authMiddleware;
