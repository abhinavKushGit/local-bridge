import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/responseFormatter';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return sendError(
        res,
        'Validation failed',
        422,
        result.error.flatten().fieldErrors
      );
    }
    req.body = result.data;
    next();
  };
