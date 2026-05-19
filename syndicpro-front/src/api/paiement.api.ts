import { axiosInstance } from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Paiement } from '@/types/entities.types';

export interface PaiementFilters {
  coproprietaire_id?: number;
  date_debut?: string;
  date_fin?: string;
  per_page?: number;
  page?: number;
}

export interface StorePaiementParams {
  cotisation_detail_id: number;
  date_paiement: string;
  montant: number;
  mode_paiement: 'especes' | 'virement' | 'cheque' | 'carte';
  reference?: string;
}

export interface MesPaiementsFilters {
  date_debut?: string;
  date_fin?: string;
  per_page?: number;
  page?: number;
}

export const paiementApi = {
  getMine: (filters?: MesPaiementsFilters) => {
    const params = filters ? new URLSearchParams() : undefined;
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params!.append(key, String(value));
        }
      });
    }
    return axiosInstance.get<PaginatedResponse<Paiement>>(
      '/api/coproprietaires/paiements',
      { params }
    );
  },

  getRecuUrlMine: (paiementId: number) =>
    axiosInstance.get<ApiResponse<{ recu_url: string }>>(
      `/api/coproprietaires/paiements/${paiementId}/recu`
    ),
  index: (residenceId: number, filters?: PaiementFilters) => {
    const params = filters ? new URLSearchParams() : undefined;
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params!.append(key, String(value));
        }
      });
    }
    return axiosInstance.get<PaginatedResponse<Paiement>>(
      `/api/syndic/residences/${residenceId}/paiements`,
      { params }
    );
  },

  store: (data: StorePaiementParams) =>
    axiosInstance.post<ApiResponse<Paiement>>(
      '/api/syndic/paiements',
      data
    ),

  getRecuUrl: (paiementId: number) =>
    axiosInstance.get<ApiResponse<{ recu_url: string }>>(
      `/api/syndic/paiements/${paiementId}/recu`
    ),

  downloadRecu: (paiementId: number) =>
    axiosInstance.get(
      `/api/syndic/paiements/${paiementId}/download-recu`,
      { responseType: 'blob' as const }
    ),

  getTotalPercu: (residenceId: number, periodeId?: number) => {
    const params = periodeId ? new URLSearchParams({ periode_id: String(periodeId) }) : undefined;
    return axiosInstance.get<ApiResponse<{ total_percu: number; nb_paiements: number }>>(
      `/api/syndic/residences/${residenceId}/paiements/total-percu`,
      { params }
    );
  },
};