import { axiosInstance } from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { HorsBudget } from '@/types/entities.types';

export interface HorsBudgetFilters {
  date_debut?: string;
  date_fin?: string;
  per_page?: number;
  page?: number;
}

export const horsBudgetApi = {
  index: (residenceId: number, filters?: HorsBudgetFilters) => {
    const params = filters ? new URLSearchParams() : undefined;
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params!.append(key, String(value));
        }
      });
    }
    return axiosInstance.get<PaginatedResponse<HorsBudget>>(
      `/api/syndic/residences/${residenceId}/hors-budgets`,
      { params }
    );
  },

  show: (residenceId: number, id: number) =>
    axiosInstance.get<ApiResponse<HorsBudget>>(
      `/api/syndic/residences/${residenceId}/hors-budgets/${id}`
    ),

  store: (residenceId: number, formData: FormData) =>
    axiosInstance.post<ApiResponse<HorsBudget>>(
      `/api/syndic/residences/${residenceId}/hors-budgets`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  update: (residenceId: number, id: number, data: { date?: string; montant?: number; description?: string }) =>
    axiosInstance.put<ApiResponse<HorsBudget>>(
      `/api/syndic/residences/${residenceId}/hors-budgets/${id}`,
      data
    ),

  destroy: (residenceId: number, id: number) =>
    axiosInstance.delete<ApiResponse<null>>(
      `/api/syndic/residences/${residenceId}/hors-budgets/${id}`
    ),

  getJustificatifUrl: (id: number) =>
    axiosInstance.get<ApiResponse<{ url: string }>>(
      `/api/syndic/hors-budgets/${id}/justificatif`
    ),
};