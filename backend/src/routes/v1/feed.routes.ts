import { Router } from 'express';
import { getFeed, getCategories } from '../../controllers/feed.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getFeed);
router.get('/categories', getCategories);

export default router;
