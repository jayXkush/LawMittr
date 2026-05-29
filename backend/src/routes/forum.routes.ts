import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createForumPostSchema,
  updateForumPostSchema,
  createForumCommentSchema,
  updateForumCommentSchema,
} from '../validators/forum.validator';
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  getPostComments,
  addComment,
  updateComment,
  deleteComment,
  upvotePost,
  removeVote,
} from '../controllers/forum.controller';

const router = Router();

const forumRoles = ['user', 'lawyer', 'admin'] as const;

// Public read routes (optional JWT for hasVoted / isOwner)
router.get('/posts', optionalAuthenticate, getPosts);
router.get('/posts/:id', optionalAuthenticate, getPost);
router.get('/posts/:postId/comments', optionalAuthenticate, getPostComments);

// Authenticated write routes
router.post(
  '/posts',
  authenticate,
  authorize(...forumRoles),
  validate(createForumPostSchema),
  createPost
);

router.patch(
  '/posts/:id',
  authenticate,
  authorize(...forumRoles),
  validate(updateForumPostSchema),
  updatePost
);

router.delete(
  '/posts/:id',
  authenticate,
  authorize(...forumRoles),
  deletePost
);

router.post(
  '/posts/:postId/comments',
  authenticate,
  authorize(...forumRoles),
  validate(createForumCommentSchema),
  addComment
);

router.patch(
  '/comments/:id',
  authenticate,
  authorize(...forumRoles),
  validate(updateForumCommentSchema),
  updateComment
);

router.delete(
  '/comments/:id',
  authenticate,
  authorize(...forumRoles),
  deleteComment
);

router.post(
  '/posts/:id/vote',
  authenticate,
  authorize(...forumRoles),
  upvotePost
);

router.delete(
  '/posts/:id/vote',
  authenticate,
  authorize(...forumRoles),
  removeVote
);

export default router;
