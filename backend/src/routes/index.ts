import { Router } from 'express';
import authRoutes from './v1/auth.routes';
import postsRoutes from './v1/posts.routes';
import feedRoutes from './v1/feed.routes';
import chatRoutes from './v1/chat.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postsRoutes);
router.use('/feed', feedRoutes);
router.use('/chat', chatRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
