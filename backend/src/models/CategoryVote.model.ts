import { query } from '../config/database';

export const CategoryVoteModel = {

  castVote: async (
    category_id: string,
    user_id: string,
    vote: boolean
  ): Promise<any> => {
    const result = await query(
      `INSERT INTO category_votes (category_id, user_id, vote)
       VALUES ($1, $2, $3)
       ON CONFLICT (category_id, user_id)
       DO UPDATE SET vote = $3
       RETURNING *`,
      [category_id, user_id, vote]
    );
    return result.rows[0];
  },

  hasVoted: async (category_id: string, user_id: string): Promise<boolean> => {
    const result = await query(
      `SELECT id FROM category_votes
       WHERE category_id = $1 AND user_id = $2`,
      [category_id, user_id]
    );
    return result.rows.length > 0;
  },

  getCounts: async (category_id: string): Promise<{ yes: number; no: number }> => {
    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE vote = TRUE)  as yes_count,
        COUNT(*) FILTER (WHERE vote = FALSE) as no_count
       FROM category_votes
       WHERE category_id = $1`,
      [category_id]
    );
    return {
      yes: parseInt(result.rows[0].yes_count),
      no:  parseInt(result.rows[0].no_count),
    };
  },
};
