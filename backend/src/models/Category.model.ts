import { query } from '../config/database';

export const CategoryModel = {

  findAll: async (locality_id?: string): Promise<any[]> => {
    const result = await query(
      `SELECT * FROM categories
       WHERE status = 'active'
         AND (is_global = TRUE OR locality_id = $1 OR $1::uuid IS NULL)
       ORDER BY name ASC`,
      [locality_id || null]
    );
    return result.rows;
  },

  findById: async (id: string): Promise<any> => {
    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  findPendingVotes: async (locality_id?: string): Promise<any[]> => {
    const result = await query(
      `SELECT * FROM categories
       WHERE status = 'pending_vote'
         AND vote_ends_at > NOW()
         AND (locality_id = $1 OR $1::uuid IS NULL)
       ORDER BY vote_started_at DESC`,
      [locality_id || null]
    );
    return result.rows;
  },

  createPendingVote: async (data: {
    name: string;
    slug: string;
    locality_id?: string;
  }): Promise<any> => {
    // Check if already exists
    const existing = await query(
      `SELECT * FROM categories WHERE slug = $1`,
      [data.slug]
    );
    if (existing.rows.length > 0) return existing.rows[0];

    const result = await query(
      `INSERT INTO categories
         (name, slug, locality_id, status, vote_started_at, vote_ends_at)
       VALUES ($1, $2, $3, 'pending_vote', NOW(), NOW() + INTERVAL '48 hours')
       RETURNING *`,
      [data.name, data.slug, data.locality_id || null]
    );
    return result.rows[0];
  },

  activate: async (id: string): Promise<any> => {
    const result = await query(
      `UPDATE categories
       SET status = 'active', activated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  reject: async (id: string): Promise<void> => {
    await query(
      `UPDATE categories SET status = 'rejected' WHERE id = $1`,
      [id]
    );
  },

  updateVoteCount: async (id: string, yes: number, no: number): Promise<void> => {
    await query(
      `UPDATE categories SET vote_yes = $2, vote_no = $3 WHERE id = $1`,
      [id, yes, no]
    );
  },

  slugify: (name: string): string => {
    return name.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  },
};
