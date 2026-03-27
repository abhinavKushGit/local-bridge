import { NotificationModel } from '../models/Notification.model';
import { emitToUser } from './socket.service';
import logger from '../utils/logger';

export const NotificationService = {

  // Send to a single user — saves to DB + emits via socket
  send: async (data: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  }): Promise<void> => {
    try {
      // Save to database
      const notif = await NotificationModel.create(data);

      // Emit via WebSocket if user is online
      emitToUser(data.user_id, 'notification:new', notif);

      // FCM push will be added on Day 8 when mobile is set up
      // For now dev mode just logs
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`[NOTIF] → ${data.user_id} | ${data.title}: ${data.body}`);
      }
    } catch (err) {
      logger.error('NotificationService.send error:', err);
    }
  },

  // Send to multiple users at once
  sendBulk: async (notifications: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  }[]): Promise<void> => {
    try {
      await NotificationModel.createBulk(notifications);

      // Emit to each user if online
      for (const n of notifications) {
        emitToUser(n.user_id, 'notification:new', n);
      }

      logger.info(`[NOTIF BULK] Sent ${notifications.length} notifications`);
    } catch (err) {
      logger.error('NotificationService.sendBulk error:', err);
    }
  },

  // Notify nearby users about a new post
  notifyNearbyUsers: async (post: any, nearbyUsers: any[]): Promise<void> => {
    const modeLabels: Record<string, string> = {
      need: 'needs help nearby',
      offer: 'is offering something nearby',
      sell: 'is selling nearby',
      volunteer: 'is volunteering nearby',
      alert: 'Community alert nearby',
      request: 'has a request nearby',
    };

    const notifications = nearbyUsers
      .filter(u => u.id !== post.user_id) // don't notify the poster
      .map(u => ({
        user_id: u.id,
        type: 'new_nearby_post',
        title: `New ${post.mode} nearby`,
        body: `${post.title} — ${Math.round(u.distance_meters)}m away`,
        data: { post_id: post.id, mode: post.mode, urgency: post.urgency },
      }));

    await NotificationService.sendBulk(notifications);
  },
};
