import { api } from './axios';
import type { PaginatedResponse } from '@/types/api';
import type {
  AdminUser,
  AdminLawyer,
  AnalyticsSummary,
  DocumentAnalytics,
  AdminListParams,
  AdminLawyerListParams,
  AdminAppointmentListParams,
} from '@/types/admin';
import type { Appointment } from '@/types/appointment';
import type { ForumPost, ForumComment } from '@/types/forum';
import type { Report } from '@/types/report';

export const adminApi = {
  getAnalyticsSummary: () =>
    api.get<{ success: boolean; data: { summary: AnalyticsSummary } }>(
      '/admin/analytics/summary'
    ),

  getDocumentAnalytics: () =>
    api.get<{ success: boolean; data: { analytics: DocumentAnalytics } }>(
      '/admin/documents/analytics'
    ),

  getUsers: (params: AdminListParams & { role?: string } = {}) =>
    api.get<PaginatedResponse<{ users: AdminUser[] }>>('/admin/users', { params }),

  getUser: (id: string) =>
    api.get<{
      success: boolean;
      data: { user: AdminUser; lawyerProfile: AdminLawyer | null };
    }>(`/admin/users/${id}`),

  deactivateUser: (id: string) =>
    api.patch<{ success: boolean; data: { user: AdminUser } }>(
      `/admin/users/${id}/deactivate`
    ),

  reactivateUser: (id: string) =>
    api.patch<{ success: boolean; data: { user: AdminUser } }>(
      `/admin/users/${id}/reactivate`
    ),

  getLawyers: (params: AdminLawyerListParams = {}) =>
    api.get<PaginatedResponse<{ lawyers: AdminLawyer[] }>>('/admin/lawyers', {
      params,
    }),

  getLawyer: (id: string) =>
    api.get<{ success: boolean; data: { lawyer: AdminLawyer } }>(
      `/admin/lawyers/${id}`
    ),

  approveLawyer: (id: string) =>
    api.patch<{ success: boolean; data: { lawyer: AdminLawyer } }>(
      `/admin/lawyers/${id}/verify/approve`
    ),

  rejectLawyer: (id: string, rejectionReason: string) =>
    api.patch<{ success: boolean; data: { lawyer: AdminLawyer } }>(
      `/admin/lawyers/${id}/verify/reject`,
      { rejectionReason }
    ),

  getAppointments: (params: AdminAppointmentListParams = {}) =>
    api.get<PaginatedResponse<{ appointments: Appointment[] }>>(
      '/admin/appointments',
      { params }
    ),

  getAppointment: (id: string) =>
    api.get<{ success: boolean; data: { appointment: Appointment } }>(
      `/admin/appointments/${id}`
    ),

  getForumPosts: (params: AdminListParams = {}) =>
    api.get<PaginatedResponse<{ posts: ForumPost[] }>>('/admin/forum/posts', {
      params,
    }),

  deleteForumPost: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/admin/forum/posts/${id}`),

  getForumComments: (params: AdminListParams & { postId?: string } = {}) =>
    api.get<PaginatedResponse<{ comments: ForumComment[] }>>(
      '/admin/forum/comments',
      { params }
    ),

  deleteForumComment: (id: string) =>
    api.delete<{ success: boolean; message: string }>(
      `/admin/forum/comments/${id}`
    ),

  getReports: (params: AdminListParams & { status?: string } = {}) =>
    api.get<PaginatedResponse<{ reports: Report[] }>>('/admin/reports', {
      params,
    }),

  getReport: (id: string) =>
    api.get<{ success: boolean; data: { report: Report } }>(`/admin/reports/${id}`),

  resolveReport: (id: string) =>
    api.patch<{ success: boolean; data: { report: Report } }>(
      `/admin/reports/${id}/resolve`
    ),
};
