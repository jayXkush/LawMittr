import { api } from './axios';
import type { Appointment } from '@/types/appointment';
import type { PaginatedResponse } from '@/types/api';

export const appointmentsApi = {
  book: (slotId: string, notes?: string) =>
    api.post<{ success: boolean; data: { appointment: Appointment } }>('/appointments', {
      slotId,
      notes,
    }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: { appointment: Appointment } }>(`/appointments/me/${id}`),

  getMine: (params: { page?: number; limit?: number; filter?: 'upcoming' | 'history' }) =>
    api.get<PaginatedResponse<{ appointments: Appointment[] }>>('/appointments/me', {
      params,
    }),

  getLawyerAppointments: (params: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<{ appointments: Appointment[] }>>('/appointments/lawyer', {
      params,
    }),

  updateStatus: (id: string, status: 'completed' | 'cancelled') =>
    api.patch<{ success: boolean; data: { appointment: Appointment } }>(
      `/appointments/${id}/status`,
      { status }
    ),

  cancel: (id: string) =>
    api.patch<{ success: boolean; data: { appointment: Appointment } }>(
      `/appointments/me/${id}/cancel`
    ),
};
