import { Router } from 'express';
import { rateUser, getUserRatings } from '../../controllers/ratings.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', rateUser);
router.get('/me', getUserRatings);
router.get('/:id', getUserRatings);

export default router;
