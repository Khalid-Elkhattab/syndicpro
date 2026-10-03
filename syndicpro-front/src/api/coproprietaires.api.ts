import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { User } from '@/types/entities.types';

export const coproprietairesApi = {
  index: (params?: {
    search?: string;
    residence_id?: number;
    is_active?: boolean;
    per_page?: number;
    page?: number;
  }) =>
    axiosInstance.get<PaginatedResponse<User>>('/api/syndic/coproprietaires', { params }),

  show: (id: number) =>
    axiosInstance.get<ApiResponse<User>>(`/api/syndic/coproprietaires/${id}`),

  store: (data: {
    name: string;
    email: string;
    phone?: string;
    username: string;
    password?: string;
    password_confirmation?: string;
  }) =>
    axiosInstance.post<ApiResponse<User>>('/api/syndic/coproprietaires', data),

  activate: (token: string, data: { password: string; password_confirmation: string }) =>
    axiosInstance.post<ApiResponse<null>>(`/api/auth/activate/${token}`, data),

  update: (id: number, data: {
    name?: string;
    email?: string;
    phone?: string;
    username?: string;
  }) =>
    axiosInstance.put<ApiResponse<User>>(`/api/syndic/coproprietaires/${id}`, data),

  resetPassword: (id: number, password: string, passwordConfirmation: string) =>
    axiosInstance.post<ApiResponse<User>>(`/api/syndic/coproprietaires/${id}/reset-password`, {
      password,
      password_confirmation: passwordConfirmation,
    }),

  toggleActif: (id: number) =>
    axiosInstance.put<ApiResponse<User>>(`/api/syndic/coproprietaires/${id}/toggle-actif`),
};