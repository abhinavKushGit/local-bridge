import { query } from '../config/database';

export const SearchLogModel = {

  log: async (data: {
    user_id?: string;
    locality_id?: string;
    query: string;
    had_results: boolean;
  }): Promise<void> => {
    await query(
      `INSERT INTO search_logs (user_id, locality_id, query, had_results)
       VALUES ($1, $2, $3, $4)`,
      [data.user_id || null, data.locality_id || null,
       data.query.toLowerCase().trim(), data.had_results]
    );
  },

  // Get unknown searches that hit the threshold
  getAboveThreshold: async (
    threshold: number = 50,
    days: number = 7
  ): Promise<any[]> => {
    const result = await query(
      `SELECT
        query,
        locality_id,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) as total_searches
       FROM search_logs
       WHERE
         had_results = FALSE
         AND created_at >= NOW() - INTERVAL '${days} days'
         AND query NOT IN (
           SELECT LOWER(name) FROM categories WHERE status = 'active'
         )
       GROUP BY query, locality_id
       HAVING COUNT(DISTINCT user_id) >= $1
       ORDER BY unique_users DESC`,
      [threshold]
    );
    return result.rows;
  },

  getCountForQuery: async (
    query_str: string,
    locality_id: string | null,
    days: number = 7
  ): Promise<number> => {
    const result = await query(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM search_logs
       WHERE
         query = $1
         AND ($2::uuid IS NULL OR locality_id = $2)
         AND created_at >= NOW() - INTERVAL '${days} days'
         AND had_results = FALSE`,
      [query_str.toLowerCase(), locality_id]
    );
    return parseInt(result.rows[0].count);
  },
};
