import { z } from 'zod';

export const updateLawyerProfileSchema = z.object({
  specialization: z.array(z.string().min(1)).min(1).optional(),
  experience: z.number().min(0).max(60).optional(),
  city: z.string().min(1).max(100).optional(),
  languages: z.array(z.string().min(1)).min(1).optional(),
  consultationFee: z.number().min(0).optional(),
  bio: z.string().max(1000).optional(),
});

export const lawyerFilterSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  specialization: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
  minRating: z.string().optional(),
  maxFee: z.string().optional(),
  sortBy: z.enum(['rating', 'fee', 'experience']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const lawyerVerificationSchema = z.object({
  barCouncilNumber: z.string().min(3, 'Bar council number is required').max(50),
  yearsOfPractice: z.number().min(0).max(60),
});

export const createSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time (HH:mm)'),
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});
