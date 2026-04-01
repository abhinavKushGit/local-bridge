import cron from 'node-cron';
import { CategoryEngineService } from '../services/categoryEngine.service';
import logger from '../utils/logger';

export const startCategoryThresholdJob = () => {
  // Dev: every 2 minutes | Production: daily at 6am
  const schedule = process.env.DEV_MODE_OTP === 'true'
    ? '*/2 * * * *'
    : '0 6 * * *';

  cron.schedule(schedule, async () => {
    logger.debug('[JOB] Running category threshold check...');
    await CategoryEngineService.checkThresholds();
  });

  logger.info(`[JOB] Category threshold job started (schedule: ${schedule})`);
};
