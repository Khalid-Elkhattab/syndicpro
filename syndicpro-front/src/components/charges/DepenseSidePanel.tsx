import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, Pencil, Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { Depense } from '@/types/entities.types';

interface DepenseSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  sousChargeNom: string;
  depenses: Depense[];
  isLoading?: boolean;
  onEdit?: (depense: Depense) => void;
  onDelete?: (depense: Depense) => void;
  onAdd?: () => void;
}

export function DepenseSidePanel({
  isOpen,
  onClose,
  sousChargeNom,
  depenses,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
}: DepenseSidePanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-lg z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Dépenses</h2>
                <p className="text-sm text-text-secondary mt-0.5">{sousChargeNom}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-surface-100 bg-surface-50">
              <button
                onClick={onAdd}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter une dépense
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-surface-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : depenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <p className="text-text-muted text-sm">Aucune dépense pour cette sous-charge.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {depenses.map((dep) => (
                    <motion.div
                      key={dep.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-surface-50 rounded-lg p-4 border border-surface-100 hover:border-brand-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-text-secondary">
                              {formatDate(dep.date)}
                            </span>
                            {dep.has_justificatif && (
                              <a
                                href={dep.justificatif_url ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 rounded text-brand-600 hover:bg-brand-50"
                                title="Voir le justificatif"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-text-primary font-medium truncate">{dep.description}</p>
                          <p className="text-sm font-mono font-semibold text-text-primary mt-1">
                            {formatCurrency(dep.montant)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(dep)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(dep)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}