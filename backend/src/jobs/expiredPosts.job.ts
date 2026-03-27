import cron from 'node-cron';
import { query } from '../config/database';
import logger from '../utils/logger';

export const startExpiredPostsJob = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await query(
        `UPDATE posts SET status = 'expired'
         WHERE status = 'active'
           AND expires_at IS NOT NULL
           AND expires_at < NOW()`
      );
      logger.info(`[JOB] Expired ${result.rowCount} posts`);
    } catch (err) {
      logger.error('[JOB] expiredPosts error:', err);
    }
  });

  logger.info('[JOB] Expired posts job started');
};
