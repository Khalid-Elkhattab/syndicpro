import { useQuery } from '@tanstack/react-query';
import { rapportApi, type RapportImpayeFilters, type RapportPaiementFilters } from '@/api/rapport.api';

export const useRapportBudget = (residenceId: number, periodeId?: number) =>
  useQuery({
    queryKey: ['rapport', 'budget', residenceId, periodeId],
    queryFn: async () => {
      const { data } = await rapportApi.getBudget(residenceId, periodeId);
      return data.data;
    },
    enabled: !!residenceId,
  });

export const useRapportImpayes = (residenceId: number, filters?: RapportImpayeFilters) =>
  useQuery({
    queryKey: ['rapport', 'impayes', residenceId, filters],
    queryFn: async () => {
      const response = await rapportApi.getImpayes(residenceId, filters);
      return {
        data: response.data.data,
        meta: response.data.meta as unknown as {
          total_impaye: number;
          nb_impayes: number;
          par_statut: { non_paye: number; partiellement_paye: number };
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        },
      };
    },
    enabled: !!residenceId,
  });

export const useRapportPaiements = (residenceId: number, filters?: RapportPaiementFilters) =>
  useQuery({
    queryKey: ['rapport', 'paiements', residenceId, filters],
    queryFn: async () => {
      const response = await rapportApi.getPaiements(residenceId, filters);
      return {
        data: response.data.data,
        meta: response.data.meta as unknown as {
          total_percu: number;
          nb_paiements: number;
          par_mode: { especes: number; virement: number; cheque: number; carte: number };
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        },
      };
    },
    enabled: !!residenceId,
  });
