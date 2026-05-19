import { axiosInstance } from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { CompteCharge } from '@/types/entities.types';

export const compteChargeApi = {
  index: (residenceId: number) =>
    axiosInstance.get<PaginatedResponse<CompteCharge>>(
      `/api/syndic/residences/${residenceId}/comptes-charges`
    ),

  show: (residenceId: number, id: number) =>
    axiosInstance.get<ApiResponse<CompteCharge>>(
      `/api/syndic/residences/${residenceId}/comptes-charges/${id}`
    ),

  store: (residenceId: number, data: { nom: string; description?: string; is_active?: boolean }) =>
    axiosInstance.post<ApiResponse<CompteCharge>>(
      `/api/syndic/residences/${residenceId}/comptes-charges`,
      data
    ),

  update: (
    residenceId: number,
    id: number,
    data: { nom?: string; description?: string; is_active?: boolean }
  ) =>
    axiosInstance.put<ApiResponse<CompteCharge>>(
      `/api/syndic/residences/${residenceId}/comptes-charges/${id}`,
      data
    ),

  destroy: (residenceId: number, id: number) =>
    axiosInstance.delete<ApiResponse<null>>(
      `/api/syndic/residences/${residenceId}/comptes-charges/${id}`
    ),
};