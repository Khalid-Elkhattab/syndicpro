import { useState, lazy, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from '@/lib/motion';
import { Plus, Edit2, ToggleLeft, Eye, Search } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useCoproprietaires, useCreateCoproprietaire, useUpdateCoproprietaire, useResetPassword, useToggleActif } from '@/hooks/useCoproprietaires';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

const preloadDrawer = () => import('@/components/coproprietaires/CoproprietairesDrawer');
const CoproprietairesDrawer = lazy(() => preloadDrawer().then(m => ({ default: m.CoproprietairesDrawer })));
import {
  coproprietaireSchema,
  resetPasswordSchema,
  type CoproprietaireFormData,
  type ResetPasswordFormData,
} from '@/utils/schemas';
import { ErrorState } from '@/components/ui/ErrorState';
import type { User } from '@/types/entities.types';

export default function CoproprietairesPage() {
  const { activeResidence } = useResidenceStore();
  const [search, setSearch] = useState('');
  const [filterActif, setFilterActif] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useCoproprietaires({
    search: search || undefined,
    residence_id: activeResidence?.id,
    is_active: filterActif,
    per_page: 20,
    page,
  });

  const createMutation = useCreateCoproprietaire();
  const updateMutation = useUpdateCoproprietaire();
  const resetPasswordMutation = useResetPassword();
  const toggleMutation = useToggleActif();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [drawerUser, setDrawerUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CoproprietaireFormData>({
    resolver: zodResolver(coproprietaireSchema),
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', email: '', phone: '', username: '', password: '', password_confirmation: '' });
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    reset({ name: user.name, email: user.email, phone: user.phone ?? '', username: user.username, password: '', password_confirmation: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (payload: CoproprietaireFormData) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        const { password: _pw, password_confirmation: _pw2, ...rest } = payload;
        await updateMutation.mutateAsync({ id: editing.id, ...rest });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (payload: ResetPasswordFormData) => {
    if (!resetTarget) return;
    await resetPasswordMutation.mutateAsync({ id: resetTarget.id, ...payload });
    setIsResetOpen(false);
    setResetTarget(null);
    resetForm.reset();
  };

  const handleToggle = async (user: User) => {
    await toggleMutation.mutateAsync(user.id);
  };

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState message="Impossible de charger les copropriétaires." onRetry={refetch} />
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Nom', render: (row: User) => <span className="font-medium text-text-primary">{row.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone', render: (row: User) => row.phone ?? '—' },
    {
      key: 'nb_appartements', label: 'Appartements',
      render: (row: User) => <span className="text-text-muted">{(row as unknown as Record<string, unknown>).nb_appartements as number ?? 0}</span>,
    },
    {
      key: 'is_active', label: 'Statut',
      render: (row: User) => <StatusBadge isActive={row.is_active} />,
    },
    {
      key: 'actions', label: '', width: 'w-24',
      render: (row: User) => (
        <div className="flex gap-1 justify-end">
          <button onClick={() => setDrawerUser(row)} onMouseEnter={preloadDrawer} className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-brand-600" aria-label="Voir détails">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-primary" aria-label="Modifier">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleToggle(row)} className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted" aria-label="Activer/Désactiver">
            <ToggleLeft className={`w-4 h-4 ${row.is_active ? 'text-success' : 'text-text-muted'}`} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Copropriétaires</h1>
          <p className="text-sm text-text-muted mt-1">Gérez les comptes copropriétaires</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Nouveau copropriétaire
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
        <select value={filterActif === undefined ? '' : filterActif.toString()} onChange={(e) => setFilterActif(e.target.value === '' ? undefined : e.target.value === 'true')}
          className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">Tous les statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Désactivés</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : !data?.data.length ? (
        <EmptyState type="create" title="Aucun copropriétaire" description="Ajoutez un copropriétaire." action={{ label: 'Nouveau copropriétaire', onClick: openCreate }} />
      ) : (
        <DataTable
          columns={columns}
          data={data.data}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setDrawerUser(row)}
          pagination={{
            page: data.meta.current_page,
            perPage: data.meta.per_page,
            total: data.meta.total,
            onPageChange: setPage,
          }}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editing ? 'Modifier le copropriétaire' : 'Nouveau copropriétaire'}
        size="lg"
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
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nom complet" error={errors.name?.message} required>
              <input {...register('name')} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
            <FormField label="Nom d'utilisateur" error={errors.username?.message} required>
              <input {...register('username')} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" error={errors.email?.message} required>
              <input type="email" {...register('email')} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
            <FormField label="Téléphone" error={errors.phone?.message}>
              <input {...register('phone')} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
          </div>
          {!editing && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Mot de passe" error={errors.password?.message} required>
                <input type="password" {...register('password')} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </FormField>
              <FormField label="Confirmer le mot de passe" error={errors.password_confirmation?.message} required>
                <input type="password" {...register('password_confirmation')} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </FormField>
            </div>
          )}
        </form>
      </Modal>

      <Modal isOpen={isResetOpen} onClose={() => { setIsResetOpen(false); setResetTarget(null); }} title="Réinitialiser le mot de passe"
        footer={
          <>
            <button onClick={() => setIsResetOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 rounded-lg">Annuler</button>
            <button onClick={resetForm.handleSubmit(handleResetPassword)} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Réinitialiser</button>
          </>
        }
      >
        <p className="text-sm text-text-secondary mb-4">Le nouveau mot de passe sera demandé au copropriétaire à sa prochaine connexion.</p>
        <FormField label="Nouveau mot de passe" error={resetForm.formState.errors.password?.message} required>
          <input type="password" {...resetForm.register('password')} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </FormField>
        <FormField label="Confirmer" error={resetForm.formState.errors.password_confirmation?.message} required>
          <input type="password" {...resetForm.register('password_confirmation')} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </FormField>
      </Modal>

      {drawerUser && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 z-50">
            <div className="absolute right-0 top-0 h-full w-[480px] bg-white p-6 flex items-center justify-center shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
            </div>
          </div>
        }>
          <CoproprietairesDrawer
            user={drawerUser}
            onClose={() => setDrawerUser(null)}
            onEdit={() => { setDrawerUser(null); openEdit(drawerUser); }}
            onResetPassword={() => { setResetTarget(drawerUser); setIsResetOpen(true); }}
          />
        </Suspense>
      )}
    </motion.div>
  );
}