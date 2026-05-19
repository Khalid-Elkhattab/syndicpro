import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PiggyBank, TrendingDown, Wallet, AlertTriangle, FileText, AlertCircle,
  ArrowRight, Building2,
} from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { usePeriodes, useBudgetSummary } from '@/hooks/useBudget';
import { useDashboardData } from '@/hooks/useDashboardData';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { BudgetBarChart } from '@/components/charts/BudgetBarChart';
import { DepensePieChart } from '@/components/charts/DepensePieChart';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { SkeletonKpi } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Depense } from '@/types/entities.types';

export default function DashboardPage() {
  const { activeResidence } = useResidenceStore();
  const residenceId = activeResidence?.id ?? 0;
  const navigate = useNavigate();

  const { data: periodes, isLoading: periodesLoading, isError: periodesError, refetch: periodesRefetch } = usePeriodes(residenceId);

  const activePeriode = periodes?.find((p) => p.is_active) ?? periodes?.[0];
  const periodeId = activePeriode?.id ?? 0;

  const { data: budget, isError: budgetError, refetch: budgetRefetch } = useBudgetSummary(periodeId);

  const {
    isLoading,
    cotisationsTotal,
    impayesList,
    impayesMeta,
    depensesList,
    reclamationsList,
    chartData,
    pieData,
  } = useDashboardData({ residenceId, periodeId });

  if (!residenceId) {
    return (
      <div className="p-6">
        <PageHeader title="Tableau de bord" subtitle="Sélectionnez une résidence pour commencer." />
      </div>
    );
  }

  if (periodesError) {
    return (
      <div className="p-6">
        <ErrorState message="Impossible de charger les périodes." onRetry={periodesRefetch} />
      </div>
    );
  }

  if (budgetError) {
    return (
      <div className="p-6">
        <ErrorState message="Impossible de charger le budget." onRetry={budgetRefetch} />
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
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <KpiCard
              label="Budget Annuel Prévu"
              value={budget?.prevu_total ?? 0}
              icon={<PiggyBank className="w-5 h-5" />}
              color="brand"
            />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <KpiCard
              label="Total Consommé"
              value={budget?.consomme_total ?? 0}
              icon={<TrendingDown className="w-5 h-5" />}
              color="warning"
            />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <KpiCard
              label="Budget Restant"
              value={Math.abs(budget?.restant_total ?? 0)}
              prefix={(budget?.restant_total ?? 0) < 0 ? '- ' : ''}
              icon={<Wallet className="w-5 h-5" />}
              color={(budget?.restant_total ?? 0) >= 0 ? 'success' : 'danger'}
            />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <KpiCard
              label="Hors Budget"
              value={budget?.hors_budget_total ?? 0}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="warning"
            />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <KpiCard
              label="Total Cotisations"
              value={cotisationsTotal}
              icon={<FileText className="w-5 h-5" />}
              color="brand"
            />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <KpiCard
              label="Impayés"
              value={impayesMeta?.total_impaye ?? 0}
              icon={<AlertCircle className="w-5 h-5" />}
              color="danger"
              suffix={impayesMeta && impayesMeta.nb_impayes > 0 ? ` · ${impayesMeta.nb_impayes} dossier(s)` : ''}
              format="custom"
              customFormat={(v) => formatCurrency(v)}
            />
          </motion.div>
        </motion.div>
      )}

      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2">
            <BudgetBarChart data={chartData} />
            <button
              onClick={() => navigate('/syndic/budget')}
              className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 transition-colors"
            >
              Voir le budget complet <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div>
            <DepensePieChart data={pieData} />
          </div>
        </motion.div>
      )}

      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <RecentDepensesCard depenses={depensesList} navigate={navigate} />
          <RecentImpayesCard impayes={impayesList} navigate={navigate} />
          <RecentReclamationsCard reclamations={reclamationsList} navigate={navigate} />
        </motion.div>
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
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-text-muted text-xs flex-shrink-0 w-16">{formatDate(d.date)}</span>
                <span className="text-text-secondary truncate">{d.sous_charge?.nom ?? '—'}</span>
              </div>
              <span className="font-mono font-semibold text-text-primary flex-shrink-0 ml-2">
                {formatCurrency(d.montant)}
              </span>
            </motion.div>
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
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate">{d.coproprietaire?.name ?? '—'}</p>
                <p className="text-text-muted text-xs">Appt. {d.appartement?.numero ?? '—'}</p>
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
            </motion.div>
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
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-3 rounded-lg bg-surface-50"
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
                {r.coproprietaire?.name ?? '—'} · Appt. {r.appartement?.numero ?? '—'}
              </p>
            </motion.div>
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
