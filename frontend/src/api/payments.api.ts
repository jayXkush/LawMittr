import { api } from './axios';
import type { Appointment } from '@/types/appointment';
import type { RazorpayOrderResponse } from '@/types/payment';

export const paymentsApi = {
  isDemoEnabled: () =>
    api.get<{ success: boolean; data: { enabled: boolean } }>('/payments/demo-enabled'),

  createOrder: (appointmentId: string) =>
    api.post<{ success: boolean; data: { order: RazorpayOrderResponse } }>('/payments/orders', {
      appointmentId,
    }),

  verify: (payload: {
    appointmentId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) =>
    api.post<{ success: boolean; data: { appointment: Appointment } }>('/payments/verify', payload),

  demoPay: (appointmentId: string) =>
    api.post<{ success: boolean; data: { appointment: Appointment } }>('/payments/demo', {
      appointmentId,
    }),
};
