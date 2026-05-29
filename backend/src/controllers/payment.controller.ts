import { Request, Response } from 'express';
import { env } from '../config/env';
import { formatAppointment } from './appointment.controller';
import {
  confirmFromWebhook,
  createRazorpayOrder,
  processDemoPayment,
  verifyAndConfirmRazorpayPayment,
} from '../services/payment.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyWebhookSignature } from '../utils/razorpaySignature';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { appointmentId } = req.body;
  const order = await createRazorpayOrder(appointmentId, req.user!.id);

  res.status(201).json({
    success: true,
    message: 'Payment order created',
    data: { order },
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const {
    appointmentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = req.body;

  const appointment = await verifyAndConfirmRazorpayPayment(
    appointmentId,
    req.user!.id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  const formatted = await formatAppointment(appointment);

  res.json({
    success: true,
    message: 'Payment verified and appointment confirmed',
    data: { appointment: formatted },
  });
});

export const demoPayment = asyncHandler(async (req: Request, res: Response) => {
  const { appointmentId } = req.body;
  const appointment = await processDemoPayment(appointmentId, req.user!.id);
  const formatted = await formatAppointment(appointment);

  res.json({
    success: true,
    message: 'Demo payment completed — appointment confirmed',
    data: { appointment: formatted },
  });
});

export const razorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string | undefined;

  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new AppError('Webhook secret not configured', 503);
  }

  if (!signature) {
    throw new AppError('Missing webhook signature', 400);
  }

  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    throw new AppError('Invalid webhook payload', 400);
  }

  const valid = verifyWebhookSignature(
    rawBody,
    signature,
    env.RAZORPAY_WEBHOOK_SECRET
  );

  if (!valid) {
    throw new AppError('Invalid webhook signature', 400);
  }

  const payload = JSON.parse(rawBody.toString('utf8')) as {
    event: string;
    payload?: {
      payment?: { entity?: { order_id?: string; id?: string; status?: string } };
    };
  };

  if (payload.event === 'payment.captured') {
    const payment = payload.payload?.payment?.entity;
    if (payment?.order_id && payment?.id) {
      await confirmFromWebhook(payment.order_id, payment.id);
    }
  }

  res.json({ success: true });
});

export const getDemoPaymentsEnabled = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { enabled: env.ENABLE_DEMO_PAYMENTS },
  });
});
