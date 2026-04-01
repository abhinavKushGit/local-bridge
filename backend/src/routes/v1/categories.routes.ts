import { Router } from 'express';
import {
  getCategories, getPendingVotes,
  castVote, logSearch
} from '../../controllers/categories.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getCategories);
router.get('/votes', getPendingVotes);
router.post('/votes/:id', castVote);
router.post('/search-log', logSearch);

export default router;
