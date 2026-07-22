import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { FileText, Hourglass, RotateCcw } from 'lucide-react';
import { useMesPaiements, useRecuUrlMine } from '@/hooks/usePaiements';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { SkeletonLine } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

function RecuButton({ paiementId, hasRecu }: { paiementId: number; hasRecu: boolean }) {
  const { data: recuUrl } = useRecuUrlMine(hasRecu ? paiementId : null);

  if (!hasRecu) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-text-muted cursor-default"
        title="En cours de génération"
      >
        <Hourglass className="w-3.5 h-3.5" />
        En cours
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (recuUrl) {
          window.open(recuUrl, '_blank');
        }
      }}
      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors"
      title="Télécharger le reçu"
    >
      <FileText className="w-3.5 h-3.5" />
      Reçu
    </button>
  );
}

export default function MesPaiementsPage() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const filters = useMemo(
    () => ({
      ...(dateDebut ? { date_debut: dateDebut } : {}),
      ...(dateFin ? { date_fin: dateFin } : {}),
    }),
    [dateDebut, dateFin]
  );

  const { data: result, isLoading, isError, refetch } = useMesPaiements(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  const paiements = result?.data ?? [];
  const totalPaye = useMemo(
    () => paiements.reduce((sum, p) => sum + p.montant, 0),
    [paiements]
  );

  const handleReset = () => {
    setDateDebut('');
    setDateFin('');
  };

  const hasFilters = dateDebut || dateFin;

  if (isError) {
    return (
      <div className="space-y-6">
        <ErrorState message="Impossible de charger les paiements." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Mes Paiements</h1>

      <div className="bg-white rounded-xl border border-surface-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Date début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Date fin
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>
          {hasFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <SkeletonLine width="15%" className="h-5" />
              <SkeletonLine width="25%" className="h-5" />
              <SkeletonLine width="15%" className="h-5" />
              <SkeletonLine width="15%" className="h-5" />
              <SkeletonLine width="15%" className="h-5" />
              <SkeletonLine width="10%" className="h-5" />
            </div>
          ))}
        </div>
      ) : paiements.length === 0 ? (
        <EmptyState type="payment" title="Aucun paiement" description={hasFilters ? 'Aucun paiement trouvé pour cette période.' : 'Votre historique de paiements apparaîtra ici.'} />
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Cotisation
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Montant
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Mode
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Référence
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Reçu
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              <AnimatePresence>
                {paiements.map((paiement, i) => (
                  <motion.tr
                    key={paiement.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="hover:bg-surface-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-text-primary">
                      {formatDate(paiement.date_paiement)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary">
                        {paiement.cotisation_detail?.cotisation?.label
                          ?? paiement.cotisation_detail?.cotisation?.label
                          ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-text-primary">
                      {formatCurrency(paiement.montant)}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {paiement.mode_paiement_label ?? paiement.mode_paiement}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {paiement.reference ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <RecuButton
                        paiementId={paiement.id}
                        hasRecu={paiement.has_recu}
                      />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          <div className="px-4 py-3 bg-surface-50 border-t border-surface-200 flex items-center justify-between">
            <span className="text-sm text-text-muted">
              {paiements.length} paiement{paiements.length > 1 ? 's' : ''}
            </span>
            <span className="text-sm font-semibold text-text-primary">
              Total payé :{' '}
              <span className="font-mono">{formatCurrency(totalPaye)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
