import { startUrgencyEscalationJob } from './urgencyEscalation.job';
import { startExpiredPostsJob } from './expiredPosts.job';
import { startNotifBatchJob } from './notifBatch.job';
import logger from '../utils/logger';

export const startAllJobs = () => {
  logger.info('[SCHEDULER] Starting all background jobs...');
  startUrgencyEscalationJob();
  startExpiredPostsJob();
  startNotifBatchJob();
  logger.info('[SCHEDULER] All jobs started');
};
