import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { compteChargeApi } from '@/api/compteCharge.api';
import { sousChargeApi } from '@/api/sousCharge.api';

import type { CompteCharge, SousCharge } from '@/types/entities.types';

export const useCompteCharges = (residenceId: number) =>
  useQuery({
    queryKey: ['compteCharges', residenceId],
    queryFn: async () => {
      const { data } = await compteChargeApi.index(residenceId);
      return (data.data ?? []) as CompteCharge[];
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
    onSuccess: (_, { residenceId }) => {
      qc.invalidateQueries({ queryKey: ['compteCharges', residenceId] });
      qc.invalidateQueries({ queryKey: ['budget', 'summary'] });
    },
  });
};

export const useUpdateCompteCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      residenceId: _residenceId,
      id,
      ...payload
    }: {
      residenceId: number;
      id: number;
      nom?: string;
      description?: string;
      is_active?: boolean;
    }) => compteChargeApi.update(id, payload),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['compteCharges', residenceId] }),
  });
};

export const useDeleteCompteCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residenceId: _residenceId, id }: { residenceId: number; id: number }) =>
      compteChargeApi.destroy(id),
    onSuccess: (_, { residenceId }) => {
      qc.invalidateQueries({ queryKey: ['compteCharges', residenceId] });
      qc.invalidateQueries({ queryKey: ['budget', 'summary'] });
    },
  });
};

export const useSousChargesByResidence = (residenceId: number) =>
  useQuery({
    queryKey: ['sousCharges', 'residence', residenceId],
    queryFn: async () => {
      const { data } = await sousChargeApi.indexByResidence(residenceId);
      return (data.data ?? []) as SousCharge[];
    },
    enabled: !!residenceId,
  });

export const useCreateSousCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      compteChargeId,
      residenceId: _residenceId,
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
      compteChargeId: _compteChargeId,
      id,
      residenceId: _residenceId,
      ...payload
    }: {
      compteChargeId: number;
      id: number;
      residenceId: number;
      nom?: string;
      description?: string;
    }) => sousChargeApi.update(id, payload),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['sousCharges', 'residence', residenceId] }),
  });
};

export const useDeleteSousCharge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      compteChargeId: _compteChargeId,
      id,
      residenceId: _residenceId,
    }: {
      compteChargeId: number;
      id: number;
      residenceId: number;
    }) => sousChargeApi.destroy(id),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['sousCharges', 'residence', residenceId] }),
  });
};