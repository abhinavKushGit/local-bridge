import cron from 'node-cron';
import { query } from '../config/database';
import logger from '../utils/logger';

export const startNotifBatchJob = () => {
  // Run every day at 8am — clean up old read notifications
  cron.schedule('0 8 * * *', async () => {
    try {
      const result = await query(
        `DELETE FROM notifications
         WHERE is_read = TRUE
           AND created_at < NOW() - INTERVAL '30 days'`
      );
      logger.info(`[JOB] Cleaned ${result.rowCount} old notifications`);

      // Also clean expired OTPs
      await query(`SELECT cleanup_expired_otps()`);
      logger.info('[JOB] Cleaned expired OTPs');
    } catch (err) {
      logger.error('[JOB] notifBatch error:', err);
    }
  });

  logger.info('[JOB] Notification batch job started');
};
