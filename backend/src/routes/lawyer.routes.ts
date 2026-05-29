import { Router } from 'express';
import {
  getLawyers,
  getLawyerById,
  updateMyProfile,
  getMyProfile,
  getMyVerification,
  submitVerification,
  createAvailabilitySlot,
  getMyAvailabilitySlots,
  deleteAvailabilitySlot,
} from '../controllers/lawyer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateLawyerProfileSchema,
  lawyerVerificationSchema,
  createSlotSchema,
} from '../validators/lawyer.validator';

const router = Router();

router.get('/', getLawyers);
router.get('/profile/me', authenticate, authorize('lawyer'), getMyProfile);
router.get('/verification/me', authenticate, authorize('lawyer'), getMyVerification);
router.put(
  '/verification/me',
  authenticate,
  authorize('lawyer'),
  validate(lawyerVerificationSchema),
  submitVerification
);
router.put(
  '/profile/me',
  authenticate,
  authorize('lawyer'),
  validate(updateLawyerProfileSchema),
  updateMyProfile
);

router.get(
  '/availability/me',
  authenticate,
  authorize('lawyer'),
  getMyAvailabilitySlots
);
router.post(
  '/availability/me',
  authenticate,
  authorize('lawyer'),
  validate(createSlotSchema),
  createAvailabilitySlot
);
router.delete(
  '/availability/me/:slotId',
  authenticate,
  authorize('lawyer'),
  deleteAvailabilitySlot
);

router.get('/:id', getLawyerById);

export default router;
