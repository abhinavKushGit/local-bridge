import { Server, Socket } from 'socket.io';
import { MessageModel } from '../models/Message.model';
import { ConversationModel } from '../models/Conversation.model';
import { emitToUser } from '../services/socket.service';
import logger from '../utils/logger';

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const userId = (socket as any).userId;

  // Join a conversation room
  socket.on('chat:join', async ({ conversation_id }) => {
    try {
      const isParticipant = await ConversationModel.isParticipant(
        conversation_id, userId
      );
      if (!isParticipant) {
        socket.emit('error', { message: 'Not a participant in this conversation' });
        return;
      }

      socket.join(`conv:${conversation_id}`);

      // Mark all messages as read when joining
      await MessageModel.markRead(conversation_id, userId);

      socket.emit('chat:joined', { conversation_id });
      logger.debug(`User ${userId} joined conv:${conversation_id}`);
    } catch (err) {
      logger.error('chat:join error', err);
    }
  });

  // Send a message
  socket.on('chat:message', async ({ conversation_id, content, type = 'text' }) => {
    try {
      if (!content || !conversation_id) return;

      const isParticipant = await ConversationModel.isParticipant(
        conversation_id, userId
      );
      if (!isParticipant) {
        socket.emit('error', { message: 'Not a participant' });
        return;
      }

      // Save message to DB
      const message = await MessageModel.create({
        conversation_id,
        sender_id: userId,
        type,
        content,
      });

      // Update conversation's last message
      await ConversationModel.updateLastMessage(conversation_id, content);

      // Emit to everyone in the room (including sender)
      io.to(`conv:${conversation_id}`).emit('chat:message', message);

      // Get the other participant and notify them even if not in room
      const conversation = await ConversationModel.findById(conversation_id);
      if (conversation) {
        const otherId = conversation.participant_one === userId
          ? conversation.participant_two
          : conversation.participant_one;

        // Send notification event to the other user
        emitToUser(otherId, 'notification:new_message', {
          conversation_id,
          message,
          from: userId,
        });
      }

      logger.debug(`Message sent in conv:${conversation_id} by ${userId}`);
    } catch (err) {
      logger.error('chat:message error', err);
    }
  });

  // Leave a conversation room
  socket.on('chat:leave', ({ conversation_id }) => {
    socket.leave(`conv:${conversation_id}`);
    logger.debug(`User ${userId} left conv:${conversation_id}`);
  });

  // Mark messages as read
  socket.on('chat:read', async ({ conversation_id }) => {
    try {
      await MessageModel.markRead(conversation_id, userId);
      io.to(`conv:${conversation_id}`).emit('chat:read', {
        conversation_id,
        user_id: userId,
      });
    } catch (err) {
      logger.error('chat:read error', err);
    }
  });
};
