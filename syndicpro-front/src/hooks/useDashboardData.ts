import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { dashboardApi } from '@/api/dashboard.api';
import type { Depense } from '@/types/entities.types';

interface DashboardData {
  residenceId: number;
}

export function useDashboardData({ residenceId }: DashboardData) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['syndic-dashboard', residenceId],
    queryFn: async () => {
      const { data } = await dashboardApi.getSyndicDashboard(residenceId);
      return data.data;
    },
    enabled: !!residenceId,
  });

  const activePeriode = data?.active_periode ?? null;

  const chartData = useMemo(() => {
    if (!data?.budget?.par_compte) return [];
    return data.budget.par_compte.map((c) => ({
      nom: c.compte_charge.nom,
      prevu: c.montant_prevu,
      consomme: c.montant_consomme,
    }));
  }, [data]);

  const pieData = useMemo(() => {
    if (!data?.budget?.par_compte) return [];
    const colors = ['#6366f1', '#f59e0b', '#16a34a', '#dc2626', '#2563eb', '#8b5cf6', '#ec4899'];
    return data.budget.par_compte.map((c, i) => ({
      nom: c.compte_charge.nom,
      value: c.montant_consomme,
      color: colors[i % colors.length],
    }));
  }, [data]);

  const impayesList = useMemo(() => data?.impayes?.data ?? [], [data]);
  const depensesList = useMemo(() => (data?.depenses_recentes ?? []) as unknown as Depense[], [data]);
  const reclamationsList = useMemo(() => data?.reclamations_recentes ?? [], [data]);

  return {
    isLoading,
    isError,
    refetch,
    budget: data?.budget ?? null,
    cotisationsTotal: data?.cotisations_total ?? 0,
    impayesList,
    impayesMeta: data?.impayes
      ? {
          total_impaye: data.impayes.total_impaye,
          total_restant_du: data.impayes.total_restant_du,
          nb_impayes: data.impayes.nb_impayes,
        }
      : undefined,
    depensesList,
    reclamationsList,
    chartData,
    pieData,
    activePeriode,
  };
}
