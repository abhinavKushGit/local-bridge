import { sendSMS } from '../config/twilio';
import { GeoService } from './geo.service';
import logger from '../utils/logger';

export const SMSService = {

  // Send SMS to the N nearest opted-in users
  alertNearestUsers: async (
    post: any,
    lat: number,
    lng: number,
    radiusMeters: number = 3000,
    limit: number = 10
  ): Promise<number> => {
    try {
      const nearestUsers = await GeoService.getNearestUsers(
        lat, lng, radiusMeters, limit, true // smsOptInOnly = true
      );

      // Filter out the post author
      const targets = nearestUsers.filter(u => u.id !== post.user_id);

      if (targets.length === 0) {
        logger.warn(`No SMS targets found for post ${post.id}`);
        return 0;
      }

      const modeEmoji: Record<string, string> = {
        need: '🆘', offer: '🤝', sell: '🏷️',
        volunteer: '🙋', alert: '⚠️', request: '📋',
      };

      const emoji = modeEmoji[post.mode] || '📍';
      const message = `${emoji} LocalBridge URGENT: "${post.title}" — ${Math.round(targets[0]?.distance_meters || 0)}m from you. Open app to help. Reply STOP to opt out.`;

      let sent = 0;
      for (const user of targets) {
        const success = await sendSMS(user.phone, message);
        if (success) sent++;
      }

      logger.info(`SMS sent to ${sent}/${targets.length} users for urgent post ${post.id}`);
      return sent;
    } catch (err) {
      logger.error('SMSService.alertNearestUsers error:', err);
      return 0;
    }
  },
};
