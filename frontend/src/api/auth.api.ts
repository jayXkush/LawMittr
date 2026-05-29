import { api } from './axios';
import type { AuthResponse, MeResponse } from '@/types/auth';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'lawyer';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: LoginPayload) => api.post<AuthResponse>('/auth/login', data),

  getMe: () => api.get<MeResponse>('/auth/me'),
};
