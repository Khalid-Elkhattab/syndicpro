import { axiosInstance } from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { SousCharge } from '@/types/entities.types';

export const sousChargeApi = {
  index: (compteChargeId: number) =>
    axiosInstance.get<PaginatedResponse<SousCharge>>(
      `/api/syndic/comptes-charges/${compteChargeId}/sous-charges`
    ),

  indexByResidence: (residenceId: number) =>
    axiosInstance.get<ApiResponse<SousCharge[]>>(
      `/api/syndic/residences/${residenceId}/sous-charges`
    ),

  show: (compteChargeId: number, id: number) =>
    axiosInstance.get<ApiResponse<SousCharge>>(
      `/api/syndic/comptes-charges/${compteChargeId}/sous-charges/${id}`
    ),

  store: (compteChargeId: number, data: { nom: string; description?: string }) =>
    axiosInstance.post<ApiResponse<SousCharge>>(
      `/api/syndic/comptes-charges/${compteChargeId}/sous-charges`,
      data
    ),

  update: (
    compteChargeId: number,
    id: number,
    data: { nom?: string; description?: string }
  ) =>
    axiosInstance.put<ApiResponse<SousCharge>>(
      `/api/syndic/comptes-charges/${compteChargeId}/sous-charges/${id}`,
      data
    ),

  destroy: (compteChargeId: number, id: number) =>
    axiosInstance.delete<ApiResponse<null>>(
      `/api/syndic/comptes-charges/${compteChargeId}/sous-charges/${id}`
    ),
};