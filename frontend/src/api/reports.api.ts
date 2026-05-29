import { api } from './axios';
import type { Report, CreateReportPayload } from '@/types/report';

export const reportsApi = {
  create: (data: CreateReportPayload) =>
    api.post<{ success: boolean; message: string; data: { report: Report } }>(
      '/reports',
      data
    ),
};
