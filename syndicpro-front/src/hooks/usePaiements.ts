import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paiementApi, type PaiementFilters, type StorePaiementParams, type MesPaiementsFilters } from '@/api/paiement.api';
import type { Paiement } from '@/types/entities.types';

export const usePaiements = (residenceId: number, filters?: PaiementFilters) =>
  useQuery({
    queryKey: ['paiements', residenceId, filters],
    queryFn: async () => {
      const { data } = await paiementApi.index(residenceId, filters);
      return {
        data: data.data as Paiement[],
        meta: data.meta,
      };
    },
    enabled: !!residenceId,
  });

export const useTotalPercu = (residenceId: number, periodeId?: number) =>
  useQuery({
    queryKey: ['paiements', 'total-percu', residenceId, periodeId],
    queryFn: async () => {
      const { data } = await paiementApi.getTotalPercu(residenceId, periodeId);
      return data.data;
    },
    enabled: !!residenceId,
  });

export const useEnregistrerPaiement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: StorePaiementParams) => paiementApi.store(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      qc.invalidateQueries({ queryKey: ['cotisations'] });
      qc.invalidateQueries({ queryKey: ['impayes'] });
    },
  });
};

export const useRecuUrl = (paiementId: number | null) =>
  useQuery({
    queryKey: ['paiement', 'recu', paiementId],
    queryFn: async () => {
      if (!paiementId) return null;
      const { data } = await paiementApi.getRecuUrl(paiementId);
      return data.data.recu_url as string;
    },
    enabled: !!paiementId,
  });

export const useMesPaiements = (filters?: MesPaiementsFilters) =>
  useQuery({
    queryKey: ['copro', 'paiements', filters],
    queryFn: async () => {
      const { data } = await paiementApi.getMine(filters);
      return {
        data: data.data as Paiement[],
        meta: data.meta,
      };
    },
  });

export const useRecuUrlMine = (paiementId: number | null) =>
  useQuery({
    queryKey: ['copro', 'paiement', 'recu', paiementId],
    queryFn: async () => {
      if (!paiementId) return null;
      const { data } = await paiementApi.getRecuUrlMine(paiementId);
      return data.data.recu_url as string;
    },
    enabled: !!paiementId,
  });