import { query } from '../config/database';

export interface Post {
  id: string;
  user_id: string;
  mode: 'need' | 'offer' | 'sell' | 'volunteer' | 'alert' | 'request';
  title: string;
  description: string;
  category_id: string | null;
  urgency: 'low' | 'medium' | 'high';
  status: 'active' | 'fulfilled' | 'expired' | 'removed';
  address_hint: string | null;
  photos: string[];
  price: number | null;
  expires_at: Date | null;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export const PostModel = {

  create: async (data: {
    user_id: string;
    mode: string;
    title: string;
    description: string;
    category_id?: string;
    urgency?: string;
    lat: number;
    lng: number;
    address_hint?: string;
    photos?: string[];
    price?: number;
    expires_at?: Date;
  }): Promise<Post> => {
    const result = await query(
      `INSERT INTO posts (
        user_id, mode, title, description, category_id,
        urgency, location, address_hint, photos, price, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, ST_SetSRID(ST_MakePoint($8, $7), 4326)::GEOGRAPHY,
        $9, $10, $11, $12
      ) RETURNING *`,
      [
        data.user_id, data.mode, data.title, data.description,
        data.category_id || null, data.urgency || 'low',
        data.lat, data.lng, data.address_hint || null,
        data.photos || [], data.price || null, data.expires_at || null,
      ]
    );
    return result.rows[0];
  },

  findById: async (id: string): Promise<Post | null> => {
    const result = await query(
      `SELECT p.*, 
        u.name as user_name, u.avatar_url as user_avatar, u.trust_score,
        c.name as category_name, c.slug as category_slug,
        ST_Y(p.location::geometry) as lat,
        ST_X(p.location::geometry) as lng
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findNearby: async (params: {
    lat: number;
    lng: number;
    radius_meters: number;
    mode?: string;
    category_id?: string;
    urgency?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    const {
      lat, lng, radius_meters,
      mode, category_id, urgency,
      limit = 50, offset = 0
    } = params;

    const conditions: string[] = [
      `p.status = 'active'`,
      `ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::GEOGRAPHY, $3)`,
    ];
    const values: any[] = [lat, lng, radius_meters];
    let idx = 4;

    if (mode) { conditions.push(`p.mode = $${idx++}`); values.push(mode); }
    if (category_id) { conditions.push(`p.category_id = $${idx++}`); values.push(category_id); }
    if (urgency) { conditions.push(`p.urgency = $${idx++}`); values.push(urgency); }

    values.push(limit, offset);

    const result = await query(
      `SELECT p.*,
        u.name as user_name, u.avatar_url as user_avatar, u.trust_score,
        c.name as category_name, c.slug as category_slug,
        ST_Y(p.location::geometry) as lat,
        ST_X(p.location::geometry) as lng,
        ST_Distance(
          p.location,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::GEOGRAPHY
        ) as distance_meters
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY distance_meters ASC, p.urgency DESC, p.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );
    return result.rows;
  },

  findByUser: async (user_id: string, limit = 20, offset = 0): Promise<Post[]> => {
    const result = await query(
      `SELECT p.*,
        c.name as category_name,
        ST_Y(p.location::geometry) as lat,
        ST_X(p.location::geometry) as lng
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user_id, limit, offset]
    );
    return result.rows;
  },

  update: async (id: string, user_id: string, data: Partial<Post>): Promise<Post | null> => {
    const allowed = ['title', 'description', 'urgency', 'address_hint', 'photos', 'price', 'expires_at', 'category_id'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (fields.length === 0) return null;

    const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const values = fields.map(f => (data as any)[f]);

    const result = await query(
      `UPDATE posts SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, user_id, ...values]
    );
    return result.rows[0] || null;
  },

  markFulfilled: async (id: string, user_id: string): Promise<Post | null> => {
    const result = await query(
      `UPDATE posts SET status = 'fulfilled', fulfilled_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, user_id]
    );
    return result.rows[0] || null;
  },

  delete: async (id: string, user_id: string): Promise<boolean> => {
    const result = await query(
      `UPDATE posts SET status = 'removed'
       WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  incrementViewCount: async (id: string): Promise<void> => {
    await query('UPDATE posts SET view_count = view_count + 1 WHERE id = $1', [id]);
  },
};
