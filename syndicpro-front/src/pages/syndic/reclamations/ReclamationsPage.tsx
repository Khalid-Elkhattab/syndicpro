import { useState, useMemo, lazy, Suspense } from 'react';
import { motion } from '@/lib/motion';
import { Eye, Filter, X } from 'lucide-react';
import { useReclamationsResidence } from '@/hooks/useReclamations';
import { useResidenceStore } from '@/store/residenceStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ReclamationBadge, PrioriteBadge } from '@/components/reclamation/ReclamationBadge';

const preloadDetailModal = () => import('@/components/reclamation/ReclamationDetailModal');
const ReclamationDetailModal = lazy(() => preloadDetailModal().then(m => ({ default: m.ReclamationDetailModal })));
import { formatDate } from '@/utils/formatDate';
import { ErrorState } from '@/components/ui/ErrorState';

export default function ReclamationsPage() {
  const activeResidence = useResidenceStore((s) => s.activeResidence);
  const [filters, setFilters] = useState({
    statut: '',
    priorite: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [selectedReclamationId, setSelectedReclamationId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError, refetch } = useReclamationsResidence(
    activeResidence?.id ?? 0,
    { ...filters, page }
  );

  const reclamations = data?.data ?? [];

  const summary = useMemo(() => {
    return {
      nouveau: reclamations.filter((r) => r.statut === 'nouveau').length,
      enCours: reclamations.filter((r) => r.statut === 'en_cours').length,
      urgentes: reclamations.filter((r) => r.priorite === 'urgente' && r.statut !== 'traite' && r.statut !== 'rejete').length,
    };
  }, [reclamations]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ statut: '', priorite: '', search: '' });
  };

  const hasActiveFilters = filters.statut || filters.priorite || filters.search;

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState message="Impossible de charger les réclamations." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Réclamations</h1>
          {reclamations.length > 0 && (
            <p className="text-sm text-text-muted mt-1">
              {summary.nouveau > 0 && (
                <span className="text-info font-medium">{summary.nouveau} nouvelle{summary.nouveau > 1 ? 's' : ''} · </span>
              )}
              {summary.enCours > 0 && (
                <span className="text-warning font-medium">{summary.enCours} en cours · </span>
              )}
              {summary.urgentes > 0 && (
                <span className="text-danger font-medium">{summary.urgentes} urgente{summary.urgentes > 1 ? 's' : ''} non traitée{summary.urgentes > 1 ? 's' : ''}</span>
              )}
            </p>
          )}
        </div>
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
          Filtres
        </Button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg border border-surface-200 p-4 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">Tous</option>
                <option value="nouveau">Nouveau</option>
                <option value="en_cours">En cours</option>
                <option value="traite">Traité</option>
                <option value="rejete">Rejeté</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Priorité</label>
              <select
                value={filters.priorite}
                onChange={(e) => handleFilterChange('priorite', e.target.value)}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">Toutes</option>
                <option value="normale">Normale</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Recherche</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Titre, description, nom..."
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4" />
                Réinitialiser
              </Button>
            </div>
          )}
        </motion.div>
      )}

      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted">Chargement...</div>
        ) : reclamations.length === 0 ? (
          <EmptyState
            title="Aucune réclamation"
            description="Les réclamations des copropriétaires apparaîtront ici."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Copropriétaire
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Appartement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {reclamations.map((reclamation, index) => (
                  <motion.tr
                    key={reclamation.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                    className="hover:bg-surface-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {reclamation.coproprietaire?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {reclamation.appartement?.numero ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary max-w-xs truncate">
                      {reclamation.titre}
                    </td>
                    <td className="px-4 py-3">
                      <PrioriteBadge priorite={reclamation.priorite} label={reclamation.priorite_label} />
                    </td>
                    <td className="px-4 py-3">
                      <ReclamationBadge
                        statut={reclamation.statut}
                        label={reclamation.statut_label}
                        pulse={reclamation.statut === 'nouveau'}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {formatDate(reclamation.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { preloadDetailModal(); setSelectedReclamationId(reclamation.id); }}
                        aria-label="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data?.meta && data.meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.meta.last_page }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded text-sm ${
                i + 1 === data.meta.current_page
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <Suspense fallback={null}>
        <ReclamationDetailModal
          isOpen={!!selectedReclamationId}
          onClose={() => setSelectedReclamationId(null)}
          reclamationId={selectedReclamationId}
        />
      </Suspense>
    </div>
  );
}