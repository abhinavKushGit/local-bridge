import { Server, Socket } from 'socket.io';
import { isUserOnline } from '../services/socket.service';
import logger from '../utils/logger';

export const registerPresenceHandlers = (io: Server, socket: Socket) => {
  const userId = (socket as any).userId;

  // Typing indicator
  socket.on('chat:typing', ({ conversation_id, is_typing }) => {
    socket.to(`conv:${conversation_id}`).emit('chat:typing', {
      conversation_id,
      user_id: userId,
      is_typing,
    });
  });

  // Check if a user is online
  socket.on('presence:check', ({ user_id }, callback) => {
    if (typeof callback === 'function') {
      callback({ user_id, online: isUserOnline(user_id) });
    }
  });

  // Broadcast online status when connecting
  socket.broadcast.emit('presence:online', { user_id: userId });

  // Broadcast offline status when disconnecting
  socket.on('disconnect', () => {
    socket.broadcast.emit('presence:offline', { user_id: userId });
  });
};
