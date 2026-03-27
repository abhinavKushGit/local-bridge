import { query } from '../config/database';
import { SMSService } from './sms.service';
import { NotificationService } from './notification.service';
import logger from '../utils/logger';

// In dev mode use 30 seconds, in production use 30 minutes
const URGENCY_TIMEOUT_MS = process.env.DEV_MODE_OTP === 'true'
  ? 30 * 1000          // 30 seconds in dev
  : 30 * 60 * 1000;    // 30 minutes in production

export const UrgencyService = {

  // Called when a high urgency post is created
  scheduleEscalation: async (post_id: string): Promise<void> => {
    logger.info(`[URGENCY] Escalation scheduled for post ${post_id} in ${URGENCY_TIMEOUT_MS / 1000}s`);
  },

  // Check all high urgency posts that haven't been responded to
  processEscalations: async (): Promise<void> => {
    try {
      const cutoff = new Date(Date.now() - URGENCY_TIMEOUT_MS);

      // Find high urgency posts with no conversations started
      // and no SMS sent yet
      const result = await query(
        `SELECT p.*,
          ST_Y(p.location::geometry) as lat,
          ST_X(p.location::geometry) as lng
         FROM posts p
         WHERE p.urgency = 'high'
           AND p.status = 'active'
           AND p.sms_sent = FALSE
           AND p.created_at <= $1
           AND NOT EXISTS (
             SELECT 1 FROM conversations c
             WHERE c.post_id = p.id
           )`,
        [cutoff]
      );

      if (result.rows.length === 0) return;

      logger.info(`[URGENCY] Found ${result.rows.length} posts needing escalation`);

      for (const post of result.rows) {
        const sent = await SMSService.alertNearestUsers(
          post, post.lat, post.lng, 3000, 10
        );

        // Mark SMS as sent
        await query(
          `UPDATE posts SET sms_sent = TRUE, sms_sent_at = NOW() WHERE id = $1`,
          [post.id]
        );

        // Notify the post author that SMS was sent
        await NotificationService.send({
          user_id: post.user_id,
          type: 'urgency_alert',
          title: 'Help is being notified',
          body: `We've sent SMS to ${sent} nearby people about your urgent request.`,
          data: { post_id: post.id },
        });

        logger.info(`[URGENCY] Post ${post.id} escalated — ${sent} SMS sent`);
      }
    } catch (err) {
      logger.error('UrgencyService.processEscalations error:', err);
    }
  },
};
