import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { User } from '@/types/entities.types';

export const login = async (credentials: { username: string; password: string }): Promise<ApiResponse<{ user: User }>> => {
  await axiosInstance.get('/sanctum/csrf-cookie');
  const { data } = await axiosInstance.post<ApiResponse<{ user: User }>>('/api/auth/login', credentials);
  return data;
};

export const logout = () => axiosInstance.post<ApiResponse<null>>('/api/auth/logout');

export const getMe = () => axiosInstance.get<ApiResponse<User>>('/api/auth/me');