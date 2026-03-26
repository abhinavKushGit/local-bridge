import { Router } from 'express';
import {
  startConversation, getConversations,
  getMessages, sendMessage
} from '../../controllers/chat.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/start', startConversation);
router.get('/', getConversations);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

export default router;
