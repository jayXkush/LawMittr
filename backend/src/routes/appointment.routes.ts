import { Router } from 'express';
import {
  bookAppointment,
  getMyAppointmentById,
  getMyAppointments,
  getLawyerAppointments,
  updateAppointmentStatus,
  cancelMyAppointment,
} from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  bookAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validators/appointment.validator';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('user'),
  validate(bookAppointmentSchema),
  bookAppointment
);
router.get('/me', authorize('user'), getMyAppointments);
router.get('/me/:id', authorize('user'), getMyAppointmentById);
router.patch('/me/:id/cancel', authorize('user'), cancelMyAppointment);

router.get('/lawyer', authorize('lawyer'), getLawyerAppointments);
router.patch(
  '/:id/status',
  authorize('lawyer'),
  validate(updateAppointmentStatusSchema),
  updateAppointmentStatus
);

export default router;
