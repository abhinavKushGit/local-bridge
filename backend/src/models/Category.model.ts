import { query } from '../config/database';

export const CategoryModel = {
  findAll: async (): Promise<any[]> => {
    const result = await query(
      `SELECT * FROM categories 
       WHERE status = 'active' AND (is_global = TRUE OR locality_id IS NULL)
       ORDER BY name ASC`
    );
    return result.rows;
  },

  findById: async (id: string): Promise<any> => {
    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  },
};
