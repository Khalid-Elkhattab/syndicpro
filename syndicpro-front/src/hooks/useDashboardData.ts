import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useBudgetSummary, usePeriodes } from './useBudget';
import { useDepenses } from './useDepenses';
import { useReclamationsResidence } from './useReclamations';
import { useRapportImpayes } from './useRapports';
import { cotisationApi } from '@/api/cotisation.api';
import type { Depense } from '@/types/entities.types';

interface DashboardData {
  residenceId: number;
  periodeId: number;
}

export function useDashboardData({ residenceId, periodeId }: DashboardData) {
  const { data: periodes, isLoading: periodesLoading } = usePeriodes(residenceId);
  const { data: budget, isLoading: budgetLoading } = useBudgetSummary(periodeId);
  const { data: cotisations, isLoading: cotisationsLoading } = useQuery({
    queryKey: ['cotisations', 'total', residenceId, periodeId],
    queryFn: async () => {
      const { data } = await cotisationApi.total(residenceId, periodeId);
      return data.data;
    },
    enabled: !!residenceId && !!periodeId,
  });
  const { data: impayes, isLoading: impayesLoading } = useRapportImpayes(residenceId, {
    periode_id: periodeId,
    per_page: 5,
  });
  const { data: recentDepenses, isLoading: depensesLoading } = useDepenses(residenceId, {
    per_page: 5,
  });
  const { data: reclamations, isLoading: reclamationsLoading } = useReclamationsResidence(residenceId, {
    per_page: 3,
  });

  const isLoading = periodesLoading || budgetLoading || cotisationsLoading || impayesLoading || depensesLoading || reclamationsLoading;

  const activePeriode = useMemo(() => {
    if (!periodes) return null;
    return periodes.find((p) => p.id === periodeId) ?? periodes.find((p) => p.is_active) ?? periodes[0];
  }, [periodes, periodeId]);

  const chartData = useMemo(() => {
    if (!budget?.par_compte) return [];
    return budget.par_compte.map((c) => ({
      nom: c.compte_charge.nom,
      prevu: c.montant_prevu,
      consomme: c.montant_consomme,
    }));
  }, [budget]);

  const pieData = useMemo(() => {
    if (!budget?.par_compte) return [];
    const colors = ['#6366f1', '#f59e0b', '#16a34a', '#dc2626', '#2563eb', '#8b5cf6', '#ec4899'];
    return budget.par_compte.map((c, i) => ({
      nom: c.compte_charge.nom,
      value: c.montant_consomme,
      color: colors[i % colors.length],
    }));
  }, [budget]);

  const impayesList = useMemo(() => impayes?.data ?? [], [impayes]);
  const impayesMeta = impayes?.meta;
  const depensesList = useMemo(() => (recentDepenses?.data ?? []) as Depense[], [recentDepenses]);
  const reclamationsList = useMemo(() => reclamations?.data ?? [], [reclamations]);

  return {
    isLoading,
    budget,
    cotisationsTotal: cotisations?.total_cotisations ?? 0,
    impayesList,
    impayesMeta,
    depensesList,
    reclamationsList,
    chartData,
    pieData,
    activePeriode,
  };
}
