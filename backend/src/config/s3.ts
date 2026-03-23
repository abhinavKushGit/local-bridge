import logger from '../utils/logger';

// Cloudinary/S3 will be wired on Day 3
// Placeholder so imports don't break
export const uploadFile = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  logger.warn('Storage not configured — returning placeholder URL');
  return `https://placeholder.localbridge.app/${filename}`;
};
