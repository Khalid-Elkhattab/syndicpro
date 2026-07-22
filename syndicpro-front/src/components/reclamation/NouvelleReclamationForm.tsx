import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useMyAppartements } from '@/hooks/useAppartements';
import { useUIStore } from '@/store/uiStore';
import { useCreateReclamation } from '@/hooks/useReclamations';

const reclamationSchema = z.object({
  appartement_id: z.number({ message: 'L\'appartement est obligatoire.' }),
  titre: z.string().min(1, 'Le titre est obligatoire.').max(200, 'Le titre ne doit pas dépasser 200 caractères.'),
  description: z.string().min(1, 'La description est obligatoire.').max(2000, 'La description ne doit pas dépasser 2000 caractères.'),
  priorite: z.enum(['normale', 'urgente']),
});

type ReclamationForm = z.infer<typeof reclamationSchema>;

interface NouvelleReclamationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NouvelleReclamationForm({ isOpen, onClose, onSuccess }: NouvelleReclamationFormProps) {
  const { addToast } = useUIStore();
  const { data: appartements } = useMyAppartements();
  const createReclamation = useCreateReclamation();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReclamationForm>({
    resolver: zodResolver(reclamationSchema),
    defaultValues: {
      priorite: 'normale',
    },
  });

  const description = watch('description') ?? '';

  const onSubmit = (data: ReclamationForm) => {
    createReclamation.mutate(data, {
      onSuccess: () => {
        addToast('success', 'Réclamation soumise. Le syndic a été notifié.');
        reset();
        onClose();
        onSuccess?.();
      },
      onError: () => {
        addToast('error', 'Erreur lors de la soumission de la réclamation.');
      },
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nouvelle réclamation"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="reclamation-form"
            isLoading={createReclamation.isPending}
          >
            Soumettre
          </Button>
        </>
      }
    >
      <form id="reclamation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Appartement <span className="text-danger">*</span>
          </label>
          {appartements && appartements.length === 1 ? (
            <div className="px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm">
              <span className="font-medium">{appartements[0].numero}</span>
              {appartements[0].immeuble && (
                <span className="text-text-muted"> — {appartements[0].immeuble.nom}</span>
              )}
              {appartements[0].residence && (
                <span className="text-text-muted">, {appartements[0].residence.nom}</span>
              )}
              <input type="hidden" {...register('appartement_id', { valueAsNumber: true })} />
              <input type="hidden" value={appartements[0].id} />
            </div>
          ) : (
            <select
              {...register('appartement_id', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            >
              <option value="">Sélectionnez un appartement</option>
              {appartements?.map((appart) => (
                <option key={appart.id} value={appart.id}>
                  {appart.numero}
                  {appart.immeuble ? ` — ${appart.immeuble.nom}` : ''}
                  {appart.residence ? `, ${appart.residence.nom}` : ''}
                </option>
              ))}
            </select>
          )}
          {errors.appartement_id && (
            <p className="text-xs text-danger mt-1">{errors.appartement_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Titre <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            {...register('titre')}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            placeholder="Titre court de la réclamation"
          />
          {errors.titre && (
            <p className="text-xs text-danger mt-1">{errors.titre.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Description <span className="text-danger">*</span>
          </label>
          <textarea
            {...register('description')}
            rows={5}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-none"
            placeholder="Décrivez votre réclamation en détail..."
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description && (
              <p className="text-xs text-danger">{errors.description.message}</p>
            )}
            <span className="text-xs text-text-muted ml-auto">
              {description.length}/2000
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Priorité <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                watch('priorite') === 'normale'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-surface-200 hover:border-surface-300'
              }`}
            >
              <input
                type="radio"
                value="normale"
                {...register('priorite')}
                className="sr-only"
              />
              <span className="text-sm font-medium text-text-primary mb-1">Normale</span>
              <span className="text-xs text-text-muted">Pour les sujets non urgents</span>
            </label>
            <label
              className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                watch('priorite') === 'urgente'
                  ? 'border-danger bg-danger-light'
                  : 'border-surface-200 hover:border-surface-300'
              }`}
            >
              <input
                type="radio"
                value="urgente"
                {...register('priorite')}
                className="sr-only"
              />
              <span className="text-sm font-medium text-danger-dark mb-1">Urgente</span>
              <span className="text-xs text-text-muted">⚠️ Nécessite une action rapide</span>
            </label>
          </div>
          {errors.priorite && (
            <p className="text-xs text-danger mt-1">{errors.priorite.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}