import { CategoryModel } from '../models/Category.model';
import { CategoryVoteModel } from '../models/CategoryVote.model';
import { SearchLogModel } from '../models/SearchLog.model';
import { NotificationService } from './notification.service';
import { query } from '../config/database';
import logger from '../utils/logger';

// In dev mode use 3 searches, in production use 50
const VOTE_THRESHOLD = process.env.DEV_MODE_OTP === 'true' ? 3 : 50;

export const CategoryEngineService = {

  // Log a search — if no results, track for threshold
  logSearch: async (data: {
    user_id?: string;
    locality_id?: string;
    query: string;
    had_results: boolean;
  }): Promise<void> => {
    if (!data.query || data.query.trim().length < 2) return;
    await SearchLogModel.log(data);
  },

  // Run threshold check — called by cron job daily
  checkThresholds: async (): Promise<void> => {
    try {
      logger.info('[CATEGORY ENGINE] Running threshold check...');

      const candidates = await SearchLogModel.getAboveThreshold(VOTE_THRESHOLD, 7);

      if (candidates.length === 0) {
        logger.info('[CATEGORY ENGINE] No new categories to surface');
        return;
      }

      logger.info(`[CATEGORY ENGINE] Found ${candidates.length} candidates`);

      for (const candidate of candidates) {
        const name = candidate.query
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        const slug = CategoryModel.slugify(candidate.query);

        // Create a pending vote category
        const category = await CategoryModel.createPendingVote({
          name,
          slug,
          locality_id: candidate.locality_id,
        });

        logger.info(`[CATEGORY ENGINE] Vote created for "${name}" (${candidate.unique_users} searches)`);

        // Notify users in that locality about the vote
        if (candidate.locality_id) {
          const usersResult = await query(
            `SELECT id FROM users WHERE locality_id = $1 AND is_active = TRUE LIMIT 200`,
            [candidate.locality_id]
          );

          const notifications = usersResult.rows.map((u: any) => ({
            user_id: u.id,
            type: 'category_vote',
            title: `Should "${name}" become a category?`,
            body: `${candidate.unique_users} people near you searched for "${candidate.query}". Vote to add it!`,
            data: { category_id: category.id, category_name: name },
          }));

          await NotificationService.sendBulk(notifications);
        }
      }
    } catch (err) {
      logger.error('[CATEGORY ENGINE] checkThresholds error:', err);
    }
  },

  // Cast a vote and check if category should go live
  castVote: async (
    category_id: string,
    user_id: string,
    vote: boolean
  ): Promise<{ category: any; activated: boolean }> => {
    const category = await CategoryModel.findById(category_id);
    if (!category) throw new Error('Category not found');
    if (category.status !== 'pending_vote') throw new Error('Voting is closed');

    await CategoryVoteModel.castVote(category_id, user_id, vote);

    const counts = await CategoryVoteModel.getCounts(category_id);
    await CategoryModel.updateVoteCount(category_id, counts.yes, counts.no);

    // Check if vote period ended or yes votes exceed threshold
    const totalVotes = counts.yes + counts.no;
    const yesPercent = totalVotes > 0 ? (counts.yes / totalVotes) * 100 : 0;
    const votingEnded = new Date() > new Date(category.vote_ends_at);
    const strongYes = counts.yes >= 10 && yesPercent >= 60;

    let activated = false;

    if (strongYes || (votingEnded && yesPercent >= 50 && totalVotes >= 5)) {
      await CategoryModel.activate(category_id);
      activated = true;

      logger.info(`[CATEGORY ENGINE] "${category.name}" activated! (${counts.yes} yes, ${counts.no} no)`);

      // Notify everyone who voted yes
      const votersResult = await query(
        `SELECT user_id FROM category_votes
         WHERE category_id = $1 AND vote = TRUE`,
        [category_id]
      );

      const notifications = votersResult.rows.map((v: any) => ({
        user_id: v.user_id,
        type: 'category_live',
        title: `"${category.name}" is now live!`,
        body: `The community voted and "${category.name}" is now a category in your area.`,
        data: { category_id, category_name: category.name },
      }));

      await NotificationService.sendBulk(notifications);

    } else if (votingEnded && yesPercent < 50) {
      await CategoryModel.reject(category_id);
      logger.info(`[CATEGORY ENGINE] "${category.name}" rejected (${yesPercent.toFixed(0)}% yes)`);
    }

    const updated = await CategoryModel.findById(category_id);
    return { category: updated, activated };
  },
};
