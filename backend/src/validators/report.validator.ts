import { z } from 'zod';

export const createReportSchema = z.object({
  targetType: z.enum(['forum_post', 'forum_comment']),
  targetId: z.string().min(1, 'Target id is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(1000),
});

export const adminReportListSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['pending', 'resolved']).optional(),
});
