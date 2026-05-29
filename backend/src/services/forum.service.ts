import mongoose from 'mongoose';
import { ForumPost, IForumPost } from '../models/ForumPost';
import { ForumComment, IForumComment } from '../models/ForumComment';
import { ForumVote } from '../models/ForumVote';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';

type PopulatedAuthor = {
  _id: mongoose.Types.ObjectId;
  name: string;
  role: string;
};

export interface ForumAuthorView {
  id: string;
  name: string;
  role: string;
}

export interface FormattedForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string | null;
  author: ForumAuthorView | null;
  isAnonymous: boolean;
  category: string;
  tags: string[];
  upvotesCount: number;
  commentsCount: number;
  hasVoted?: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormattedForumComment {
  id: string;
  postId: string;
  authorId: string;
  author: ForumAuthorView;
  content: string;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

const toAuthorView = (user: PopulatedAuthor): ForumAuthorView => ({
  id: user._id.toString(),
  name: user.name,
  role: user.role,
});

export const formatForumPost = (
  post: IForumPost & { authorId?: PopulatedAuthor | mongoose.Types.ObjectId },
  viewerId?: string,
  hasVoted?: boolean
): FormattedForumPost => {
  const authorPopulated =
    post.authorId &&
    typeof post.authorId === 'object' &&
    'name' in post.authorId
      ? (post.authorId as PopulatedAuthor)
      : null;

  const authorIdStr = authorPopulated
    ? authorPopulated._id.toString()
    : post.authorId instanceof mongoose.Types.ObjectId
      ? post.authorId.toString()
      : String(post.authorId);

  const isOwner = viewerId ? authorIdStr === viewerId : false;
  const hideAuthor = post.isAnonymous && !isOwner;

  return {
    id: post._id.toString(),
    title: post.title,
    content: post.content,
    authorId: hideAuthor ? null : authorIdStr,
    author: hideAuthor
      ? null
      : authorPopulated
        ? toAuthorView(authorPopulated)
        : null,
    isAnonymous: post.isAnonymous,
    category: post.category,
    tags: post.tags,
    upvotesCount: post.upvotesCount,
    commentsCount: post.commentsCount,
    ...(viewerId !== undefined && { hasVoted: hasVoted ?? false }),
    ...(viewerId !== undefined && { isOwner }),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
};

export const formatForumComment = (
  comment: IForumComment & { authorId?: PopulatedAuthor | mongoose.Types.ObjectId },
  viewerId?: string
): FormattedForumComment => {
  const authorPopulated =
    comment.authorId &&
    typeof comment.authorId === 'object' &&
    'name' in comment.authorId
      ? (comment.authorId as PopulatedAuthor)
      : null;

  const authorIdStr = authorPopulated
    ? authorPopulated._id.toString()
    : comment.authorId instanceof mongoose.Types.ObjectId
      ? comment.authorId.toString()
      : String(comment.authorId);

  return {
    id: comment._id.toString(),
    postId: comment.postId.toString(),
    authorId: authorIdStr,
    author: authorPopulated
      ? toAuthorView(authorPopulated)
      : { id: authorIdStr, name: 'Unknown', role: 'user' },
    content: comment.content,
    ...(viewerId !== undefined && { isOwner: authorIdStr === viewerId }),
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
};

export const getPostByIdOrThrow = async (postId: string): Promise<IForumPost> => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new AppError('Post not found', 404);
  }
  const post = await ForumPost.findById(postId).populate('authorId', 'name role');
  if (!post) {
    throw new AppError('Post not found', 404);
  }
  return post;
};

export const assertPostOwner = (post: IForumPost, userId: string, userRole: string): void => {
  if (post.authorId.toString() !== userId && userRole !== 'admin') {
    throw new AppError('You can only modify your own posts', 403);
  }
};

export const assertCommentOwner = (
  comment: IForumComment,
  userId: string,
  userRole: string
): void => {
  if (comment.authorId.toString() !== userId && userRole !== 'admin') {
    throw new AppError('You can only modify your own comments', 403);
  }
};

export const getVotedPostIds = async (
  userId: string,
  postIds: string[]
): Promise<Set<string>> => {
  if (postIds.length === 0) return new Set();
  const votes = await ForumVote.find({
    userId,
    postId: { $in: postIds },
  }).select('postId');
  return new Set(votes.map((v) => v.postId.toString()));
};

export const buildPostListFilter = (query: Record<string, string | undefined>) => {
  const filter: Record<string, unknown> = {};
  const { search, category, tag, unanswered } = query;

  if (category) {
    filter.category = category;
  }

  if (tag) {
    filter.tags = tag.toLowerCase();
  }

  if (unanswered === 'true') {
    filter.commentsCount = 0;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  return filter;
};

export const deletePostCascade = async (postId: string): Promise<void> => {
  await Promise.all([
    ForumComment.deleteMany({ postId }),
    ForumVote.deleteMany({ postId }),
    ForumPost.findByIdAndDelete(postId),
  ]);
};

export const ensureUserExists = async (userId: string): Promise<void> => {
  const exists = await User.exists({ _id: userId });
  if (!exists) {
    throw new AppError('User not found', 404);
  }
};
