import { Router } from 'express';
import authRoutes from './v1/auth.routes';
import postsRoutes from './v1/posts.routes';
import feedRoutes from './v1/feed.routes';
import chatRoutes from './v1/chat.routes';
import usersRoutes from './v1/users.routes';
import notificationsRoutes from './v1/notifications.routes';
import categoriesRoutes from './v1/categories.routes';
import ratingsRoutes from './v1/ratings.routes';
import adminRoutes from './v1/admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postsRoutes);
router.use('/feed', feedRoutes);
router.use('/chat', chatRoutes);
router.use('/users', usersRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/ratings', ratingsRoutes);
router.use('/admin', adminRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
