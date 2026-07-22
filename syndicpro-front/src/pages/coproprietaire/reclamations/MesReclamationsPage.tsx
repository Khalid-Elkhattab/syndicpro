import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Plus, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useMesReclamations } from '@/hooks/useReclamations';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReclamationBadge, PrioriteBadge } from '@/components/reclamation/ReclamationBadge';
import { formatDate } from '@/utils/formatDate';

const preloadForm = () => import('@/components/reclamation/NouvelleReclamationForm');
const NouvelleReclamationForm = lazy(() => preloadForm().then(m => ({ default: m.NouvelleReclamationForm })));
import { ErrorState } from '@/components/ui/ErrorState';

export function MesReclamationsPage() {
  const { data: reclamations, isLoading, isError, refetch } = useMesReclamations();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const handleToggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <ErrorState message="Impossible de charger les réclamations." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mes Réclamations</h1>
          <p className="text-sm text-text-muted mt-1">
            {reclamations?.length ?? 0} réclamation{reclamations && reclamations.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => { preloadForm(); setShowNewForm(true); }}>
          <Plus className="w-4 h-4" />
          Nouvelle réclamation
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted">Chargement...</div>
        ) : !reclamations || reclamations.length === 0 ? (
          <EmptyState
            title="Aucune réclamation"
            description="Vous n'avez soumis aucune réclamation pour le moment."
            action={
              {
                label: 'Faire une réclamation',
                onClick: () => setShowNewForm(true),
              }
            }
          />
        ) : (
          <div className="divide-y divide-surface-100">
            {reclamations.map((reclamation, index) => (
              <motion.div
                key={reclamation.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2 }}
              >
                <div
                  className="px-4 py-3 hover:bg-surface-50 transition-colors cursor-pointer"
                  onClick={() => handleToggleExpand(reclamation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-text-secondary min-w-[100px]">
                        {formatDate(reclamation.created_at)}
                      </span>
                      <span className="text-sm font-medium text-text-primary max-w-[200px] truncate">
                        {reclamation.titre}
                      </span>
                      <span className="text-sm text-text-muted">
                        {reclamation.appartement?.numero ?? '—'}
                      </span>
                      <PrioriteBadge priorite={reclamation.priorite} label={reclamation.priorite_label} />
                      <ReclamationBadge statut={reclamation.statut} label={reclamation.statut_label} />
                    </div>
                    <div className="flex items-center gap-2">
                      {reclamation.reponse_syndic && (
                        <span className="text-xs text-success flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Réponse
                        </span>
                      )}
                      {expandedId === reclamation.id ? (
                        <ChevronUp className="w-4 h-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === reclamation.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 bg-surface-50">
                        <div>
                          <h4 className="text-sm font-medium text-text-secondary mb-1">Description</h4>
                          <p className="text-sm text-text-primary whitespace-pre-wrap">
                            {reclamation.description}
                          </p>
                        </div>

                        {reclamation.reponse_syndic ? (
                          <div>
                            <h4 className="text-sm font-medium text-text-secondary mb-1">
                              Réponse du syndic {reclamation.date_reponse && `— ${formatDate(reclamation.date_reponse)}`}
                            </h4>
                            <div className="bg-success-light rounded-lg p-4">
                              <p className="text-sm text-text-primary whitespace-pre-wrap">
                                {reclamation.reponse_syndic}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <MessageSquare className="w-4 h-4" />
                            En attente de réponse du syndic
                          </div>
                        )}

                        <div className="pt-2 border-t border-surface-200">
                          <h4 className="text-sm font-medium text-text-secondary mb-2">Historique du statut</h4>
                          <div className="flex items-center gap-4 text-xs">
                            <span className={`flex items-center gap-1 ${reclamation.statut === 'nouveau' ? 'text-info' : 'text-text-muted'}`}>
                              <span className="w-2 h-2 rounded-full bg-info" />
                              Nouveau
                            </span>
                            <span className="text-text-muted">→</span>
                            <span className={`flex items-center gap-1 ${reclamation.statut === 'en_cours' ? 'text-warning' : 'text-text-muted'}`}>
                              <span className={`w-2 h-2 rounded-full ${reclamation.statut === 'en_cours' ? 'bg-warning' : 'bg-surface-300'}`} />
                              En cours
                            </span>
                            <span className="text-text-muted">→</span>
                            <span className={`flex items-center gap-1 ${reclamation.statut === 'traite' ? 'text-success' : 'text-text-muted'}`}>
                              <span className={`w-2 h-2 rounded-full ${reclamation.statut === 'traite' ? 'bg-success' : 'bg-surface-300'}`} />
                              Traité
                            </span>
                            <span className="text-text-muted">ou</span>
                            <span className={`flex items-center gap-1 ${reclamation.statut === 'rejete' ? 'text-text-secondary' : 'text-text-muted'}`}>
                              <span className={`w-2 h-2 rounded-full ${reclamation.statut === 'rejete' ? 'bg-surface-400' : 'bg-surface-300'}`} />
                              Rejeté
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <NouvelleReclamationForm
          isOpen={showNewForm}
          onClose={() => setShowNewForm(false)}
          onSuccess={() => {}}
        />
      </Suspense>
    </div>
  );
}