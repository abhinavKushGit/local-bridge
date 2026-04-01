import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { RatingModel } from '../models/Rating.model';
import { TrustService } from '../services/trust.service';
import { NotificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/responseFormatter';

export const rateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { to_user_id, conversation_id, score, tags, comment } = req.body;

    if (to_user_id === req.user!.userId) {
      return sendError(res, 'Cannot rate yourself', 400);
    }
    if (!score || score < 1 || score > 5) {
      return sendError(res, 'Score must be between 1 and 5', 400);
    }

    const rating = await RatingModel.create({
      from_user_id: req.user!.userId,
      to_user_id, conversation_id, score, tags, comment,
    });

    // Recalculate trust score
    const newScore = await TrustService.recalculate(to_user_id);

    // Notify the rated user
    await NotificationService.send({
      user_id: to_user_id,
      type: 'rating_received',
      title: 'You received a rating',
      body: `Someone rated you ${score}/5 stars. Your trust score is now ${newScore}.`,
      data: { rating_id: rating.id, score, new_trust_score: newScore },
    });

    return sendSuccess(res, { rating, new_trust_score: newScore }, 'Rating submitted');
  } catch (err) {
    return sendError(res, 'Failed to submit rating', 500);
  }
};

export const getUserRatings = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.params.id || req.user!.userId;
    const ratings = await RatingModel.getForUser(user_id);
    const { avg, count } = await RatingModel.getAverage(user_id);
    const badge = TrustService.getBadge(avg / 5, count);
    return sendSuccess(res, { ratings, average: avg, count, badge });
  } catch (err) {
    return sendError(res, 'Failed to fetch ratings', 500);
  }
};
