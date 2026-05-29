import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ForumPost, FORUM_CATEGORIES } from '../models/ForumPost';
import { ForumComment } from '../models/ForumComment';
import { ForumVote } from '../models/ForumVote';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { parsePagination, paginationMeta } from '../utils/pagination';
import {
  assertCommentOwner,
  assertPostOwner,
  buildPostListFilter,
  deletePostCascade,
  formatForumComment,
  formatForumPost,
  getPostByIdOrThrow,
  getVotedPostIds,
} from '../services/forum.service';

// ── Posts ────────────────────────────────────────────────────────

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, isAnonymous, category, tags } = req.body;

  const post = await ForumPost.create({
    title,
    content,
    authorId: req.user!.id,
    isAnonymous: isAnonymous ?? false,
    category: category ?? 'general',
    tags: tags ?? [],
  });

  await post.populate('authorId', 'name role');

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: { post: formatForumPost(post, req.user!.id, false) },
  });
});

export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { sortBy = 'newest' } = req.query as Record<string, string | undefined>;

  const filter = buildPostListFilter(req.query as Record<string, string | undefined>);

  const sortOptions: Record<string, 1 | -1> =
    sortBy === 'popular'
      ? { upvotesCount: -1, createdAt: -1 }
      : { createdAt: -1 };

  const [posts, total] = await Promise.all([
    ForumPost.find(filter)
      .populate('authorId', 'name role')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    ForumPost.countDocuments(filter),
  ]);

  const viewerId = req.user?.id;
  const postIds = posts.map((p) => p._id.toString());
  const votedIds = viewerId ? await getVotedPostIds(viewerId, postIds) : new Set<string>();

  const formatted = posts.map((p) =>
    formatForumPost(p, viewerId, votedIds.has(p._id.toString()))
  );

  res.json({
    success: true,
    data: { posts: formatted, categories: [...FORUM_CATEGORIES] },
    meta: paginationMeta(total, page, limit),
  });
});

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await getPostByIdOrThrow(req.params.id as string);
  const viewerId = req.user?.id;

  let hasVoted = false;
  if (viewerId) {
    const vote = await ForumVote.exists({ postId: post._id, userId: viewerId });
    hasVoted = !!vote;
  }

  res.json({
    success: true,
    data: { post: formatForumPost(post, viewerId, hasVoted) },
  });
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await getPostByIdOrThrow(req.params.id as string);
  assertPostOwner(post, req.user!.id, req.user!.role);

  const { title, content, isAnonymous, category, tags } = req.body;

  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  if (isAnonymous !== undefined) post.isAnonymous = isAnonymous;
  if (category !== undefined) post.category = category;
  if (tags !== undefined) post.tags = tags;

  await post.save();
  await post.populate('authorId', 'name role');

  const vote = await ForumVote.exists({ postId: post._id, userId: req.user!.id });

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: { post: formatForumPost(post, req.user!.id, !!vote) },
  });
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await getPostByIdOrThrow(req.params.id as string);
  assertPostOwner(post, req.user!.id, req.user!.role);

  await deletePostCascade(post._id.toString());

  res.json({
    success: true,
    message: 'Post deleted successfully',
  });
});

// ── Comments ─────────────────────────────────────────────────────

export const getPostComments = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.postId as string;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new AppError('Post not found', 404);
  }

  const postExists = await ForumPost.exists({ _id: postId });
  if (!postExists) {
    throw new AppError('Post not found', 404);
  }

  const { page, limit, skip } = parsePagination(req.query);

  const [comments, total] = await Promise.all([
    ForumComment.find({ postId })
      .populate('authorId', 'name role')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    ForumComment.countDocuments({ postId }),
  ]);

  const viewerId = req.user?.id;
  const formatted = comments.map((c) => formatForumComment(c, viewerId));

  res.json({
    success: true,
    data: { comments: formatted },
    meta: paginationMeta(total, page, limit),
  });
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.postId as string;
  const post = await getPostByIdOrThrow(postId);

  const comment = await ForumComment.create({
    postId: post._id,
    authorId: req.user!.id,
    content: req.body.content,
  });

  post.commentsCount += 1;
  await post.save();

  await comment.populate('authorId', 'name role');

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: { comment: formatForumComment(comment, req.user!.id) },
  });
});

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const commentId = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new AppError('Comment not found', 404);
  }

  const comment = await ForumComment.findById(commentId).populate('authorId', 'name role');
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  assertCommentOwner(comment, req.user!.id, req.user!.role);

  comment.content = req.body.content;
  await comment.save();

  res.json({
    success: true,
    message: 'Comment updated successfully',
    data: { comment: formatForumComment(comment, req.user!.id) },
  });
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const commentId = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new AppError('Comment not found', 404);
  }

  const comment = await ForumComment.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  assertCommentOwner(comment, req.user!.id, req.user!.role);

  await comment.deleteOne();

  await ForumPost.findByIdAndUpdate(comment.postId, {
    $inc: { commentsCount: -1 },
  });

  // Prevent negative count from race conditions
  await ForumPost.updateOne(
    { _id: comment.postId, commentsCount: { $lt: 0 } },
    { $set: { commentsCount: 0 } }
  );

  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

// ── Votes ────────────────────────────────────────────────────────

export const upvotePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await getPostByIdOrThrow(req.params.id as string);
  const userId = req.user!.id;

  const existing = await ForumVote.findOne({ postId: post._id, userId });
  if (existing) {
    throw new AppError('You have already upvoted this post', 409);
  }

  try {
    await ForumVote.create({
      postId: post._id,
      userId,
      voteType: 'upvote',
    });
  } catch (err) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      throw new AppError('You have already upvoted this post', 409);
    }
    throw err;
  }

  post.upvotesCount += 1;
  await post.save();

  await post.populate('authorId', 'name role');

  res.json({
    success: true,
    message: 'Post upvoted',
    data: { post: formatForumPost(post, userId, true) },
  });
});

export const removeVote = asyncHandler(async (req: Request, res: Response) => {
  const post = await getPostByIdOrThrow(req.params.id as string);
  const userId = req.user!.id;

  const vote = await ForumVote.findOneAndDelete({ postId: post._id, userId });
  if (!vote) {
    throw new AppError('You have not voted on this post', 404);
  }

  post.upvotesCount = Math.max(0, post.upvotesCount - 1);
  await post.save();

  await post.populate('authorId', 'name role');

  res.json({
    success: true,
    message: 'Vote removed',
    data: { post: formatForumPost(post, userId, false) },
  });
});
