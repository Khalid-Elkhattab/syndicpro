import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMesCotisations } from '@/hooks/useCotisations';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLine } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

type Tab = 'fixe' | 'exceptionnelle';

const statutBadge = (statut: string) => {
  switch (statut) {
    case 'paye':
      return { color: 'success' as const, label: 'Payé' };
    case 'partiellement_paye':
      return { color: 'warning' as const, label: 'Partiel' };
    case 'non_paye':
      return { color: 'danger' as const, label: 'Non payé' };
    default:
      return { color: 'gray' as const, label: statut };
  }
};

export default function MesCotisationsPage() {
  const [tab, setTab] = useState<Tab>('fixe');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: cotisations, isLoading, isError, refetch } = useMesCotisations();

  const fixes = useMemo(
    () => (cotisations ?? []).filter((c) => c.cotisation?.type === 'fixe'),
    [cotisations]
  );

  const exceptionnelles = useMemo(
    () => (cotisations ?? []).filter((c) => c.cotisation?.type === 'exceptionnelle'),
    [cotisations]
  );

  const currentData = tab === 'fixe' ? fixes : exceptionnelles;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SkeletonLine width="100px" className="h-10 rounded-full" />
          <SkeletonLine width="140px" className="h-10 rounded-full" />
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <SkeletonLine width="20%" className="h-5" />
              <SkeletonLine width="25%" className="h-5" />
              <SkeletonLine width="15%" className="h-5" />
              <SkeletonLine width="15%" className="h-5" />
              <SkeletonLine width="15%" className="h-5" />
              <SkeletonLine width="10%" className="h-5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <ErrorState message="Impossible de charger les cotisations." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Mes Cotisations</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('fixe')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            tab === 'fixe'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
          }`}
        >
          Cotisations Fixes
        </button>
        <button
          onClick={() => setTab('exceptionnelle')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            tab === 'exceptionnelle'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
          }`}
        >
          Cotisations Exceptionnelles
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {currentData.length === 0 ? (
            <EmptyState type="budget" title="Aucune cotisation" description={tab === 'fixe' ? "Le syndic n'a pas encore généré de cotisations fixes." : "Aucune cotisation exceptionnelle trouvée."} />
          ) : (
            <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-100">
                    {tab === 'fixe' ? (
                      <>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Cotisation
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Payé
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Restant
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-4 py-3 w-8" />
                      </>
                    ) : (
                      <>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Cotisation
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Montant Total
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Payé
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Restant
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-4 py-3 w-8" />
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {currentData.map((detail, i) => (
                    <motion.tr
                      key={detail.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className="hover:bg-surface-50 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === detail.id ? null : detail.id)
                      }
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-text-primary">
                          {detail.cotisation?.label ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-text-primary">
                        {formatCurrency(detail.montant)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatCurrency(detail.montant_paye)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatCurrency(detail.montant_restant)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          label={statutBadge(detail.statut).label}
                          color={statutBadge(detail.statut).color}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {detail.paiements && detail.paiements.length > 0 && (
                          expandedId === detail.id ? (
                            <ChevronUp className="w-4 h-4 text-text-muted inline" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-text-muted inline" />
                          )
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              <AnimatePresence>
                {expandedId && (
                  <motion.div
                    key={`expand-${expandedId}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {(() => {
                      const detail = currentData.find((d) => d.id === expandedId);
                      const paiements = detail?.paiements;
                      if (!paiements || paiements.length === 0) return null;
                      return (
                        <div className="bg-surface-50 px-4 py-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-text-muted">
                                <th className="text-left px-3 py-2 font-medium">Date</th>
                                <th className="text-right px-3 py-2 font-medium">Montant</th>
                                <th className="text-left px-3 py-2 font-medium">Mode</th>
                                <th className="text-left px-3 py-2 font-medium">Référence</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-200">
                              {paiements.map((p) => (
                                <tr key={p.id}>
                                  <td className="px-3 py-2 text-text-primary">
                                    {formatDate(p.date_paiement)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-semibold text-text-primary">
                                    {formatCurrency(p.montant)}
                                  </td>
                                  <td className="px-3 py-2 text-text-primary">
                                    {p.mode_paiement_label ?? p.mode_paiement}
                                  </td>
                                  <td className="px-3 py-2 text-text-muted">
                                    {p.reference ?? '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
