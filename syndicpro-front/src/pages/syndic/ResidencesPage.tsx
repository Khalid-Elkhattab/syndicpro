import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from '@/lib/motion';
import { Plus, Edit2, Trash2, Building2, MapPin, Upload } from 'lucide-react';
import { useResidences, useCreateResidence, useUpdateResidence, useDeleteResidence } from '@/hooks/useResidences';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { residenceSchema, type ResidenceFormData } from '@/utils/schemas';
import { ErrorState } from '@/components/ui/ErrorState';
import { LotsImportWizard } from '@/components/syndic/LotsImportWizard';
import type { Residence } from '@/types/entities.types';

export default function ResidencesPage() {
  const { data: residences, isLoading, isError, refetch } = useResidences();
  const createMutation = useCreateResidence();
  const updateMutation = useUpdateResidence();
  const deleteMutation = useDeleteResidence();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Residence | null>(null);
  const [deleting, setDeleting] = useState<Residence | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResidenceFormData>({
    resolver: zodResolver(residenceSchema),
  });

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    reset({ nom: '', ville: '', adresse: '' });
    setIsModalOpen(true);
  };

  const openEdit = (res: Residence) => {
    setEditing(res);
    setServerError(null);
    reset({ nom: res.nom, ville: res.ville, adresse: res.adresse });
    setIsModalOpen(true);
  };

  const handleSave = async (payload: ResidenceFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
      reset();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message?: string } } }).response?.data?.message
          : 'Une erreur est survenue. Veuillez réessayer.';
      setServerError(message ?? 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.id);
    setIsDeleteOpen(false);
    setDeleting(null);
  };

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState message="Impossible de charger les résidences." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Résidences</h1>
          <p className="text-sm text-text-muted mt-1">Gérez vos résidences et bâtiments</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-100 text-text-primary text-sm font-medium rounded-lg hover:bg-surface-200 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importer CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle résidence
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-surface-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !residences?.length ? (
        <EmptyState
          type="create"
          title="Aucune résidence"
          description="Commencez par créer votre première résidence."
          action={{ label: 'Nouvelle résidence', onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {residences.map((res, i) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl shadow-card p-6 hover:shadow-card-md transition-shadow cursor-pointer group"
              onClick={() => openEdit(res)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{res.nom}</h3>
                    <div className="flex items-center gap-1 text-sm text-text-muted mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {res.ville}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEdit(res)}
                    className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-primary"
                    aria-label="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setDeleting(res); setIsDeleteOpen(true); }}
                    className="p-1.5 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-4">{res.adresse}</p>
              <div className="flex items-center gap-4 text-xs text-text-muted pt-4 border-t border-surface-100">
                <span>{res.nb_immeubles ?? res.immeubles?.length ?? 0} immeuble{(res.nb_immeubles ?? res.immeubles?.length ?? 0) !== 1 ? 's' : ''}</span>
                <span>{res.nb_appartements ?? 0} appartement{(res.nb_appartements ?? 0) !== 1 ? 's' : ''}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setServerError(null); }}
        title={editing ? 'Modifier la résidence' : 'Nouvelle résidence'}
        footer={
          <>
            <button
              onClick={() => { setIsModalOpen(false); setServerError(null); }}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit(handleSave)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          {serverError && (
            <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">
              {serverError}
            </div>
          )}
          <FormField label="Nom de la résidence" error={errors.nom?.message} required>
            <input
              {...register('nom')}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
              placeholder="Résidence Maarif"
            />
          </FormField>
          <FormField label="Ville" error={errors.ville?.message} required>
            <input
              {...register('ville')}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
              placeholder="Casablanca"
            />
          </FormField>
          <FormField label="Adresse" error={errors.adresse?.message} required>
            <textarea
              {...register('adresse')}
              rows={3}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm resize-none"
              placeholder="Rue Maarif, Quartier Maarif, Casablanca"
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onConfirm={handleDelete}
        onCancel={() => { setIsDeleteOpen(false); setDeleting(null); }}
        title="Supprimer la résidence"
        message={`Voulez-vous vraiment supprimer "${deleting?.nom}" ? Cette action supprimera également tous les immeubles et appartements associés.`}
        confirmLabel="Supprimer"
        isDestructive
      />
      {isImportOpen && (
        <LotsImportWizard
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          residences={residences ?? []}
        />
      )}
    </div>
  );
}