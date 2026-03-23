import { Router } from 'express';
import { sendOTP, verifyOTP, getMe, updateProfile } from '../../controllers/auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { otpRateLimiter } from '../../middleware/rateLimiter.middleware';
import { sendOTPSchema, verifyOTPSchema } from '../../utils/validators';

const router = Router();

router.post('/send-otp', otpRateLimiter, validate(sendOTPSchema), sendOTP);
router.post('/verify-otp', validate(verifyOTPSchema), verifyOTP);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);

export default router;
