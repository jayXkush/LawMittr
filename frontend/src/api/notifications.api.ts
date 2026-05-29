import { api } from './axios';
import type { PaginatedResponse } from '@/types/api';
import type { Notification } from '@/types/notification';

export const notificationsApi = {
  getMine: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<{ notifications: Notification[] }>>(
      '/notifications/me',
      { params: { page, limit } }
    ),

  getUnreadCount: () =>
    api.get<{ success: boolean; data: { count: number } }>(
      '/notifications/me/unread-count'
    ),

  markRead: (id: string) =>
    api.patch<{ success: boolean; data: { notification: Notification } }>(
      `/notifications/${id}/read`
    ),

  markAllRead: () =>
    api.patch<{ success: boolean; message: string }>('/notifications/me/read-all'),
};
