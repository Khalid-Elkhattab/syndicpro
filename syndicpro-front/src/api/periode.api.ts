import { axiosInstance } from './axiosInstance';
import type { ApiResponse } from '@/types/api.types';

export interface Periode {
  id: number;
  residence_id: number;
  annee: number;
  is_active: boolean;
  date_debut: string;
  date_fin: string;
  created_at: string;
}

export const periodeApi = {
  index: (residenceId: number) =>
    axiosInstance.get<ApiResponse<Periode[]>>(
      `/api/syndic/residences/${residenceId}/periodes`
    ),

  show: (id: number) =>
    axiosInstance.get<ApiResponse<Periode>>(`/api/syndic/periodes/${id}`),

  store: (residenceId: number, data: { annee: number; date_debut: string; date_fin: string; is_active?: boolean }) =>
    axiosInstance.post<ApiResponse<Periode>>(
      `/api/syndic/residences/${residenceId}/periodes`,
      data
    ),

  update: (id: number, data: { is_active?: boolean; date_debut?: string; date_fin?: string }) =>
    axiosInstance.put<ApiResponse<Periode>>(`/api/syndic/periodes/${id}`, data),

  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/api/syndic/periodes/${id}`),
};