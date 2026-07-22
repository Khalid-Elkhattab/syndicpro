import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { horsBudgetApi, type HorsBudgetFilters } from '@/api/horsBudget.api';
import type { HorsBudget } from '@/types/entities.types';

export const useHorsBudgets = (residenceId: number, filters?: HorsBudgetFilters) =>
  useQuery({
    queryKey: ['horsBudgets', residenceId, filters],
    queryFn: async () => {
      const { data } = await horsBudgetApi.index(residenceId, filters);
      return {
        data: data.data as HorsBudget[],
        meta: data.meta,
      };
    },
    enabled: !!residenceId,
  });

export const useCreateHorsBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      residenceId,
      formData,
    }: {
      residenceId: number;
      formData: FormData;
    }) => horsBudgetApi.store(residenceId, formData),
    onSuccess: (_, { residenceId }) => {
      qc.invalidateQueries({ queryKey: ['horsBudgets', residenceId], exact: false });
      qc.invalidateQueries({ queryKey: ['budget', 'summary'], exact: false });
    },
  });
};

export const useUpdateHorsBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      residenceId: _residenceId,
      id,
      data,
    }: {
      residenceId: number;
      id: number;
      data: { date?: string; montant?: number; description?: string };
    }) => horsBudgetApi.update(id, data),
    onSuccess: (_, { residenceId }) => {
      qc.invalidateQueries({ queryKey: ['horsBudgets', residenceId], exact: false });
      qc.invalidateQueries({ queryKey: ['budget', 'summary'], exact: false });
    },
  });
};

export const useDeleteHorsBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residenceId: _residenceId, id }: { residenceId: number; id: number }) =>
      horsBudgetApi.destroy(id),
    onSuccess: (_, { residenceId }) => {
      qc.invalidateQueries({ queryKey: ['horsBudgets', residenceId], exact: false });
      qc.invalidateQueries({ queryKey: ['budget', 'summary'], exact: false });
    },
  });
};

export const useHorsBudgetJustificatifUrl = (id: number | null) =>
  useQuery({
    queryKey: ['horsBudget', 'justificatif', id],
    queryFn: async () => {
      const { data } = await horsBudgetApi.getJustificatifUrl(id!);
      return data.data.url as string;
    },
    enabled: !!id,
  });