import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotificationModel } from '../models/Notification.model';
import { sendSuccess, sendError } from '../utils/responseFormatter';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const offset = parseInt(req.query.offset as string) || 0;
    const notifications = await NotificationModel.findByUser(
      req.user!.userId, limit, offset
    );
    const unread = await NotificationModel.getUnreadCount(req.user!.userId);
    return sendSuccess(res, { notifications, unread_count: unread });
  } catch (err) {
    return sendError(res, 'Failed to fetch notifications', 500);
  }
};

export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    await NotificationModel.markRead(req.params.id, req.user!.userId);
    return sendSuccess(res, null, 'Marked as read');
  } catch (err) {
    return sendError(res, 'Failed to mark notification', 500);
  }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await NotificationModel.markAllRead(req.user!.userId);
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) {
    return sendError(res, 'Failed to mark notifications', 500);
  }
};
