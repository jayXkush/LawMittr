import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type LoginPayload, type RegisterPayload } from '@/api/auth.api';
import { useAuthStore, getDashboardPath } from '@/store/authStore';
import type { ApiError } from '@/types/auth';
import { AxiosError } from 'axios';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const { data } = await authApi.getMe();
      return data.data.user;
    },
    enabled: !!token && !user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.data && !user) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, user, setUser]);

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.token);
      queryClient.setQueryData(AUTH_QUERY_KEY, data.data.user);
      navigate(getDashboardPath(data.data.user.role));
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.token);
      queryClient.setQueryData(AUTH_QUERY_KEY, data.data.user);
      navigate(getDashboardPath(data.data.user.role));
    },
  });

  const logoutUser = () => {
    logout();
    queryClient.clear();
    navigate('/');
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError | undefined;
      return apiError?.message || error.message || 'Something went wrong';
    }
    return 'Something went wrong';
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading: meQuery.isLoading,
    loginMutation,
    registerMutation,
    logout: logoutUser,
    getErrorMessage,
  };
}
