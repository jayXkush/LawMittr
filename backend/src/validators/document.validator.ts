import { z } from 'zod';

export const chatWithDocumentSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .max(2000, 'Question must be at most 2000 characters'),
});
