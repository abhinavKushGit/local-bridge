import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CategoryModel } from '../models/Category.model';
import { CategoryVoteModel } from '../models/CategoryVote.model';
import { CategoryEngineService } from '../services/categoryEngine.service';
import { SearchLogModel } from '../models/SearchLog.model';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await CategoryModel.findAll();
    return sendSuccess(res, { categories });
  } catch (err) {
    return sendError(res, 'Failed to fetch categories', 500);
  }
};

export const getPendingVotes = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await CategoryModel.findPendingVotes();

    // Attach vote counts and whether this user voted
    const enriched = await Promise.all(categories.map(async (c: any) => {
      const counts = await CategoryVoteModel.getCounts(c.id);
      const userVoted = await CategoryVoteModel.hasVoted(c.id, req.user!.userId);
      return { ...c, vote_yes: counts.yes, vote_no: counts.no, user_voted: userVoted };
    }));

    return sendSuccess(res, { categories: enriched });
  } catch (err) {
    return sendError(res, 'Failed to fetch votes', 500);
  }
};

export const castVote = async (req: AuthRequest, res: Response) => {
  try {
    const { vote } = req.body;
    if (typeof vote !== 'boolean') {
      return sendError(res, 'vote must be true or false', 400);
    }

    const { category, activated } = await CategoryEngineService.castVote(
      req.params.id,
      req.user!.userId,
      vote
    );

    return sendSuccess(
      res,
      { category, activated },
      activated ? `Category "${category.name}" is now live!` : 'Vote recorded'
    );
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to cast vote', 400);
  }
};

export const logSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { query: searchQuery, had_results, locality_id } = req.body;

    if (!searchQuery) return sendError(res, 'query is required', 400);

    await CategoryEngineService.logSearch({
      user_id: req.user!.userId,
      locality_id,
      query: searchQuery,
      had_results: had_results ?? false,
    });

    return sendSuccess(res, null, 'Search logged');
  } catch (err) {
    return sendError(res, 'Failed to log search', 500);
  }
};
