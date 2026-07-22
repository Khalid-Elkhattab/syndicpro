import { axiosInstance } from './axiosInstance';
import type { ApiResponse } from '@/types/api.types';
import type { Appartement } from '@/types/entities.types';

export interface CoproDashboardData {
  montant_du_ce_mois: number;
  total_impayes: number;
  nb_impayes: number;
  dernier_paiement: { date: string; montant: number } | null;
  reclamations_en_cours: number;
  appartements: Appartement[];
  activite_recente: ActiviteItem[];
}

export interface ActiviteItem {
  type: 'paiement' | 'reclamation';
  id: number;
  date: string;
  montant?: number;
  titre?: string;
  statut?: string;
}

export interface SyndicDashboardData {
  active_periode: {
    id: number;
    annee: string;
    mois_debut: number;
    mois_fin: number;
    is_active: boolean;
    date_debut: string;
    date_fin: string;
    residence_id: number;
  } | null;
  budget: {
    prevu_total: number;
    consomme_total: number;
    restant_total: number;
    hors_budget_total: number;
    taux_consommation_global: number;
    par_compte: Array<{
      id: number;
      compte_charge_id: number;
      compte_charge: { id: number; nom: string };
      montant_prevu: number;
      montant_consomme: number;
      montant_restant: number;
      pourcentage_consomme: number;
      est_depasse: boolean;
      sous_charges_detail: Array<{
        sous_charge: { id: number; nom: string };
        consomme: number;
      }>;
    }>;
  } | null;
  cotisations_total: number;
  impayes: {
    data: Array<Record<string, unknown>>;
    total_impaye: number;
    total_restant_du: number;
    nb_impayes: number;
  };
  depenses_recentes: Array<Record<string, unknown>>;
  reclamations_recentes: Array<Record<string, unknown>>;
}

export const dashboardApi = {
  getCoproDashboard: () =>
    axiosInstance.get<ApiResponse<CoproDashboardData>>('/api/coproprietaires/dashboard'),

  getSyndicDashboard: (residenceId: number) =>
    axiosInstance.get<ApiResponse<SyndicDashboardData>>(`/api/syndic/residences/${residenceId}/dashboard`),
};
