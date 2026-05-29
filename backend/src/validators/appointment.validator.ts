import { z } from 'zod';

export const bookAppointmentSchema = z.object({
  slotId: z.string().min(1, 'Slot ID is required'),
  notes: z.string().max(500).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['completed', 'cancelled']),
});
