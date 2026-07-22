import { axiosInstance } from './axiosInstance';
import type { ApiResponse } from '@/types/api.types';

export interface BudgetSummary {
  prevu_total: number;
  consomme_total: number;
  restant_total: number;
  hors_budget_total: number;
  par_compte: BudgetCompte[];
}

export interface BudgetCompte {
  id: number;
  compte_charge_id: number;
  compte_charge: {
    id: number;
    nom: string;
  };
  montant_prevu: number;
  montant_consomme: number;
  montant_restant: number;
  pourcentage_consomme: number;
  est_depasse: boolean;
  sous_charges_detail: {
    sous_charge: {
      id: number;
      nom: string;
    };
    consomme: number;
  }[];
}

export interface BudgetCreateData {
  compte_charge_id: number;
  montant_prevu: number;
}

export interface BudgetUpdateData {
  montant_prevu: number;
}

export const budgetApi = {
  getSummary: (periodeId: number) =>
    axiosInstance.get<ApiResponse<BudgetSummary>>(
      `/api/syndic/periodes/${periodeId}/budgets`
    ),

  store: (periodeId: number, data: BudgetCreateData) =>
    axiosInstance.post<ApiResponse<unknown>>(
      `/api/syndic/periodes/${periodeId}/budgets`,
      data
    ),

  update: (budgetId: number, data: BudgetUpdateData) =>
    axiosInstance.put<ApiResponse<unknown>>(
      `/api/syndic/budgets/${budgetId}`,
      data
    ),
};