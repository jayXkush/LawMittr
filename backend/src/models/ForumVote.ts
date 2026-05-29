import mongoose, { Document, Schema, Types } from 'mongoose';

export type ForumVoteType = 'upvote';

export interface IForumVote extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  voteType: ForumVoteType;
  createdAt: Date;
  updatedAt: Date;
}

const forumVoteSchema = new Schema<IForumVote>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    voteType: {
      type: String,
      enum: ['upvote'],
      default: 'upvote',
    },
  },
  { timestamps: true }
);

forumVoteSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const ForumVote = mongoose.model<IForumVote>('ForumVote', forumVoteSchema);
