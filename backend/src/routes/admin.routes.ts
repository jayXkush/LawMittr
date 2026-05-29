import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { rejectLawyerSchema } from '../validators/admin.validator';
import {
  getAnalyticsSummaryHandler,
  getDocumentAnalyticsHandler,
  listUsers,
  getUserById,
  deactivateUser,
  reactivateUser,
  listLawyers,
  getLawyerById,
  approveLawyerVerification,
  rejectLawyerVerification,
  listAppointments,
  getAppointmentById,
  listForumPosts,
  adminDeleteForumPost,
  listForumComments,
  adminDeleteForumComment,
  listReports,
  getReportById,
  resolveReport,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/analytics/summary', getAnalyticsSummaryHandler);
router.get('/documents/analytics', getDocumentAnalyticsHandler);

router.get('/users', listUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/deactivate', deactivateUser);
router.patch('/users/:id/reactivate', reactivateUser);

router.get('/lawyers', listLawyers);
router.get('/lawyers/:id', getLawyerById);
router.patch('/lawyers/:id/verify/approve', approveLawyerVerification);
router.patch(
  '/lawyers/:id/verify/reject',
  validate(rejectLawyerSchema),
  rejectLawyerVerification
);

router.get('/appointments', listAppointments);
router.get('/appointments/:id', getAppointmentById);

router.get('/forum/posts', listForumPosts);
router.delete('/forum/posts/:id', adminDeleteForumPost);
router.get('/forum/comments', listForumComments);
router.delete('/forum/comments/:id', adminDeleteForumComment);

router.get('/reports', listReports);
router.get('/reports/:id', getReportById);
router.patch('/reports/:id/resolve', resolveReport);

export default router;
