import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IForumComment extends Document {
  postId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const forumCommentSchema = new Schema<IForumComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
  },
  { timestamps: true }
);

forumCommentSchema.index({ postId: 1, createdAt: 1 });

export const ForumComment = mongoose.model<IForumComment>(
  'ForumComment',
  forumCommentSchema
);
