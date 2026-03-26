import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { registerUser, unregisterUser, initSocketService } from '../services/socket.service';
import { registerChatHandlers } from './chat.socket';
import { registerPresenceHandlers } from './presence.socket';
import logger from '../utils/logger';

export const initSockets = (io: Server) => {
  initSocketService(io);

  // Auth middleware — every socket connection must have a valid JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ||
                  socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('No token provided'));
    }

    try {
      const payload = verifyToken(token);
      (socket as any).userId = payload.userId;
      (socket as any).phone = payload.phone;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    logger.info(`Socket connected: ${userId} (${socket.id})`);

    // Register this socket for direct messaging
    registerUser(userId, socket.id);

    // Register event handlers
    registerChatHandlers(io, socket);
    registerPresenceHandlers(io, socket);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
      unregisterUser(userId);
    });
  });

  logger.info('Socket.io initialised');
};
