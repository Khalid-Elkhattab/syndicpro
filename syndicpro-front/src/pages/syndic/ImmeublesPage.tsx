import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, Building } from 'lucide-react';
import { useResidences } from '@/hooks/useResidences';
import { useImmeubles, useCreateImmeuble, useUpdateImmeuble, useDeleteImmeuble } from '@/hooks/useImmeubles';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { immeubleSchema, type ImmeubleFormData } from '@/utils/schemas';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Immeuble, Residence } from '@/types/entities.types';

export default function ImmeublesPage() {
  const { data: residences } = useResidences();
  const { data: immeubles, isLoading, isError, refetch } = useImmeubles();
  const createMutation = useCreateImmeuble();
  const updateMutation = useUpdateImmeuble();
  const deleteMutation = useDeleteImmeuble();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Immeuble | null>(null);
  const [deleting, setDeleting] = useState<Immeuble | null>(null);
  const [filterResidence, setFilterResidence] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ImmeubleFormData>({
    resolver: zodResolver(immeubleSchema),
  });

  const filtered = filterResidence
    ? (immeubles ?? []).filter((i) => i.residence_id === filterResidence)
    : (immeubles ?? []);

  const openCreate = (residenceId?: number) => {
    setEditing(null);
    reset({ residence_id: residenceId ?? filterResidence ?? 0, nom: '' });
    setIsModalOpen(true);
  };

  const openEdit = (im: Immeuble) => {
    setEditing(im);
    reset({ residence_id: im.residence_id, nom: im.nom });
    setIsModalOpen(true);
  };

  const handleSave = async (payload: ImmeubleFormData) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, nom: payload.nom });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
    } catch {
      // Error handled in mutation
    }
    setIsDeleteOpen(false);
    setDeleting(null);
  };

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState message="Impossible de charger les immeubles." onRetry={refetch} />
      </div>
    );
  }

  const columns = [
    { key: 'nom', label: 'Immeuble', render: (row: Immeuble) => (
      <div className="flex items-center gap-2">
        <Building className="w-4 h-4 text-brand-500" />
        <span className="font-medium text-text-primary">{row.nom}</span>
      </div>
    )},
    { key: 'residence', label: 'Résidence', render: (row: Immeuble) => row.residence?.nom ?? '—' },
    { key: 'nb_appartements', label: 'Appartements', render: (row: Immeuble) => row.nb_appartements ?? 0 },
    {
      key: 'actions', label: '', width: 'w-20',
      render: (row: Immeuble) => (
        <div className="flex gap-1 justify-end">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-primary" aria-label="Modifier">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setDeleting(row); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger" aria-label="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Immeubles</h1>
          <p className="text-sm text-text-muted mt-1">Gérez les immeubles de vos résidences</p>
        </div>
        <button onClick={() => openCreate()} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Nouvel immeuble
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-text-secondary">Filtrer par résidence :</label>
        <select
          value={filterResidence ?? ''}
          onChange={(e) => setFilterResidence(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        >
          <option value="">Toutes</option>
          {residences?.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState type="create" title="Aucun immeuble" description="Ajoutez un immeuble à une résidence." action={{ label: 'Nouvel immeuble', onClick: () => openCreate() }} />
      ) : (
        <DataTable columns={columns} data={filtered} getRowKey={(row) => row.id} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editing ? 'Modifier l\'immeuble' : 'Nouvel immeuble'}
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Annuler</button>
            <button onClick={handleSubmit(handleSave)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
              {isSubmitting ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          {!editing && (
            <FormField label="Résidence" error={errors.residence_id?.message} required>
              <select {...register('residence_id', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value={0}>Sélectionner une résidence</option>
                {residences?.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
            </FormField>
          )}
          <FormField label="Nom de l'immeuble" error={errors.nom?.message} required>
            <input {...register('nom')} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Bâtiment A" />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog isOpen={isDeleteOpen} onConfirm={handleDelete} onCancel={() => { setIsDeleteOpen(false); setDeleting(null); }}
        title="Supprimer l'immeuble" message={`Voulez-vous vraiment supprimer "${deleting?.nom}" ?`} confirmLabel="Supprimer" isDestructive />
    </div>
  );
}