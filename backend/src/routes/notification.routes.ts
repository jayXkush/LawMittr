import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notification.controller';

const router = Router();

router.use(authenticate, authorize('user', 'lawyer', 'admin'));

router.get('/me', getMyNotifications);
router.get('/me/unread-count', getUnreadNotificationCount);
router.patch('/me/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

export default router;
