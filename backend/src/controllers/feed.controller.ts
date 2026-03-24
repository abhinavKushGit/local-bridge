import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PostModel } from '../models/Post.model';
import { CategoryModel } from '../models/Category.model';
import { UserModel } from '../models/User.model';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { feedQuerySchema } from '../utils/validators';
import logger from '../utils/logger';

export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = feedQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return sendError(res, 'Invalid query parameters', 422,
        parsed.error.flatten().fieldErrors);
    }

    const { lat, lng, radius, mode, category_id, urgency, limit, offset } = parsed.data;

    // Update user location silently
    UserModel.updateLocation(req.user!.userId, lat, lng).catch(() => {});

    const posts = await PostModel.findNearby({
      lat, lng,
      radius_meters: radius,
      mode, category_id, urgency,
      limit, offset,
    });

    return sendSuccess(res, {
      posts,
      count: posts.length,
      query: { lat, lng, radius_meters: radius },
    });
  } catch (err) {
    logger.error('getFeed error:', err);
    return sendError(res, 'Failed to fetch feed', 500);
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await CategoryModel.findAll();
    return sendSuccess(res, { categories });
  } catch (err) {
    return sendError(res, 'Failed to fetch categories', 500);
  }
};
