import { query } from '../config/database';

export const ReportModel = {

  create: async (data: {
    reporter_id: string;
    target_type: 'post' | 'user' | 'message';
    target_id: string;
    reason: string;
    details?: string;
  }): Promise<any> => {
    const result = await query(
      `INSERT INTO reports
         (reporter_id, target_type, target_id, reason, details)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.reporter_id, data.target_type, data.target_id,
       data.reason, data.details || null]
    );
    return result.rows[0];
  },

  getPendingQueue: async (limit = 50): Promise<any[]> => {
    const result = await query(
      `SELECT * FROM reports
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  resolve: async (
    id: string,
    resolver_id: string,
    status: 'reviewed' | 'dismissed' | 'action_taken'
  ): Promise<any> => {
    const result = await query(
      `UPDATE reports
       SET status = $2, resolved_by = $3, resolved_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, status, resolver_id]
    );
    return result.rows[0];
  },

  getCountForTarget: async (target_id: string): Promise<number> => {
    const result = await query(
      `SELECT COUNT(*) as count FROM reports
       WHERE target_id = $1 AND status = 'pending'`,
      [target_id]
    );
    return parseInt(result.rows[0].count);
  },
};
