import { query } from '../config/database';

export const RatingModel = {

  create: async (data: {
    from_user_id: string;
    to_user_id: string;
    conversation_id?: string;
    score: number;
    tags?: string[];
    comment?: string;
  }): Promise<any> => {
    const result = await query(
      `INSERT INTO ratings
         (from_user_id, to_user_id, conversation_id, score, tags, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (from_user_id, conversation_id)
       DO UPDATE SET score = $4, tags = $5, comment = $6
       RETURNING *`,
      [
        data.from_user_id, data.to_user_id,
        data.conversation_id || null, data.score,
        data.tags || [], data.comment || null,
      ]
    );
    return result.rows[0];
  },

  getForUser: async (user_id: string, limit = 20): Promise<any[]> => {
    const result = await query(
      `SELECT r.*, u.name as from_name, u.avatar_url as from_avatar
       FROM ratings r
       LEFT JOIN users u ON r.from_user_id = u.id
       WHERE r.to_user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2`,
      [user_id, limit]
    );
    return result.rows;
  },

  getAverage: async (user_id: string): Promise<{ avg: number; count: number }> => {
    const result = await query(
      `SELECT
        ROUND(AVG(score)::numeric, 2) as avg,
        COUNT(*) as count
       FROM ratings WHERE to_user_id = $1`,
      [user_id]
    );
    return {
      avg: parseFloat(result.rows[0].avg) || 0,
      count: parseInt(result.rows[0].count),
    };
  },
};
