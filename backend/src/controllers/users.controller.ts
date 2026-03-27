import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserModel } from '../models/User.model';
import { sendSuccess, sendError } from '../utils/responseFormatter';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id || req.user!.userId);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, { user });
  } catch (err) {
    return sendError(res, 'Failed to fetch profile', 500);
  }
};

export const updateSmsOptIn = async (req: AuthRequest, res: Response) => {
  try {
    const { sms_opt_in } = req.body;
    if (typeof sms_opt_in !== 'boolean') {
      return sendError(res, 'sms_opt_in must be true or false', 400);
    }
    const user = await UserModel.updateProfile(req.user!.userId, { sms_opt_in });
    return sendSuccess(res, { user }, `SMS alerts ${sms_opt_in ? 'enabled' : 'disabled'}`);
  } catch (err) {
    return sendError(res, 'Failed to update SMS preference', 500);
  }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return sendError(res, 'lat and lng required', 400);
    await UserModel.updateLocation(req.user!.userId, lat, lng);
    return sendSuccess(res, null, 'Location updated');
  } catch (err) {
    return sendError(res, 'Failed to update location', 500);
  }
};
