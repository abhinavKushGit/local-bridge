import { Server } from 'socket.io';
import logger from '../utils/logger';

let io: Server | null = null;

// Map of userId -> socketId for direct messaging
const userSockets = new Map<string, string>();

export const initSocketService = (socketServer: Server) => {
  io = socketServer;
  logger.info('Socket service initialised');
};

export const registerUser = (userId: string, socketId: string) => {
  userSockets.set(userId, socketId);
};

export const unregisterUser = (userId: string) => {
  userSockets.delete(userId);
};

export const getSocketId = (userId: string): string | undefined => {
  return userSockets.get(userId);
};

export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId);
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

export const emitToRoom = (room: string, event: string, data: any) => {
  if (!io) return;
  io.to(room).emit(event, data);
};

export const getOnlineUsers = (): string[] => {
  return Array.from(userSockets.keys());
};

export { io };
