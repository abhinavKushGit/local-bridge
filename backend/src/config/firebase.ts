import logger from '../utils/logger';

// Firebase will be initialised on Day 8 when we set up push notifications
// For now this is a placeholder that won't throw errors
let firebaseAdmin: any = null;

export const initFirebase = () => {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID === ''
  ) {
    logger.warn('Firebase not configured — push notifications disabled');
    return;
  }
  logger.info('Firebase initialised');
};

export default firebaseAdmin;
