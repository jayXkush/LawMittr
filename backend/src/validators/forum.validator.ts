import { z } from 'zod';
import { FORUM_CATEGORIES } from '../models/ForumPost';

const tagSchema = z
  .string()
  .trim()
  .min(1, 'Tag cannot be empty')
  .max(30, 'Tag cannot exceed 30 characters')
  .transform((t) => t.toLowerCase());

export const createForumPostSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().trim().min(10, 'Content must be at least 10 characters').max(10000),
  isAnonymous: z.boolean().optional().default(false),
  category: z.enum(FORUM_CATEGORIES).optional().default('general'),
  tags: z.array(tagSchema).max(10, 'Maximum 10 tags allowed').optional().default([]),
});

export const updateForumPostSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  content: z.string().trim().min(10).max(10000).optional(),
  isAnonymous: z.boolean().optional(),
  category: z.enum(FORUM_CATEGORIES).optional(),
  tags: z.array(tagSchema).max(10).optional(),
});

export const createForumCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(5000),
});

export const updateForumCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(5000),
});
