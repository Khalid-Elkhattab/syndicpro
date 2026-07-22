import { axiosInstance } from './axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { CotisationDetail, Paiement } from '@/types/entities.types';
import type { BudgetSummary } from '@/api/budget.api';

export interface RapportBudgetResponse extends BudgetSummary {
  taux_consommation_global: number;
}

export interface RapportImpayeFilters {
  periode_id?: number;
  statut?: 'non_paye' | 'partiellement_paye';
  per_page?: number;
  page?: number;
}

export interface RapportImpayeMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  total_impaye: number;
  nb_impayes: number;
  par_statut: {
    non_paye: number;
    partiellement_paye: number;
  };
}

export interface RapportPaiementFilters {
  date_debut?: string;
  date_fin?: string;
  periode_id?: number;
  per_page?: number;
  page?: number;
}

export interface PaiementParMode {
  especes: number;
  virement: number;
  cheque: number;
  carte: number;
}

export interface RapportPaiementMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  total_percu: number;
  nb_paiements: number;
  par_mode: PaiementParMode;
}

export const rapportApi = {
  getBudget: (residenceId: number, periodeId?: number) => {
    const params = periodeId ? { periode_id: periodeId } : undefined;
    return axiosInstance.get<ApiResponse<RapportBudgetResponse>>(
      `/api/syndic/residences/${residenceId}/rapports/budget`,
      { params }
    );
  },

  getImpayes: (residenceId: number, filters?: RapportImpayeFilters) => {
    const params = filters ? new URLSearchParams() : undefined;
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params!.append(key, String(value));
        }
      });
    }
    return axiosInstance.get<ApiResponse<CotisationDetail[]> & { meta: RapportImpayeMeta }>(
      `/api/syndic/residences/${residenceId}/rapports/impayes`,
      { params }
    );
  },

  getPaiements: (residenceId: number, filters?: RapportPaiementFilters) => {
    const params = filters ? new URLSearchParams() : undefined;
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params!.append(key, String(value));
        }
      });
    }
    return axiosInstance.get<ApiResponse<Paiement[]> & { meta: RapportPaiementMeta }>(
      `/api/syndic/residences/${residenceId}/rapports/paiements`,
      { params }
    );
  },
};
