import { axiosInstance } from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Depense } from '@/types/entities.types';

export interface DepenseFilters {
  sous_charge_id?: number;
  compte_charge_id?: number;
  date_debut?: string;
  date_fin?: string;
  per_page?: number;
  page?: number;
}

export const depenseApi = {
  index: (residenceId: number, filters?: DepenseFilters) => {
    const params = filters ? new URLSearchParams() : undefined;
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params!.append(key, String(value));
        }
      });
    }
    return axiosInstance.get<PaginatedResponse<Depense>>(
      `/api/syndic/residences/${residenceId}/depenses`,
      { params }
    );
  },

  show: (residenceId: number, id: number) =>
    axiosInstance.get<ApiResponse<Depense>>(
      `/api/syndic/residences/${residenceId}/depenses/${id}`
    ),

  store: (residenceId: number, formData: FormData) =>
    axiosInstance.post<ApiResponse<Depense>>(
      `/api/syndic/residences/${residenceId}/depenses`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  update: (residenceId: number, id: number, data: { date?: string; montant?: number; description?: string }) =>
    axiosInstance.put<ApiResponse<Depense>>(
      `/api/syndic/residences/${residenceId}/depenses/${id}`,
      data
    ),

  destroy: (residenceId: number, id: number) =>
    axiosInstance.delete<ApiResponse<null>>(
      `/api/syndic/residences/${residenceId}/depenses/${id}`
    ),

  getJustificatifUrl: (id: number) =>
    axiosInstance.get<ApiResponse<{ url: string }>>(
      `/api/syndic/depenses/${id}/justificatif`
    ),
};