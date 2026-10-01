import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cotisationApi, type CotisationFilters, type StoreCotisationFixeParams, type StoreCotisationExceptionnelleParams, type MesCotisationsFilters } from '@/api/cotisation.api';
import type { Cotisation, CotisationDetail } from '@/types/entities.types';


export const useCotisations = (residenceId: number, filters?: CotisationFilters) =>
  useQuery({
    queryKey: ['cotisations', residenceId, filters],
    queryFn: async () => {
      const { data } = await cotisationApi.index(residenceId, filters);
      return (data.data ?? []) as Cotisation[];
    },
    enabled: !!residenceId,
  });

export const useCotisationsFixes = (residenceId: number, periodeId?: number) =>
  useQuery({
    queryKey: ['cotisations', residenceId, { type: 'fixe', periode_id: periodeId }],
    queryFn: async () => {
      const { data } = await cotisationApi.index(residenceId, { type: 'fixe', periode_id: periodeId });
      return (data.data ?? []) as Cotisation[];
    },
    enabled: !!residenceId && !!periodeId,
  });

export const useCotisationsExceptionnelles = (residenceId: number, periodeId?: number) =>
  useQuery({
    queryKey: ['cotisations', residenceId, { type: 'exceptionnelle', periode_id: periodeId }],
    queryFn: async () => {
      const { data } = await cotisationApi.index(residenceId, { type: 'exceptionnelle', periode_id: periodeId });
      return (data.data ?? []) as Cotisation[];
    },
    enabled: !!residenceId && !!periodeId,
  });

export const useCreateCotisationFixe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residenceId, data }: { residenceId: number; data: StoreCotisationFixeParams }) =>
      cotisationApi.storeFixe(residenceId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotisations'] });
    },
  });
};

export const useCreateCotisationExceptionnelle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residenceId, data }: { residenceId: number; data: StoreCotisationExceptionnelleParams }) =>
      cotisationApi.storeExceptionnelle(residenceId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotisations'] });
    },
  });
};

export const usePrevisualisation = (
  residenceId: number,
  params: { mode_repartition: string; montant_total: number; periode_id: number } | null
) =>
  useQuery({
    queryKey: ['cotisations', 'previsualiser', residenceId, params],
    queryFn: async () => {
      if (!params) return [];
      const { data } = await cotisationApi.previsualiser(residenceId, params);
      return data.data;
    },
    enabled: !!residenceId && !!params,
  });

export const useImpayes = (
  residenceId: number,
  filters?: { periode_id?: number; statut?: string; per_page?: number; page?: number }
) =>
  useQuery({
    queryKey: ['impayes', residenceId, filters],
    queryFn: async () => {
      const { data } = await cotisationApi.impayes(residenceId, filters);
      return {
        data: data.data as CotisationDetail[],
        meta: data.meta as {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        },
      };
    },
    enabled: !!residenceId,
  });

export const useCotisationDetails = (cotisationId: number | null) =>
  useQuery({
    queryKey: ['cotisations', 'details', cotisationId],
    queryFn: async () => {
      const { data } = await cotisationApi.details(cotisationId!);
      return (data.data ?? []) as CotisationDetail[];
    },
    enabled: !!cotisationId,
  });

export const useMesCotisations = (filters?: MesCotisationsFilters) =>
  useQuery({
    queryKey: ['copro', 'cotisations', filters],
    queryFn: async () => {
      const { data } = await cotisationApi.getMine(filters);
      return (data.data ?? []) as CotisationDetail[];
    },
  });
