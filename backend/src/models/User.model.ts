import { query } from '../config/database';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  locality_id: string | null;
  home_address: string | null;
  radius_meters: number;
  trust_score: number;
  total_exchanges: number;
  is_verified: boolean;
  is_active: boolean;
  sms_opt_in: boolean;
  created_at: Date;
}

export const UserModel = {
  findByPhone: async (phone: string): Promise<User | null> => {
    const result = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0] || null;
  },

  findById: async (id: string): Promise<User | null> => {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  create: async (phone: string): Promise<User> => {
    const result = await query(
      'INSERT INTO users (phone) VALUES ($1) RETURNING *',
      [phone]
    );
    return result.rows[0];
  },

  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
    const fields = Object.keys(data)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = Object.values(data);
    const result = await query(
      `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },

  updateLocation: async (
    id: string,
    lat: number,
    lng: number
  ): Promise<void> => {
    await query(
      `UPDATE users SET location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::GEOGRAPHY,
       last_seen_at = NOW() WHERE id = $1`,
      [id, lng, lat]
    );
  },

  updateLastSeen: async (id: string): Promise<void> => {
    await query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [id]);
  },
};
