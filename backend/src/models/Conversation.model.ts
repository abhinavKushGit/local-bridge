import { query } from '../config/database';

export const ConversationModel = {

  findOrCreate: async (
    post_id: string,
    participant_one: string,
    participant_two: string
  ): Promise<any> => {
    // Always store participants in consistent order to avoid duplicates
    const [p1, p2] = [participant_one, participant_two].sort();

    const existing = await query(
      `SELECT c.*,
        p.title as post_title, p.mode as post_mode,
        u1.name as p1_name, u1.avatar_url as p1_avatar,
        u2.name as p2_name, u2.avatar_url as p2_avatar
       FROM conversations c
       LEFT JOIN posts p ON c.post_id = p.id
       LEFT JOIN users u1 ON c.participant_one = u1.id
       LEFT JOIN users u2 ON c.participant_two = u2.id
       WHERE c.post_id = $1
         AND c.participant_one = $2
         AND c.participant_two = $3`,
      [post_id, p1, p2]
    );

    if (existing.rows.length > 0) return { conversation: existing.rows[0], created: false };

    const result = await query(
      `INSERT INTO conversations (post_id, participant_one, participant_two)
       VALUES ($1, $2, $3) RETURNING *`,
      [post_id, p1, p2]
    );
    return { conversation: result.rows[0], created: true };
  },

  findById: async (id: string): Promise<any> => {
    const result = await query(
      `SELECT c.*,
        p.title as post_title, p.mode as post_mode,
        u1.name as p1_name, u1.avatar_url as p1_avatar,
        u2.name as p2_name, u2.avatar_url as p2_avatar
       FROM conversations c
       LEFT JOIN posts p ON c.post_id = p.id
       LEFT JOIN users u1 ON c.participant_one = u1.id
       LEFT JOIN users u2 ON c.participant_two = u2.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findByUser: async (user_id: string): Promise<any[]> => {
    const result = await query(
      `SELECT c.*,
        p.title as post_title, p.mode as post_mode,
        u1.name as p1_name, u1.avatar_url as p1_avatar,
        u2.name as p2_name, u2.avatar_url as p2_avatar,
        (SELECT COUNT(*) FROM messages m
         WHERE m.conversation_id = c.id
           AND m.is_read = FALSE
           AND m.sender_id != $1) as unread_count
       FROM conversations c
       LEFT JOIN posts p ON c.post_id = p.id
       LEFT JOIN users u1 ON c.participant_one = u1.id
       LEFT JOIN users u2 ON c.participant_two = u2.id
       WHERE c.participant_one = $1 OR c.participant_two = $1
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [user_id]
    );
    return result.rows;
  },

  isParticipant: async (conv_id: string, user_id: string): Promise<boolean> => {
    const result = await query(
      `SELECT id FROM conversations
       WHERE id = $1 AND (participant_one = $2 OR participant_two = $2)`,
      [conv_id, user_id]
    );
    return result.rows.length > 0;
  },

  updateLastMessage: async (id: string, message: string): Promise<void> => {
    await query(
      `UPDATE conversations SET last_message = $2, last_message_at = NOW()
       WHERE id = $1`,
      [id, message]
    );
  },
};
