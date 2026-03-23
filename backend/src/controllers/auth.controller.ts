import { Request, Response } from 'express';
import { query } from '../config/database';
import { UserModel } from '../models/User.model';
import { signToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { sendSMS } from '../config/twilio';
import logger from '../utils/logger';

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (req: Request, res: Response) => {
  const { phone } = req.body;

  try {
    // Invalidate any existing unused OTPs for this phone
    await query(
      'UPDATE otp_codes SET used = TRUE WHERE phone = $1 AND used = FALSE',
      [phone]
    );

    const code = generateOTP();
    const expiresAt = new Date(
      Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '5') * 60 * 1000)
    );

    await query(
      'INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
      [phone, code, expiresAt]
    );

    await sendSMS(phone, `Your LocalBridge OTP is: ${code}. Valid for 5 minutes.`);

    logger.info(`OTP sent to ${phone}`);

    return sendSuccess(res, { phone }, 'OTP sent successfully');
  } catch (err) {
    logger.error('sendOTP error:', err);
    return sendError(res, 'Failed to send OTP', 500);
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { phone, code } = req.body;

  try {
    const result = await query(
      `SELECT * FROM otp_codes
       WHERE phone = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );

    if (result.rows.length === 0) {
      // Increment attempts
      await query(
        `UPDATE otp_codes SET attempts = attempts + 1
         WHERE phone = $1 AND used = FALSE`,
        [phone]
      );
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    // Mark OTP as used
    await query('UPDATE otp_codes SET used = TRUE WHERE id = $1', [
      result.rows[0].id,
    ]);

    // Get or create user
    let user = await UserModel.findByPhone(phone);
    const isNewUser = !user;

    if (!user) {
      user = await UserModel.create(phone);
      logger.info(`New user created: ${phone}`);
    } else {
      await UserModel.updateLastSeen(user.id);
    }

    const token = signToken({ userId: user.id, phone: user.phone });

    return sendSuccess(
      res,
      { token, user, isNewUser },
      isNewUser ? 'Account created successfully' : 'Login successful'
    );
  } catch (err) {
    logger.error('verifyOTP error:', err);
    return sendError(res, 'Verification failed', 500);
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, { user });
  } catch (err) {
    return sendError(res, 'Failed to fetch profile', 500);
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, bio, home_address, radius_meters, sms_opt_in } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (home_address !== undefined) updates.home_address = home_address;
    if (radius_meters !== undefined) updates.radius_meters = radius_meters;
    if (sms_opt_in !== undefined) updates.sms_opt_in = sms_opt_in;

    const user = await UserModel.updateProfile(req.user.userId, updates);
    return sendSuccess(res, { user }, 'Profile updated');
  } catch (err) {
    return sendError(res, 'Failed to update profile', 500);
  }
};
