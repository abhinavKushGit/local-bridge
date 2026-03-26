import { query } from '../config/database';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: 'text' | 'image' | 'system';
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: Date;
}

export const MessageModel = {

  create: async (data: {
    conversation_id: string;
    sender_id: string;
    type?: string;
    content: string;
    image_url?: string;
  }): Promise<any> => {
    const result = await query(
      `INSERT INTO messages (conversation_id, sender_id, type, content, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.conversation_id,
        data.sender_id,
        data.type || 'text',
        data.content,
        data.image_url || null,
      ]
    );

    // Attach sender info
    const withSender = await query(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.id = $1`,
      [result.rows[0].id]
    );

    return withSender.rows[0];
  },

  findByConversation: async (
    conversation_id: string,
    limit = 50,
    before_id?: string
  ): Promise<any[]> => {
    let q = `
      SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1`;

    const values: any[] = [conversation_id];

    if (before_id) {
      values.push(before_id);
      q += ` AND m.created_at < (SELECT created_at FROM messages WHERE id = $${values.length})`;
    }

    values.push(limit);
    q += ` ORDER BY m.created_at DESC LIMIT $${values.length}`;

    const result = await query(q, values);
    return result.rows.reverse(); // Return oldest first
  },

  markRead: async (conversation_id: string, user_id: string): Promise<void> => {
    await query(
      `UPDATE messages SET is_read = TRUE, read_at = NOW()
       WHERE conversation_id = $1
         AND sender_id != $2
         AND is_read = FALSE`,
      [conversation_id, user_id]
    );
  },

  getUnreadCount: async (user_id: string): Promise<number> => {
    const result = await query(
      `SELECT COUNT(*) as count FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE (c.participant_one = $1 OR c.participant_two = $1)
         AND m.sender_id != $1
         AND m.is_read = FALSE`,
      [user_id]
    );
    return parseInt(result.rows[0].count);
  },
};
