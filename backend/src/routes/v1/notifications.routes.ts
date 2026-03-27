import { Router } from 'express';
import { getNotifications, markRead, markAllRead } from '../../controllers/notifications.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

export default router;
