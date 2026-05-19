import { axiosInstance } from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Reclamation } from '@/types/entities.types';

export interface ReclamationFilters {
  statut?: string;
  priorite?: string;
  date_debut?: string;
  date_fin?: string;
  search?: string;
  per_page?: number;
}

export interface StoreReclamationParams {
  appartement_id: number;
  titre: string;
  description: string;
  priorite: 'normale' | 'urgente';
}

export interface UpdateReclamationStatutParams {
  statut: 'en_cours' | 'traite' | 'rejete';
  reponse_syndic?: string;
}

export const reclamationApi = {
  getByResidence: async (
    residenceId: number,
    filters?: ReclamationFilters
  ) => {
    const { data } = await axiosInstance.get<
      PaginatedResponse<Reclamation>
    >(`/api/syndic/residences/${residenceId}/reclamations`, {
      params: filters,
    });
    return data;
  },

  getMine: async () => {
    const { data } = await axiosInstance.get<ApiResponse<Reclamation[]>>(
      '/api/coproprietaires/reclamations'
    );
    return data;
  },

  show: async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<Reclamation>>(
      `/api/syndic/reclamations/${id}`
    );
    return data;
  },

  showMine: async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<Reclamation>>(
      `/api/coproprietaires/reclamations/${id}`
    );
    return data;
  },

  store: async (params: StoreReclamationParams) => {
    const { data } = await axiosInstance.post<ApiResponse<Reclamation>>(
      '/api/coproprietaires/reclamations',
      params
    );
    return data;
  },

  updateStatut: async (id: number, params: UpdateReclamationStatutParams) => {
    const { data } = await axiosInstance.put<ApiResponse<Reclamation>>(
      `/api/syndic/reclamations/${id}/statut`,
      params
    );
    return data;
  },
};