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

export const dashboardApi = {
  getCoproDashboard: () =>
    axiosInstance.get<ApiResponse<CoproDashboardData>>('/api/coproprietaires/dashboard'),
};
