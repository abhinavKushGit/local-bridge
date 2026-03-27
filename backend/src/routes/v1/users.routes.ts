import { Router } from 'express';
import { getProfile, updateSmsOptIn, updateLocation } from '../../controllers/users.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/me', getProfile);
router.get('/:id', getProfile);
router.patch('/sms-opt-in', updateSmsOptIn);
router.patch('/location', updateLocation);

export default router;
