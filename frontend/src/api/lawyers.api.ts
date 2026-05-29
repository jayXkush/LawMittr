import { api } from './axios';
import type {
  Lawyer,
  AvailabilitySlot,
  LawyerFilters,
  LawyerVerification,
  SubmitVerificationPayload,
} from '@/types/lawyer';
import type { PaginatedResponse } from '@/types/api';

export interface UpdateLawyerProfilePayload {
  specialization?: string[];
  experience?: number;
  city?: string;
  languages?: string[];
  consultationFee?: number;
  bio?: string;
}

export interface CreateSlotPayload {
  date: string;
  startTime: string;
  endTime: string;
}

export const lawyersApi = {
  getAll: (filters: LawyerFilters = {}) =>
    api.get<PaginatedResponse<{ lawyers: Lawyer[] }>>('/lawyers', { params: filters }),

  getById: (id: string, fromDate?: string) =>
    api.get<{
      success: boolean;
      data: { lawyer: Lawyer; availableSlots: AvailabilitySlot[] };
    }>(`/lawyers/${id}`, { params: { fromDate } }),

  getMyProfile: () =>
    api.get<{ success: boolean; data: { lawyer: Lawyer } }>('/lawyers/profile/me'),

  updateMyProfile: (data: UpdateLawyerProfilePayload) =>
    api.put<{ success: boolean; data: { lawyer: Lawyer } }>('/lawyers/profile/me', data),

  getMySlots: () =>
    api.get<{ success: boolean; data: { slots: AvailabilitySlot[] } }>(
      '/lawyers/availability/me'
    ),

  createSlot: (data: CreateSlotPayload) =>
    api.post<{ success: boolean; data: { slot: AvailabilitySlot } }>(
      '/lawyers/availability/me',
      data
    ),

  deleteSlot: (slotId: string) =>
    api.delete<{ success: boolean }>(`/lawyers/availability/me/${slotId}`),

  getMyVerification: () =>
    api.get<{ success: boolean; data: { verification: LawyerVerification } }>(
      '/lawyers/verification/me'
    ),

  submitVerification: (data: SubmitVerificationPayload) =>
    api.put<{
      success: boolean;
      message: string;
      data: { verification: LawyerVerification };
    }>('/lawyers/verification/me', data),
};
