import { Router } from 'express';
import authRoutes from './auth.routes';
import lawyerRoutes from './lawyer.routes';
import appointmentRoutes from './appointment.routes';
import paymentRoutes from './payment.routes';
import meetingRoutes from './meeting.routes';
import documentRoutes from './document.routes';
import forumRoutes from './forum.routes';
import adminRoutes from './admin.routes';
import notificationRoutes from './notification.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/lawyers', lawyerRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/meetings', meetingRoutes);
router.use('/documents', documentRoutes);
router.use('/forum', forumRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'LawMittr API is running' });
});

export default router;

