import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { formatDate } from '@/utils/formatDate';
import { useUIStore } from '@/store/uiStore';
import { useReclamation, useUpdateStatut } from '@/hooks/useReclamations';
import { ReclamationBadge, PrioriteBadge } from './ReclamationBadge';
import { Button } from '@/components/ui/Button';

const updateStatutSchema = z.object({
  statut: z.enum(['en_cours', 'traite', 'rejete']),
  reponse_syndic: z.string().max(2000).optional(),
});

type UpdateStatutForm = z.infer<typeof updateStatutSchema>;

interface ReclamationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reclamationId: number | null;
}

export function ReclamationDetailModal({
  isOpen,
  onClose,
  reclamationId,
}: ReclamationDetailModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { addToast } = useUIStore();
  const { data: reclamation, isLoading } = useReclamation(reclamationId ?? 0);
  const updateStatut = useUpdateStatut();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateStatutForm>({
    resolver: zodResolver(updateStatutSchema),
    defaultValues: {
      statut: 'en_cours',
      reponse_syndic: '',
    },
  });

  const selectedStatut = watch('statut');
  const isStatutClosed = selectedStatut === 'traite' || selectedStatut === 'rejete';

  useEffect(() => {
    if (reclamation) {
      reset({
        statut: reclamation.statut === 'nouveau' ? 'en_cours' : reclamation.statut,
        reponse_syndic: reclamation.reponse_syndic ?? '',
      });
    }
  }, [reclamation, reset]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleSave = (data: UpdateStatutForm) => {
    if (!reclamationId) return;

    updateStatut.mutate(
      { id: reclamationId, params: data },
      {
        onSuccess: () => {
          addToast('success', 'Statut mis à jour. Le copropriétaire a été notifié.');
          handleClose();
        },
        onError: () => {
          addToast('error', 'Erreur lors de la mise à jour du statut.');
        },
      }
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, y: 40, scale: 0.95 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-modal max-h-[90vh] flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {isLoading || !reclamation ? (
              <div className="p-8 text-center text-text-muted">Chargement...</div>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-text-primary">{reclamation.titre}</h2>
                    <ReclamationBadge statut={reclamation.statut} label={reclamation.statut_label} />
                    <PrioriteBadge priorite={reclamation.priorite} label={reclamation.priorite_label} />
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="bg-surface-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-text-muted">Copropriétaire :</span>
                      <span className="font-medium text-text-primary">
                        {reclamation.coproprietaire?.name ?? '—'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-text-muted">Appartement :</span>
                      <span className="font-medium text-text-primary">
                        {reclamation.appartement?.numero ?? '—'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-text-muted">Date :</span>
                      <span className="font-medium text-text-primary">{reclamation.created_at ? formatDate(reclamation.created_at) : '—'}</span>
                    </div>
                    {reclamation.anciennete_jours !== undefined && (
                      <div className="flex gap-2">
                        <span className="text-text-muted">Ancienneté :</span>
                        <span className="font-medium text-text-primary">
                          {reclamation.anciennete_jours} jour{reclamation.anciennete_jours > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Description</h3>
                    <div className="bg-surface-50 rounded-lg p-4 text-sm text-text-primary whitespace-pre-wrap">
                      {reclamation.description}
                    </div>
                  </div>

                  {reclamation.reponse_syndic && (
                    <div>
                      <h3 className="text-sm font-medium text-text-secondary mb-2">Réponse du syndic</h3>
                      <div className="bg-success-light rounded-lg p-4 text-sm text-text-primary whitespace-pre-wrap">
                        <p className="text-text-muted text-xs mb-1">
                          Répondu le {reclamation.date_reponse ? formatDate(reclamation.date_reponse) : '—'}
                        </p>
                        {reclamation.reponse_syndic}
                      </div>
                    </div>
                  )}

                  {reclamation.statut !== 'traite' && reclamation.statut !== 'rejete' && (
                    <form onSubmit={handleSubmit(handleSave)} className="space-y-4 pt-4 border-t border-surface-200">
                      <h3 className="text-sm font-medium text-text-secondary">Mettre à jour le statut</h3>

                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="en_cours"
                            {...register('statut')}
                            className="text-brand-600 focus:ring-brand-500"
                          />
                          <span className="text-sm text-text-primary">En cours</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="traite"
                            {...register('statut')}
                            className="text-brand-600 focus:ring-brand-500"
                          />
                          <span className="text-sm text-text-primary">Traité</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="rejete"
                            {...register('statut')}
                            className="text-brand-600 focus:ring-brand-500"
                          />
                          <span className="text-sm text-text-primary">Rejeté</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Réponse au copropriétaire (optionnel)
                        </label>
                        <textarea
                          {...register('reponse_syndic')}
                          rows={4}
                          className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-none"
                          placeholder="Votre réponse au copropriétaire..."
                        />
                        {errors.reponse_syndic && (
                          <p className="text-xs text-danger mt-1">{errors.reponse_syndic.message}</p>
                        )}
                        {selectedStatut === 'rejete' && !watch('reponse_syndic') && (
                          <div className="flex items-center gap-1 text-xs text-warning-dark mt-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Il est recommandé de fournir une explication pour les réclamations rejetées.</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={handleClose}>
                          Fermer
                        </Button>
                        <Button
                          type="submit"
                          isLoading={updateStatut.isPending}
                        >
                          Sauvegarder
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}