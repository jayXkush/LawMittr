import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createReportSchema } from '../validators/report.validator';
import { createReport } from '../controllers/report.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('user', 'lawyer', 'admin'),
  validate(createReportSchema),
  createReport
);

export default router;
