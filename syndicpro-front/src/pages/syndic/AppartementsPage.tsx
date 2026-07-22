import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, UserPlus, DoorOpen } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useResidences } from '@/hooks/useResidences';
import { useImmeubles } from '@/hooks/useImmeubles';
import { useAppartements, useCreateAppartement, useUpdateAppartement, useAssignerAppartement, useDeleteAppartement } from '@/hooks/useAppartements';
import { useCoproprietaires } from '@/hooks/useCoproprietaires';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { appartementSchema, type AppartementFormData } from '@/utils/schemas';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Appartement } from '@/types/entities.types';

export default function AppartementsPage() {
  const { activeResidence } = useResidenceStore();
  const residenceId = activeResidence?.id;
  const { data: residencesList } = useResidences();
  const [filterImmeuble, setFilterImmeuble] = useState<number | undefined>();

  const { data: allImmeubles } = useImmeubles(residenceId ?? 0);
  const { data: coproprietaires } = useCoproprietaires();

  const { data: appartements, isLoading, isError, refetch } = useAppartements(
    residenceId,
    { ...(filterImmeuble ? { immeuble_id: filterImmeuble } : {}) }
  );
  const createMutation = useCreateAppartement();
  const updateMutation = useUpdateAppartement();
  const assignerMutation = useAssignerAppartement();
  const deleteMutation = useDeleteAppartement();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignerOpen, setIsAssignerOpen] = useState(false);
  const [editing, setEditing] = useState<Appartement | null>(null);
  const [deleting, setDeleting] = useState<Appartement | null>(null);
  const [assignerTarget, setAssignerTarget] = useState<Appartement | null>(null);
  const [assignerId, setAssignerId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AppartementFormData>({
    resolver: zodResolver(appartementSchema),
  });

  const selectedResidenceId = watch('residence_id');
  const filteredImmeubles = selectedResidenceId
    ? (allImmeubles ?? []).filter((i) => i.residence_id === selectedResidenceId)
    : [];

  const defaultResidenceId = residenceId ?? 0;
  const openCreate = () => {
    setEditing(null);
    reset({
      residence_id: defaultResidenceId,
      immeuble_id: 0,
      numero: '',
      etage: 0,
      tantieme: 0,
    });
    setIsModalOpen(true);
  };

  const openEdit = (app: Appartement) => {
    setEditing(app);
    reset({
      residence_id: app.residence_id,
      immeuble_id: app.immeuble_id,
      numero: app.numero,
      etage: app.etage,
      tantieme: app.tantieme,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (payload: AppartementFormData) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, numero: payload.numero, etage: payload.etage, tantieme: payload.tantieme });
      } else {
        await createMutation.mutateAsync({ ...payload, coproprietaire_id: payload.coproprietaire_id ?? undefined });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssigner = async () => {
    if (!assignerTarget) return;
    await assignerMutation.mutateAsync({ id: assignerTarget.id, coproprietaireId: assignerId });
    setIsAssignerOpen(false);
    setAssignerTarget(null);
    setAssignerId(null);
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
        <ErrorState message="Impossible de charger les appartements." onRetry={refetch} />
      </div>
    );
  }

  const columns = [
    { key: 'numero', label: 'N°', render: (row: Appartement) => (
      <div className="flex items-center gap-2">
        <DoorOpen className="w-4 h-4 text-brand-400" />
        <span className="font-medium text-text-primary">{row.numero}</span>
      </div>
    )},
    { key: 'etage', label: 'Étage', render: (row: Appartement) => `${row.etage === 0 ? 'RDC' : row.etage + 'ème'}` },
    { key: 'immeuble', label: 'Immeuble', render: (row: Appartement) => row.immeuble?.nom ?? '—' },
    { key: 'residence', label: 'Résidence', render: (row: Appartement) => row.residence?.nom ?? '—' },
    { key: 'tantieme', label: 'Tantième', render: (row: Appartement) => `${row.tantieme}/1 000` },
    {
      key: 'coproprietaire', label: 'Copropriétaire',
      render: (row: Appartement) => row.coproprietaire ? (
        <span className="text-text-primary">{row.coproprietaire.name}</span>
      ) : (
        <span className="text-text-muted italic">Non assigné</span>
      ),
    },
    {
      key: 'actions', label: '', width: 'w-24',
      render: (row: Appartement) => (
        <div className="flex gap-1 justify-end">
          {!row.coproprietaire && (
            <button onClick={() => { setAssignerTarget(row); setIsAssignerOpen(true); }}
              className="p-1.5 rounded-lg hover:bg-success-light text-text-muted hover:text-success" aria-label="Assigner">
              <UserPlus className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-primary" aria-label="Modifier">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { setDeleting(row); setIsDeleteOpen(true); }}
            className="p-1.5 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger" aria-label="Supprimer">
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
          <h1 className="text-2xl font-bold text-text-primary">Appartements</h1>
          <p className="text-sm text-text-muted mt-1">Gérez les appartements de vos immeubles</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Nouvel appartement
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <select value={filterImmeuble ?? ''} onChange={(e) => setFilterImmeuble(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">Tous immeubles</option>
          {(allImmeubles ?? []).filter((i) => !residenceId || i.residence_id === residenceId).map((i) => <option key={i.id} value={i.id}>{i.nom}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : !appartements?.length ? (
        <EmptyState type="create" title="Aucun appartement" description="Ajoutez un appartement à un immeuble." action={{ label: 'Nouvel appartement', onClick: openCreate }} />
      ) : (
        <DataTable columns={columns} data={appartements} getRowKey={(row) => row.id} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editing ? 'Modifier l\'appartement' : 'Nouvel appartement'}
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
          <FormField label="Résidence" error={errors.residence_id?.message} required>
            <select {...register('residence_id', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
              <option value={0}>Sélectionner</option>
              {residencesList?.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
            </select>
          </FormField>
          <FormField label="Immeuble" error={errors.immeuble_id?.message} required>
            <select {...register('immeuble_id', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
              <option value={0}>Sélectionner</option>
              {filteredImmeubles.map((i) => <option key={i.id} value={i.id}>{i.nom}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Numéro" error={errors.numero?.message} required>
              <input {...register('numero')} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="01" />
            </FormField>
            <FormField label="Étage" error={errors.etage?.message} required>
              <input type="number" {...register('etage', { valueAsNumber: true })} min={0} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="0" />
            </FormField>
          </div>
          <FormField label="Tantième" error={errors.tantieme?.message} required hint="Part proportionnelle (ex: 120 pour 120/1000)">
            <input type="number" step="0.0001" {...register('tantieme', { valueAsNumber: true })} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono" placeholder="120" />
          </FormField>
        </form>
      </Modal>

      <Modal isOpen={isAssignerOpen} onClose={() => { setIsAssignerOpen(false); setAssignerTarget(null); }} title="Assigner un copropriétaire"
        size="sm"
        footer={
          <>
            <button onClick={() => setIsAssignerOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 rounded-lg">Annuler</button>
            <button onClick={handleAssigner} disabled={!assignerId} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
              Assigner
            </button>
          </>
        }
      >
        <FormField label="Copropriétaire" required>
          <select value={assignerId ?? ''} onChange={(e) => setAssignerId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="">Sélectionner un copropriétaire</option>
            {coproprietaires?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
      </Modal>

      <ConfirmDialog isOpen={isDeleteOpen} onConfirm={handleDelete} onCancel={() => { setIsDeleteOpen(false); setDeleting(null); }}
        title="Supprimer l'appartement" message={`Supprimer l'appartement ${deleting?.numero} ?`} confirmLabel="Supprimer" isDestructive />
    </div>
  );
}