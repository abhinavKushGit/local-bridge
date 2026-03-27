import { query } from '../config/database';

export const NotificationModel = {

  create: async (data: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  }): Promise<any> => {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.user_id, data.type, data.title, data.body, JSON.stringify(data.data || {})]
    );
    return result.rows[0];
  },

  findByUser: async (user_id: string, limit = 30, offset = 0): Promise<any[]> => {
    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [user_id, limit, offset]
    );
    return result.rows;
  },

  markRead: async (id: string, user_id: string): Promise<void> => {
    await query(
      `UPDATE notifications SET is_read = TRUE, read_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );
  },

  markAllRead: async (user_id: string): Promise<void> => {
    await query(
      `UPDATE notifications SET is_read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND is_read = FALSE`,
      [user_id]
    );
  },

  getUnreadCount: async (user_id: string): Promise<number> => {
    const result = await query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [user_id]
    );
    return parseInt(result.rows[0].count);
  },

  createBulk: async (notifications: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  }[]): Promise<void> => {
    if (notifications.length === 0) return;
    const values = notifications.map((n, i) => {
      const base = i * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    }).join(', ');
    const params = notifications.flatMap(n => [
      n.user_id, n.type, n.title, n.body, JSON.stringify(n.data || {})
    ]);
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data) VALUES ${values}`,
      params
    );
  },
};
