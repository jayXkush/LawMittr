import { Router } from 'express';
import {
  createOrder,
  demoPayment,
  getDemoPaymentsEnabled,
  verifyPayment,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createOrderSchema,
  demoPaymentSchema,
  verifyPaymentSchema,
} from '../validators/payment.validator';

const router = Router();

router.get('/demo-enabled', getDemoPaymentsEnabled);

router.use(authenticate);
router.use(authorize('user'));

router.post('/orders', validate(createOrderSchema), createOrder);
router.post('/verify', validate(verifyPaymentSchema), verifyPayment);
router.post('/demo', validate(demoPaymentSchema), demoPayment);

export default router;
