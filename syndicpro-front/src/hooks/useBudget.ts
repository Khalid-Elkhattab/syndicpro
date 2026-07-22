import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetApi, type BudgetSummary } from '@/api/budget.api';
import { periodeApi, type Periode } from '@/api/periode.api';

export const usePeriodes = (residenceId: number) =>
  useQuery({
    queryKey: ['periodes', residenceId],
    queryFn: async () => {
      const { data } = await periodeApi.index(residenceId);
      return (data.data ?? []) as Periode[];
    },
    enabled: !!residenceId,
  });

export const useBudgetSummary = (periodeId: number) =>
  useQuery({
    queryKey: ['budget', 'summary', periodeId],
    queryFn: async () => {
      const { data } = await budgetApi.getSummary(periodeId);
      return (data.data ?? null) as BudgetSummary | null;
    },
    enabled: !!periodeId,
  });

export const useCreateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ periodeId, data }: { periodeId: number; data: { compte_charge_id: number; montant_prevu: number } }) =>
      budgetApi.store(periodeId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['budget', 'summary', variables.periodeId] });
    },
  });
};

export const useUpdateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, data }: { budgetId: number; data: { montant_prevu: number } }) =>
      budgetApi.update(budgetId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget'] });
    },
  });
};

export const useCreatePeriode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residenceId, data }: { residenceId: number; data: { annee: number; date_debut: string; date_fin: string; is_active?: boolean } }) =>
      periodeApi.store(residenceId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['periodes', variables.residenceId] });
    },
  });
};

export const useUpdatePeriode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { is_active?: boolean; date_debut?: string; date_fin?: string } }) =>
      periodeApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['periodes'] });
      qc.invalidateQueries({ queryKey: ['budget'] });
    },
  });
};