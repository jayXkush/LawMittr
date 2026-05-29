import { api } from './axios';
import type { LegalDocument, Citation } from '@/types/document';
import type { PaginationMeta } from '@/types/api';

export const documentsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<{
      success: boolean;
      message: string;
      data: { document: LegalDocument };
    }>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000, // 2 min for analysis
    });
  },

  listMine: (page = 1, limit = 10) =>
    api.get<{
      success: boolean;
      data: { documents: LegalDocument[] };
      meta: PaginationMeta;
    }>('/documents/me', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<{
      success: boolean;
      data: { document: LegalDocument };
    }>(`/documents/${id}`),

  chat: (id: string, question: string) =>
    api.post<{
      success: boolean;
      data: { answer: string; citations: Citation[] };
    }>(`/documents/${id}/chat`, { question }),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/documents/${id}`),
};
