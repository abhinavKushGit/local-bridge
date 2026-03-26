import { emitToUser } from '../services/socket.service';

export const notifyUser = (
  userId: string,
  type: string,
  data: any
): boolean => {
  return emitToUser(userId, `notification:${type}`, data) as boolean;
};
