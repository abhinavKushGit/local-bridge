import { RatingModel } from '../models/Rating.model';
import { query } from '../config/database';
import logger from '../utils/logger';

export const TrustService = {

  // Recalculate trust score after a new rating
  recalculate: async (user_id: string): Promise<number> => {
    try {
      const { avg, count } = await RatingModel.getAverage(user_id);

      // Trust score formula:
      // avg rating (1-5) normalized to 0-1, weighted by exchange count
      const normalized = (avg - 1) / 4; // 0 to 1
      const countBonus = Math.min(count / 20, 0.2); // up to 0.2 bonus for 20+ ratings
      const score = Math.min(normalized + countBonus, 1.0);
      const rounded = Math.round(score * 100) / 100;

      await query(
        `UPDATE users SET trust_score = $2, total_exchanges = $3 WHERE id = $1`,
        [user_id, rounded, count]
      );

      logger.debug(`[TRUST] User ${user_id} score updated: ${rounded} (${count} ratings)`);
      return rounded;
    } catch (err) {
      logger.error('[TRUST] recalculate error:', err);
      return 0;
    }
  },

  getBadge: (score: number, exchanges: number): string => {
    if (exchanges === 0) return 'new';
    if (score >= 0.9 && exchanges >= 20) return 'champion';
    if (score >= 0.8 && exchanges >= 10) return 'trusted';
    if (score >= 0.6 && exchanges >= 5)  return 'reliable';
    if (exchanges >= 1)                   return 'active';
    return 'new';
  },
};
