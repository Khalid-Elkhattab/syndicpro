import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { Immeuble } from '@/types/entities.types';

export const immeublesApi = {
  index: (residenceId: number) =>
    axiosInstance.get<ApiResponse<Immeuble[]>>(`/api/syndic/residences/${residenceId}/immeubles`),

  indexByResidence: (residenceId: number) =>
    axiosInstance.get<ApiResponse<Immeuble[]>>(`/api/syndic/residences/${residenceId}/immeubles`),

  show: (id: number) =>
    axiosInstance.get<ApiResponse<Immeuble>>(`/api/syndic/immeubles/${id}`),

  store: (data: { residence_id: number; nom: string }) =>
    axiosInstance.post<ApiResponse<Immeuble>>('/api/syndic/residences/' + data.residence_id + '/immeubles', data),

  update: (id: number, data: { nom: string }) =>
    axiosInstance.put<ApiResponse<Immeuble>>(`/api/syndic/immeubles/${id}`, data),

  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/api/syndic/immeubles/${id}`),
};