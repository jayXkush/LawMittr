import { z } from 'zod';

export const adminListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export const adminLawyerListQuerySchema = adminListQuerySchema.extend({
  verificationStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const adminAppointmentListQuerySchema = adminListQuerySchema.extend({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional(),
});

export const rejectLawyerSchema = z.object({
  rejectionReason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500),
});
