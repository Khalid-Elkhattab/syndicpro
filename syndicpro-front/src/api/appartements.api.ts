import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { Appartement } from '@/types/entities.types';

export const appartementsApi = {
  index: (residenceId: number, params?: { immeuble_id?: number }) =>
    axiosInstance.get<ApiResponse<Appartement[]>>(`/api/syndic/residences/${residenceId}/appartements`, { params }),

  indexByResidence: (residenceId: number) =>
    axiosInstance.get<ApiResponse<Appartement[]>>(`/api/syndic/residences/${residenceId}/appartements`),

  getMine: () =>
    axiosInstance.get<ApiResponse<Appartement[]>>('/api/coproprietaires/appartements'),

  show: (id: number) =>
    axiosInstance.get<ApiResponse<Appartement>>(`/api/syndic/appartements/${id}`),

  store: (data: {
    residence_id: number;
    immeuble_id: number;
    numero: string;
    etage: number;
    tantieme: number;
    coproprietaire_id?: number;
  }) =>
    axiosInstance.post<ApiResponse<Appartement>>('/api/syndic/residences/' + data.residence_id + '/appartements', data),

  update: (id: number, data: {
    numero?: string;
    etage?: number;
    tantieme?: number;
  }) =>
    axiosInstance.put<ApiResponse<Appartement>>(`/api/syndic/appartements/${id}`, data),

  assigner: (id: number, coproprietaireId: number | null) =>
    axiosInstance.put<ApiResponse<Appartement>>(`/api/syndic/appartements/${id}/assigner`, {
      coproprietaire_id: coproprietaireId,
    }),

  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/api/syndic/appartements/${id}`),
};