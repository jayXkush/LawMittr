import { z } from 'zod';

export const createOrderSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
});

export const verifyPaymentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  razorpayOrderId: z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Signature is required'),
});

export const demoPaymentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
});
