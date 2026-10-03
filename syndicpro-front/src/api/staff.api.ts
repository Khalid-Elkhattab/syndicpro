import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  username: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  status: string;
  roles: string[];
  permissions: string[];
  residences: Record<string, string>;
  created_at: string;
}

export interface PermissionGroup {
  [module: string]: { name: string; action: string }[];
}

export const staffApi = {
  permissions: () =>
    axiosInstance.get<ApiResponse<PermissionGroup>>('/api/syndic/staff/permissions'),

  index: (params?: { per_page?: number; page?: number }) =>
    axiosInstance.get<PaginatedResponse<StaffMember>>('/api/syndic/staff', { params }),

  store: (data: {
    name: string;
    email: string;
    username: string;
    phone?: string;
    password: string;
    password_confirmation: string;
    role: string;
    residences?: number[];
    permissions?: string[];
  }) =>
    axiosInstance.post<ApiResponse<StaffMember>>('/api/syndic/staff', data),

  update: (id: number, data: {
    name?: string;
    phone?: string;
    is_active?: boolean;
    residences?: number[];
    permissions?: string[];
  }) =>
    axiosInstance.put<ApiResponse<StaffMember>>(`/api/syndic/staff/${id}`, data),

  toggleActif: (id: number) =>
    axiosInstance.put<ApiResponse<StaffMember>>(`/api/syndic/staff/${id}/toggle-actif`),

  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/api/syndic/staff/${id}`),
};
