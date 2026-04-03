import { Request, Response } from 'express';
import { query } from '../config/database';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /admin/stats
export const getStats = async (req: Request, res: Response) => {
  try {
    const [users, posts, conversations, ratings, categories] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM posts'),
      query('SELECT COUNT(*) FROM conversations'),
      query('SELECT COUNT(*) FROM ratings'),
      query("SELECT COUNT(*) FROM categories WHERE status = 'active'"),
    ]);
    return sendSuccess(res, {
      total_users: parseInt(users.rows[0].count),
      total_posts: parseInt(posts.rows[0].count),
      total_conversations: parseInt(conversations.rows[0].count),
      total_ratings: parseInt(ratings.rows[0].count),
      active_categories: parseInt(categories.rows[0].count),
    });
  } catch (err) {
    return sendError(res, 'Failed to fetch stats', 500);
  }
};

// GET /admin/users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let q = 'SELECT id, phone, name, trust_score, is_banned, created_at FROM users';
    const params: any[] = [];
    if (search) {
      params.push(`%${search}%`);
      q += ` WHERE name ILIKE $1 OR phone ILIKE $1`;
    }
    q += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);
    const result = await query(q, params);
    return sendSuccess(res, { users: result.rows, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return sendError(res, 'Failed to fetch users', 500);
  }
};

// PATCH /admin/users/:id/ban
export const banUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { banned } = req.body;
    const result = await query(
      'UPDATE users SET is_banned = $1 WHERE id = $2 RETURNING id, phone, name, is_banned',
      [banned, id]
    );
    if (!result.rows.length) return sendError(res, 'User not found', 404);
    return sendSuccess(res, result.rows[0], `User ${banned ? 'banned' : 'unbanned'}`);
  } catch (err) {
    return sendError(res, 'Failed to update user', 500);
  }
};

// GET /admin/posts
export const getPosts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, mode } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params: any[] = [];
    let where = 'WHERE 1=1';
    if (status) { params.push(status); where += ` AND p.status = $${params.length}`; }
    if (mode)   { params.push(mode);   where += ` AND p.mode = $${params.length}`; }
    params.push(Number(limit), offset);
    const result = await query(
      `SELECT p.id, p.title, p.mode, p.urgency, p.status, p.created_at,
              u.phone as user_phone, u.name as user_name
       FROM posts p JOIN users u ON u.id = p.user_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return sendSuccess(res, { posts: result.rows, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return sendError(res, 'Failed to fetch posts', 500);
  }
};

// DELETE /admin/posts/:id
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM posts WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return sendError(res, 'Post not found', 404);
    return sendSuccess(res, null, 'Post deleted');
  } catch (err) {
    return sendError(res, 'Failed to delete post', 500);
  }
};

// GET /admin/categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM categories ORDER BY created_at DESC'
    );
    return sendSuccess(res, { categories: result.rows });
  } catch (err) {
    return sendError(res, 'Failed to fetch categories', 500);
  }
};

// POST /admin/categories
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, is_global = true } = req.body;
    if (!name) return sendError(res, 'Name is required', 400);
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const result = await query(
      `INSERT INTO categories (name, slug, status, is_global, activated_at)
       VALUES ($1, $2, 'active', $3, NOW())
       RETURNING *`,
      [name, slug, is_global]
    );
    return sendSuccess(res, result.rows[0], 'Category created', 201);
  } catch (err: any) {
    if (err.code === '23505') return sendError(res, 'Category already exists', 409);
    return sendError(res, 'Failed to create category', 500);
  }
};

// DELETE /admin/categories/:id
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return sendError(res, 'Category not found', 404);
    return sendSuccess(res, null, 'Category deleted');
  } catch (err) {
    return sendError(res, 'Failed to delete category', 500);
  }
};

// GET /admin/reports  (moderation queue)
export const getReports = async (req: Request, res: Response) => {
  try {
    const { status = 'pending' } = req.query;
    const result = await query(
      `SELECT r.*, u.phone as reporter_phone, p.title as post_title
       FROM reports r
       JOIN users u ON u.id = r.reporter_id
       LEFT JOIN posts p ON p.id = r.post_id
       WHERE r.status = $1
       ORDER BY r.created_at DESC`,
      [status]
    );
    return sendSuccess(res, { reports: result.rows });
  } catch (err) {
    return sendError(res, 'Failed to fetch reports', 500);
  }
};

// PATCH /admin/reports/:id/resolve
export const resolveReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'dismiss' | 'remove_post' | 'ban_user'
    const report = await query('SELECT * FROM reports WHERE id = $1', [id]);
    if (!report.rows.length) return sendError(res, 'Report not found', 404);
    const r = report.rows[0];
    if (action === 'remove_post' && r.post_id) {
      await query('DELETE FROM posts WHERE id = $1', [r.post_id]);
    } else if (action === 'ban_user' && r.reported_user_id) {
      await query('UPDATE users SET is_banned = true WHERE id = $1', [r.reported_user_id]);
    }
    await query("UPDATE reports SET status = 'resolved' WHERE id = $1", [id]);
    return sendSuccess(res, null, 'Report resolved');
  } catch (err) {
    return sendError(res, 'Failed to resolve report', 500);
  }
};

// GET /admin/localities
export const getLocalities = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT l.*,
        (SELECT COUNT(*) FROM users WHERE locality_id = l.id) as user_count,
        (SELECT COUNT(*) FROM posts WHERE locality_id = l.id) as post_count
       FROM localities l
       ORDER BY l.name`
    );
    return sendSuccess(res, { localities: result.rows });
  } catch (err) {
    return sendError(res, 'Failed to fetch localities', 500);
  }
};
