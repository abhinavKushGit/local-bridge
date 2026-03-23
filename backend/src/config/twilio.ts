import logger from '../utils/logger';

// Twilio will be wired on Day 5
// In dev mode, OTPs are printed to console instead
export const sendSMS = async (to: string, body: string): Promise<boolean> => {
  if (process.env.DEV_MODE_OTP === 'true') {
    logger.info(`[DEV SMS] To: ${to} | Message: ${body}`);
    return true;
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    logger.warn('Twilio not configured');
    return false;
  }

  try {
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return true;
  } catch (err) {
    logger.error('Twilio SMS failed:', err);
    return false;
  }
};
