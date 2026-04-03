import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getStats, getUsers, banUser, getPosts, deletePost,
  getCategories, createCategory, deleteCategory,
  getReports, resolveReport, getLocalities
} from '../../controllers/admin.controller';

const router = Router();
router.use(authenticate);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/ban', banUser);
router.get('/posts', getPosts);
router.delete('/posts/:id', deletePost);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/reports', getReports);
router.patch('/reports/:id/resolve', resolveReport);
router.get('/localities', getLocalities);

export default router;
