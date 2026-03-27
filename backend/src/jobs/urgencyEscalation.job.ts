import cron from 'node-cron';
import { UrgencyService } from '../services/urgency.service';
import logger from '../utils/logger';

export const startUrgencyEscalationJob = () => {
  // Run every minute in dev, every 5 minutes in production
  const schedule = process.env.DEV_MODE_OTP === 'true' ? '* * * * *' : '*/5 * * * *';

  cron.schedule(schedule, async () => {
    logger.debug('[JOB] Running urgency escalation check...');
    await UrgencyService.processEscalations();
  });

  logger.info(`[JOB] Urgency escalation job started (schedule: ${schedule})`);
};
