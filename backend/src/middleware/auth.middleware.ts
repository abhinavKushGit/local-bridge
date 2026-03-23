import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/responseFormatter';
import { query } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    phone: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    const result = await query(
      'SELECT id, phone, is_active FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'User not found', 401);
    }

    if (!result.rows[0].is_active) {
      return sendError(res, 'Account is deactivated', 401);
    }

    req.user = { userId: payload.userId, phone: payload.phone };
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};
