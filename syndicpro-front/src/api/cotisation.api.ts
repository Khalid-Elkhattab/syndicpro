import { axiosInstance } from './axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Cotisation, CotisationDetail } from '@/types/entities.types';

export interface CotisationFilters {
  type?: 'fixe' | 'exceptionnelle';
  periode_id?: number;
  per_page?: number;
  page?: number;
}

export interface StoreCotisationFixeParams {
  label: string;
  montant_mensuel: number;
  periode_id: number;
  description?: string;
}

export interface StoreCotisationExceptionnelleParams {
  label: string;
  montant_total: number;
  mode_repartition: 'egale' | 'par_appartement' | 'par_tantieme';
  periode_id: number;
  description?: string;
  montants_map?: Record<number, number>;
}

export interface PrevisualisationItem {
  appartement_id: number;
  numero: string;
  coproprietaire_nom: string;
  montant_calcule: number;
}

export interface CotisationTotal {
  total_cotisations: number;
  nb_cotisations: number;
}

export interface MesCotisationsFilters {
  type?: 'fixe' | 'exceptionnelle';
  statut?: string;
  per_page?: number;
  page?: number;
}

export const cotisationApi = {
  getMine: (filters?: MesCotisationsFilters) => {
    const params = filters ? new URLSearchParams() : undefined;
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params!.append(key, String(value));
        }
      });
    }
    return axiosInstance.get<ApiResponse<CotisationDetail[]>>(
      '/api/coproprietaires/cotisations',
      { params }
    );
  },

  getMineDetail: (detailId: number) =>
    axiosInstance.get<ApiResponse<CotisationDetail>>(
      `/api/coproprietaires/cotisations/${detailId}`
    ),
  total: (residenceId: number, periodeId?: number) => {
    const params = periodeId ? { periode_id: periodeId } : undefined;
    return axiosInstance.get<ApiResponse<CotisationTotal>>(
      `/api/syndic/residences/${residenceId}/cotisations/total`,
      { params }
    );
  },

  index: (residenceId: number, filters?: CotisationFilters) => {
    const params = filters ? new URLSearchParams() : undefined;
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params!.append(key, String(value));
        }
      });
    }
    return axiosInstance.get<ApiResponse<Cotisation[]>>(
      `/api/syndic/residences/${residenceId}/cotisations`,
      { params }
    );
  },

  storeFixe: (residenceId: number, data: StoreCotisationFixeParams) =>
    axiosInstance.post<ApiResponse<Cotisation>>(
      `/api/syndic/residences/${residenceId}/cotisations/fixe`,
      data
    ),

  storeExceptionnelle: (residenceId: number, data: StoreCotisationExceptionnelleParams) =>
    axiosInstance.post<ApiResponse<Cotisation>>(
      `/api/syndic/residences/${residenceId}/cotisations/exceptionnelle`,
      data
    ),

  details: (cotisationId: number) =>
    axiosInstance.get<ApiResponse<CotisationDetail[]>>(
      `/api/syndic/cotisations/${cotisationId}/details`
    ),

  previsualiser: (residenceId: number, params: { mode_repartition: string; montant_total: number; periode_id: number }) =>
    axiosInstance.get<ApiResponse<PrevisualisationItem[]>>(
      `/api/syndic/residences/${residenceId}/cotisations/previsualiser`,
      { params }
    ),

  impayes: (residenceId: number, filters?: { periode_id?: number; statut?: string; per_page?: number; page?: number }) => {
    const params = filters ? new URLSearchParams() : undefined;
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params!.append(key, String(value));
        }
      });
    }
    return axiosInstance.get<PaginatedResponse<CotisationDetail>>(
      `/api/syndic/residences/${residenceId}/impayes`,
      { params }
    );
  },
};
