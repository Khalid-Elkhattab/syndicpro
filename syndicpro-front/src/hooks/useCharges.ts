import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { compteChargeApi } from '@/api/compteCharge.api';
import { sousChargeApi } from '@/api/sousCharge.api';
import type { ApiResponse } from '@/types/api.types';
import type { CompteCharge, SousCharge } from '@/types/entities.types';

export const useCompteCharges = (residenceId: number) =>
  useQuery({
    queryKey: ['compteCharges', residenceId],
    queryFn: async () => {
      const { data } = await compteChargeApi.index(residenceId);
      return data.data as CompteCharge[];
    },
    enabled: !!residenceId,
  });

export const useCreateCompteCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      residenceId,
      ...payload
    }: {
      residenceId: number;
      nom: string;
      description?: string;
      is_active?: boolean;
    }) => compteChargeApi.store(residenceId, payload),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['compteCharges', residenceId] }),
  });
};

export const useUpdateCompteCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      residenceId,
      id,
      ...payload
    }: {
      residenceId: number;
      id: number;
      nom?: string;
      description?: string;
      is_active?: boolean;
    }) => compteChargeApi.update(residenceId, id, payload),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['compteCharges', residenceId] }),
  });
};

export const useDeleteCompteCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residenceId, id }: { residenceId: number; id: number }) =>
      compteChargeApi.destroy(residenceId, id),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['compteCharges', residenceId] }),
  });
};

export const useSousChargesByResidence = (residenceId: number) =>
  useQuery({
    queryKey: ['sousCharges', 'residence', residenceId],
    queryFn: async () => {
      const { data } = await sousChargeApi.indexByResidence(residenceId);
      return data.data as SousCharge[];
    },
    enabled: !!residenceId,
  });

export const useCreateSousCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      compteChargeId,
      residenceId,
      ...payload
    }: {
      compteChargeId: number;
      residenceId: number;
      nom: string;
      description?: string;
    }) => sousChargeApi.store(compteChargeId, payload),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['sousCharges', 'residence', residenceId] }),
  });
};

export const useUpdateSousCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      compteChargeId,
      id,
      residenceId,
      ...payload
    }: {
      compteChargeId: number;
      id: number;
      residenceId: number;
      nom?: string;
      description?: string;
    }) => sousChargeApi.update(compteChargeId, id, payload),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['sousCharges', 'residence', residenceId] }),
  });
};

export const useDeleteSousCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      compteChargeId,
      id,
      residenceId,
    }: {
      compteChargeId: number;
      id: number;
      residenceId: number;
    }) => sousChargeApi.destroy(compteChargeId, id),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['sousCharges', 'residence', residenceId] }),
  });
};