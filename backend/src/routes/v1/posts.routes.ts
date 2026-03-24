import { Router } from 'express';
import {
  createPost, getPost, updatePost,
  markFulfilled, deletePost, getMyPosts
} from '../../controllers/posts.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createPostSchema } from '../../utils/validators';

const router = Router();

router.use(authenticate);

router.post('/', validate(createPostSchema), createPost);
router.get('/mine', getMyPosts);
router.get('/:id', getPost);
router.patch('/:id', updatePost);
router.patch('/:id/fulfill', markFulfilled);
router.delete('/:id', deletePost);

export default router;
