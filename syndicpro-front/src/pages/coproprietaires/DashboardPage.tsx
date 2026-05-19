import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useCoproDashboard } from '@/hooks/useCoproDashboard';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { Building, CreditCard, AlertTriangle, Clock, FileText, MessageSquare } from 'lucide-react';
import { SkeletonLine, SkeletonRect } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

function SkeletonKpiRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-card p-6 space-y-3">
          <SkeletonLine width="60%" />
          <SkeletonLine width="80%" className="h-8" />
          <SkeletonLine width="50%" className="h-3" />
        </div>
      ))}
    </div>
  );
}

function SkeletonAppartements() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-card p-4 space-y-2">
          <SkeletonLine width="60%" className="h-5" />
          <SkeletonLine width="50%" className="h-4" />
          <SkeletonLine width="80%" className="h-4" />
          <SkeletonLine width="40%" className="h-4" />
        </div>
      ))}
    </div>
  );
}

function SkeletonActivity() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <SkeletonRect className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <SkeletonLine width="60%" className="h-4" />
            <SkeletonLine width="40%" className="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: dashboard, isLoading, isError, refetch } = useCoproDashboard();

  if (isError) {
    return (
      <div className="space-y-8">
        <ErrorState message="Impossible de charger le tableau de bord." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <SkeletonLine width="40%" className="h-8" />
          <SkeletonLine width="30%" className="h-4" />
        </div>
        <SkeletonKpiRow />
        <SkeletonAppartements />
        <SkeletonActivity />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Bonjour,{' '}
          <span className="text-brand-600">
            {user?.name?.split(' ')[0]}
          </span>{' '}
          👋
        </h1>
        <p className="text-text-secondary mt-1">
          Voici un résumé de votre situation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="bg-white rounded-xl shadow-card p-6 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-muted font-medium">Montant dû ce mois</p>
            <span className="text-danger-light p-2 rounded-lg bg-danger-light/30">
              <AlertTriangle className="w-4 h-4 text-danger" />
            </span>
          </div>
          <p
            className={`text-2xl font-bold font-mono ${
              (dashboard?.montant_du_ce_mois ?? 0) > 0 ? 'text-danger' : 'text-success'
            }`}
          >
            {formatCurrency(dashboard?.montant_du_ce_mois ?? 0)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {(dashboard?.montant_du_ce_mois ?? 0) > 0
              ? 'À payer ce mois-ci'
              : 'Aucun montant dû ce mois'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-white rounded-xl shadow-card p-6 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-muted font-medium">Total impayés</p>
            <span className="bg-danger-light/30 p-2 rounded-lg">
              <CreditCard className="w-4 h-4 text-danger" />
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-danger">
            {formatCurrency(dashboard?.total_impayes ?? 0)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {dashboard?.nb_impayes ?? 0} cotisation
            {(dashboard?.nb_impayes ?? 0) > 1 ? 's' : ''} en retard
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="bg-white rounded-xl shadow-card p-6 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-muted font-medium">Dernier paiement</p>
            <span className="bg-brand-50 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-brand-600" />
            </span>
          </div>
          {dashboard?.dernier_paiement ? (
            <>
              <p className="text-2xl font-bold font-mono text-text-primary">
                {formatCurrency(dashboard.dernier_paiement.montant)}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Le {dashboard.dernier_paiement.date}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-text-muted">—</p>
              <p className="text-xs text-text-muted mt-1">Aucun paiement</p>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-white rounded-xl shadow-card p-6 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-muted font-medium">Réclamations en cours</p>
            <span className="bg-info-light/30 p-2 rounded-lg">
              <MessageSquare className="w-4 h-4 text-info" />
            </span>
          </div>
          <p className="text-2xl font-bold text-info">
            {dashboard?.reclamations_en_cours ?? 0}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {(dashboard?.reclamations_en_cours ?? 0) > 0
              ? 'En attente de réponse'
              : 'Aucune réclamation en cours'}
          </p>
        </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Mes Appartements
        </h2>
        {dashboard?.appartements && dashboard.appartements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.appartements.map((appart, i) => (
              <motion.div
                key={appart.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.2 }}
                className="bg-white rounded-xl shadow-card p-4 hover:shadow-card-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🚪</span>
                  <div>
                    <p className="font-semibold text-text-primary">
                      Appartement {appart.numero}
                    </p>
                    <p className="text-xs text-text-muted">
                      {appart.etage === 0 ? 'RDC' : `${appart.etage}${appart.etage === 1 ? 'er' : 'ème'} étage`}
                      {appart.immeuble ? ` · ${appart.immeuble.nom}` : ''}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-text-muted">
                  {appart.residence?.nom ?? ''}
                  {appart.residence?.ville ? `, ${appart.residence.ville}` : ''}
                </p>
                <p className="text-sm text-text-primary font-mono mt-1">
                  Tantième : {appart.tantieme}/1 000
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-card p-8 text-center text-text-muted">
            Aucun appartement assigné.
          </div>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <button
          onClick={() => navigate('/coproprietaires/cotisations')}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-card-md transition-all duration-200 text-left"
        >
          <span className="text-xl">💳</span>
          <span className="text-sm font-medium text-text-primary">Voir mes cotisations</span>
        </button>
        <button
          onClick={() => navigate('/coproprietaires/reclamations')}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-card-md transition-all duration-200 text-left"
        >
          <span className="text-xl">📢</span>
          <span className="text-sm font-medium text-text-primary">Nouvelle réclamation</span>
        </button>
        <button
          onClick={() => navigate('/coproprietaires/paiements')}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-card-md transition-all duration-200 text-left"
        >
          <span className="text-xl">📋</span>
          <span className="text-sm font-medium text-text-primary">Mes paiements</span>
        </button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Activité Récente
        </h2>
        {dashboard?.activite_recente && dashboard.activite_recente.length > 0 ? (
          <div className="bg-white rounded-xl shadow-card divide-y divide-surface-100">
            {dashboard.activite_recente.map((item, i) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.04, duration: 0.2 }}
                className="flex items-center gap-3 p-3"
              >
                <span className="text-lg">
                  {item.type === 'paiement' ? '💳' : '📢'}
                </span>
                <div className="flex-1">
                  {item.type === 'paiement' ? (
                    <p className="text-sm text-text-primary">
                      Paiement de{' '}
                      <span className="font-mono font-semibold">
                        {formatCurrency(item.montant!)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-text-primary">
                      Réclamation :{' '}
                      <span className="font-medium">{item.titre}</span>
                    </p>
                  )}
                  <p className="text-xs text-text-muted">
                    {item.type === 'paiement' ? item.date : formatDate(item.date)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-card p-8 text-center text-text-muted">
            Aucune activité récente.
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
