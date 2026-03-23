import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';
import { sendError } from '../utils/responseFormatter';

export const otpRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const phone = req.body.phone;
  if (!phone) return next();

  const key = `otp_limit:${phone}`;
  try {
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.expire(key, 300); // 5 minute window
    }
    if (count > 3) {
      return sendError(
        res,
        'Too many OTP requests. Please wait 5 minutes.',
        429
      );
    }
    next();
  } catch {
    next();
  }
};
