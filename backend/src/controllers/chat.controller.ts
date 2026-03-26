import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ConversationModel } from '../models/Conversation.model';
import { MessageModel } from '../models/Message.model';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const startConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { post_id, other_user_id } = req.body;
    const user_id = req.user!.userId;

    if (user_id === other_user_id) {
      return sendError(res, 'Cannot start conversation with yourself', 400);
    }

    const { conversation, created } = await ConversationModel.findOrCreate(
      post_id, user_id, other_user_id
    );

    return sendSuccess(
      res,
      { conversation, created },
      created ? 'Conversation started' : 'Conversation already exists'
    );
  } catch (err) {
    logger.error('startConversation error:', err);
    return sendError(res, 'Failed to start conversation', 500);
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await ConversationModel.findByUser(req.user!.userId);
    const unread_total = await MessageModel.getUnreadCount(req.user!.userId);
    return sendSuccess(res, { conversations, unread_total });
  } catch (err) {
    return sendError(res, 'Failed to fetch conversations', 500);
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const before_id = req.query.before_id as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const isParticipant = await ConversationModel.isParticipant(id, req.user!.userId);
    if (!isParticipant) return sendError(res, 'Not a participant', 403);

    const messages = await MessageModel.findByConversation(id, limit, before_id);

    // Mark as read
    await MessageModel.markRead(id, req.user!.userId);

    return sendSuccess(res, { messages, count: messages.length });
  } catch (err) {
    return sendError(res, 'Failed to fetch messages', 500);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, type } = req.body;

    const isParticipant = await ConversationModel.isParticipant(id, req.user!.userId);
    if (!isParticipant) return sendError(res, 'Not a participant', 403);

    const message = await MessageModel.create({
      conversation_id: id,
      sender_id: req.user!.userId,
      type: type || 'text',
      content,
    });

    await ConversationModel.updateLastMessage(id, content);

    return sendSuccess(res, { message }, 'Message sent', 201);
  } catch (err) {
    return sendError(res, 'Failed to send message', 500);
  }
};
