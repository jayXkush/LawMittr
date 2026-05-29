import { api } from './axios';
import type { PaginatedResponse } from '@/types/api';
import type {
  ForumPost,
  ForumComment,
  ForumPostFilters,
  CreateForumPostPayload,
  UpdateForumPostPayload,
  ForumCategory,
} from '@/types/forum';

export const forumApi = {
  getPosts: (filters: ForumPostFilters = {}) =>
    api.get<
      PaginatedResponse<{ posts: ForumPost[]; categories: ForumCategory[] }>
    >('/forum/posts', { params: filters }),

  getPost: (id: string) =>
    api.get<{ success: boolean; data: { post: ForumPost } }>(`/forum/posts/${id}`),

  createPost: (data: CreateForumPostPayload) =>
    api.post<{ success: boolean; message: string; data: { post: ForumPost } }>(
      '/forum/posts',
      data
    ),

  updatePost: (id: string, data: UpdateForumPostPayload) =>
    api.patch<{ success: boolean; message: string; data: { post: ForumPost } }>(
      `/forum/posts/${id}`,
      data
    ),

  deletePost: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/forum/posts/${id}`),

  getComments: (postId: string, page = 1, limit = 20) =>
    api.get<PaginatedResponse<{ comments: ForumComment[] }>>(
      `/forum/posts/${postId}/comments`,
      { params: { page, limit } }
    ),

  addComment: (postId: string, content: string) =>
    api.post<{ success: boolean; message: string; data: { comment: ForumComment } }>(
      `/forum/posts/${postId}/comments`,
      { content }
    ),

  updateComment: (id: string, content: string) =>
    api.patch<{ success: boolean; message: string; data: { comment: ForumComment } }>(
      `/forum/comments/${id}`,
      { content }
    ),

  deleteComment: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/forum/comments/${id}`),

  upvotePost: (id: string) =>
    api.post<{ success: boolean; message: string; data: { post: ForumPost } }>(
      `/forum/posts/${id}/vote`
    ),

  removeVote: (id: string) =>
    api.delete<{ success: boolean; message: string; data: { post: ForumPost } }>(
      `/forum/posts/${id}/vote`
    ),
};
