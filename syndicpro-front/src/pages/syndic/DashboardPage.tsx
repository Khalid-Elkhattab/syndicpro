import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiggyBank, TrendingDown, Wallet, AlertTriangle, FileText, AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useDashboardData } from '@/hooks/useDashboardData';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { SkeletonKpi } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Depense } from '@/types/entities.types';

const BudgetBarChart = lazy(() => import('@/components/charts/BudgetBarChart'));
const DepensePieChart = lazy(() => import('@/components/charts/DepensePieChart'));

function ChartFallback() {
  return <div className="bg-white rounded-xl shadow-card p-6 h-[300px] animate-pulse" />;
}

export default function DashboardPage() {
  const { activeResidence } = useResidenceStore();
  const residenceId = activeResidence?.id ?? 0;
  const navigate = useNavigate();

  const {
    isLoading,
    isError,
    refetch,
    budget,
    cotisationsTotal,
    impayesList,
    impayesMeta,
    depensesList,
    reclamationsList,
    chartData,
    pieData,
    activePeriode,
  } = useDashboardData({ residenceId });

  if (!residenceId) {
    return (
      <div className="p-6">
        <PageHeader title="Tableau de bord" subtitle="Sélectionnez une résidence pour commencer." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState message="Impossible de charger le tableau de bord." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        subtitle={
          activeResidence
            ? `${activeResidence.nom} · Exercice ${activePeriode?.annee ?? '—'}`
            : 'Chargement...'
        }
      />

      {isLoading ? (
        <SkeletonKpi count={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
            <div className="animate-fade-in-up" style={{ animationDelay: '0s', animationFillMode: 'backwards' }}>
              <KpiCard
                label="Budget Annuel Prévu"
                value={budget?.prevu_total ?? 0}
                icon={<PiggyBank className="w-5 h-5" />}
                color="brand"
              />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.08s', animationFillMode: 'backwards' }}>
              <KpiCard
                label="Total Consommé"
                value={budget?.consomme_total ?? 0}
                icon={<TrendingDown className="w-5 h-5" />}
                color="warning"
              />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.16s', animationFillMode: 'backwards' }}>
              <KpiCard
                label="Budget Restant"
                value={Math.abs(budget?.restant_total ?? 0)}
                prefix={(budget?.restant_total ?? 0) < 0 ? '- ' : ''}
                icon={<Wallet className="w-5 h-5" />}
                color={(budget?.restant_total ?? 0) >= 0 ? 'success' : 'danger'}
              />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.24s', animationFillMode: 'backwards' }}>
              <KpiCard
                label="Hors Budget"
                value={budget?.hors_budget_total ?? 0}
                icon={<AlertTriangle className="w-5 h-5" />}
                color="warning"
              />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.32s', animationFillMode: 'backwards' }}>
              <KpiCard
                label="Total Cotisations"
                value={cotisationsTotal}
                icon={<FileText className="w-5 h-5" />}
                color="brand"
              />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.40s', animationFillMode: 'backwards' }}>
              <KpiCard
                label="Impayés"
                value={impayesMeta?.total_impaye ?? 0}
                icon={<AlertCircle className="w-5 h-5" />}
                color="danger"
                suffix={impayesMeta && impayesMeta.nb_impayes > 0 ? ` · ${impayesMeta.nb_impayes} dossier(s)` : ''}
                format="custom"
                customFormat={(v) => formatCurrency(v)}
              />
            </div>
          </div>

          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up"
            style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
          >
            <div className="lg:col-span-2">
              <Suspense fallback={<ChartFallback />}>
                <BudgetBarChart data={chartData} />
              </Suspense>
              <button
                onClick={() => navigate('/syndic/budget')}
                className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 transition-colors"
              >
                Voir le budget complet <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div>
              <Suspense fallback={<ChartFallback />}>
                <DepensePieChart data={pieData} />
              </Suspense>
            </div>
          </div>

          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up"
            style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
          >
            <RecentDepensesCard depenses={depensesList} navigate={navigate} />
            <RecentImpayesCard impayes={impayesList as unknown as never[]} navigate={navigate} />
            <RecentReclamationsCard reclamations={reclamationsList as unknown as never[]} navigate={navigate} />
          </div>
        </>
      )}
    </div>
  );
}

function RecentDepensesCard({ depenses, navigate }: { depenses: Depense[]; navigate: (path: string) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Dépenses récentes</h3>
      {depenses.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">Aucune dépense récente.</p>
      ) : (
        <div className="space-y-3">
          {depenses.map((d, i) => (
            <div
              key={d.id}
              className="flex items-center justify-between text-sm animate-fade-in-up"
              style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'backwards' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-text-muted text-xs flex-shrink-0 w-16">{formatDate(d.date)}</span>
                <span className="text-text-secondary truncate">{(d as unknown as { sous_charge?: { nom: string } }).sous_charge?.nom ?? '—'}</span>
              </div>
              <span className="font-mono font-semibold text-text-primary flex-shrink-0 ml-2">
                {formatCurrency(d.montant)}
              </span>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => navigate('/syndic/charges')}
        className="mt-4 text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 transition-colors"
      >
        Voir toutes les dépenses <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

function RecentImpayesCard({ impayes, navigate }: { impayes: Array<{ id: number; montant: number; montant_paye: number; statut: string; coproprietaire?: { name: string }; appartement?: { numero: string } }>; navigate: (path: string) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Impayés récents</h3>
      {impayes.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">Aucun impayé.</p>
      ) : (
        <div className="space-y-3">
          {impayes.slice(0, 5).map((d, i) => (
            <div
              key={d.id}
              className="flex items-center justify-between text-sm animate-fade-in-up"
              style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'backwards' }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate">{d.coproprietaire?.name ?? '—'}</p>
                <p className="text-text-muted text-xs">Lot {d.appartement?.numero ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="font-mono font-semibold text-danger-dark text-sm">
                  {formatCurrency(d.montant - d.montant_paye)}
                </span>
                <Badge
                  label={d.statut === 'non_paye' ? 'Non payé' : 'Partiel'}
                  color={d.statut === 'non_paye' ? 'danger' : 'warning'}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => navigate('/syndic/cotisations')}
        className="mt-4 text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 transition-colors"
      >
        Voir tous les impayés <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

function RecentReclamationsCard({ reclamations, navigate }: { reclamations: Array<{ id: number; titre: string; statut: string; priorite: string; created_at: string; coproprietaire?: { name: string }; appartement?: { numero: string } }>; navigate: (path: string) => void }) {
  const badgeColor = (statut: string) => {
    switch (statut) {
      case 'nouveau': return 'info' as const;
      case 'en_cours': return 'warning' as const;
      case 'traite': return 'success' as const;
      case 'rejete': return 'gray' as const;
      default: return 'gray' as const;
    }
  };

  const badgeLabel = (statut: string) => {
    switch (statut) {
      case 'nouveau': return 'Nouveau';
      case 'en_cours': return 'En cours';
      case 'traite': return 'Traité';
      case 'rejete': return 'Rejeté';
      default: return statut;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Réclamations récentes</h3>
      {reclamations.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">Aucune réclamation.</p>
      ) : (
        <div className="space-y-3">
          {reclamations.slice(0, 3).map((r, i) => (
            <div
              key={r.id}
              className="p-3 rounded-lg bg-surface-50 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'backwards' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  label={badgeLabel(r.statut)}
                  color={badgeColor(r.statut)}
                  pulse={r.statut === 'nouveau'}
                  size="sm"
                />
                {r.priorite === 'urgente' && (
                  <Badge label="Urgente" color="danger" size="sm" />
                )}
              </div>
              <p className="text-sm font-medium text-text-primary truncate">{r.titre}</p>
              <p className="text-xs text-text-muted mt-1">
                {r.coproprietaire?.name ?? '—'} · Lot {r.appartement?.numero ?? '—'}
              </p>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => navigate('/syndic/reclamations')}
        className="mt-4 text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 transition-colors"
      >
        Voir toutes les réclamations <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
