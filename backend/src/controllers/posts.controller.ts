import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PostModel } from '../models/Post.model';
import { UserModel } from '../models/User.model';
import { GeoService } from '../services/geo.service';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, ...rest } = req.body;
    const user_id = req.user!.userId;

    // Update user's last known location
    await UserModel.updateLocation(user_id, lat, lng);

    const post = await PostModel.create({ user_id, lat, lng, ...rest });

    logger.info(`Post created: ${post.id} by user ${user_id} [${rest.mode}/${rest.urgency}]`);

    return sendSuccess(res, { post }, 'Post created successfully', 201);
  } catch (err) {
    logger.error('createPost error:', err);
    return sendError(res, 'Failed to create post', 500);
  }
};

export const getPost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) return sendError(res, 'Post not found', 404);

    // Increment view count (fire and forget)
    PostModel.incrementViewCount(post.id).catch(() => {});

    return sendSuccess(res, { post });
  } catch (err) {
    return sendError(res, 'Failed to fetch post', 500);
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await PostModel.update(
      req.params.id,
      req.user!.userId,
      req.body
    );
    if (!post) return sendError(res, 'Post not found or not yours', 404);
    return sendSuccess(res, { post }, 'Post updated');
  } catch (err) {
    return sendError(res, 'Failed to update post', 500);
  }
};

export const markFulfilled = async (req: AuthRequest, res: Response) => {
  try {
    const post = await PostModel.markFulfilled(req.params.id, req.user!.userId);
    if (!post) return sendError(res, 'Post not found or not yours', 404);
    return sendSuccess(res, { post }, 'Post marked as fulfilled');
  } catch (err) {
    return sendError(res, 'Failed to update post', 500);
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await PostModel.delete(req.params.id, req.user!.userId);
    if (!deleted) return sendError(res, 'Post not found or not yours', 404);
    return sendSuccess(res, null, 'Post removed');
  } catch (err) {
    return sendError(res, 'Failed to delete post', 500);
  }
};

export const getMyPosts = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const posts = await PostModel.findByUser(req.user!.userId, limit, offset);
    return sendSuccess(res, { posts, count: posts.length });
  } catch (err) {
    return sendError(res, 'Failed to fetch posts', 500);
  }
};
