import mongoose, { Document, Schema, Types } from 'mongoose';

export const FORUM_CATEGORIES = [
  'general',
  'family-law',
  'criminal-law',
  'property-law',
  'corporate-law',
  'labor-law',
  'consumer-rights',
  'constitutional-law',
  'other',
] as const;

export type ForumCategory = (typeof FORUM_CATEGORIES)[number];

export interface IForumPost extends Document {
  title: string;
  content: string;
  authorId: Types.ObjectId;
  isAnonymous: boolean;
  category: ForumCategory;
  tags: string[];
  upvotesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const forumPostSchema = new Schema<IForumPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: FORUM_CATEGORIES,
      default: 'general',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 10,
        message: 'A post cannot have more than 10 tags',
      },
    },
    upvotesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

forumPostSchema.index({ createdAt: -1 });
forumPostSchema.index({ category: 1, createdAt: -1 });
forumPostSchema.index({ tags: 1 });
forumPostSchema.index({ title: 'text', content: 'text' });

export const ForumPost = mongoose.model<IForumPost>('ForumPost', forumPostSchema);
