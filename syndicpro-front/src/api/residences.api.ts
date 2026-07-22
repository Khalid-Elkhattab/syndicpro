import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { Residence } from '@/types/entities.types';

export const residencesApi = {
  index: () =>
    axiosInstance.get<ApiResponse<Residence[]>>('/api/syndic/residences'),

  show: (id: number) =>
    axiosInstance.get<ApiResponse<Residence>>(`/api/syndic/residences/${id}`),

  store: (data: { nom: string; ville: string; adresse: string }) =>
    axiosInstance.post<ApiResponse<Residence>>('/api/syndic/residences', data),

  update: (id: number, data: { nom?: string; ville?: string; adresse?: string }) =>
    axiosInstance.put<ApiResponse<Residence>>(`/api/syndic/residences/${id}`, data),

  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/api/syndic/residences/${id}`),
};