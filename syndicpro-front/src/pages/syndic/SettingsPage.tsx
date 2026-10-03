import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Plus, Edit2, Trash2, ToggleLeft, Upload, Download, Check } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useResidences } from '@/hooks/useResidences';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { SETTING_LABELS } from '@/api/settings.api';
import {
  useDocumentTypes, useCreateDocumentType, useUpdateDocumentType, useDeleteDocumentType,
  useResidenceDocuments, useUploadDocument, useDeleteDocument,
} from '@/hooks/useDocuments';
import {
  useStaff, useStaffPermissions, useCreateStaff, useUpdateStaff, useToggleStaff, useDeleteStaff,
} from '@/hooks/useStaff';
import type { StaffMember } from '@/api/staff.api';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { documentsApi } from '@/api/documents.api';

type Tab = 'general' | 'doctypes' | 'documents' | 'staff';

const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: 'Généraux' },
  { key: 'doctypes', label: 'Types de documents' },
  { key: 'documents', label: 'Documents' },
  { key: 'staff', label: 'Assistants' },
];

const ACTION_LABELS: Record<string, string> = {
  view: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer',
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Paramètres</h1>
        <p className="text-sm text-text-muted mt-1">Réglages, documents et comptes assistants</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-surface-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab />}
      {tab === 'doctypes' && <DocTypesTab />}
      {tab === 'documents' && <DocumentsTab />}
      {tab === 'staff' && <StaffTab />}
    </motion.div>
  );
}

/* ---------------------------------- Généraux ---------------------------------- */

function GeneralTab() {
  const { data: settings, isLoading, isError, refetch } = useSettings();
  const updateMutation = useUpdateSettings();
  const [values, setValues] = useState<Record<string, number> | null>(null);
  const [saved, setSaved] = useState(false);

  if (isError) {
    return <ErrorState message="Impossible de charger les réglages." onRetry={refetch} />;
  }
  if (isLoading || !settings) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-surface-100 rounded-lg animate-pulse" />)}</div>;
  }

  const current: Record<string, number> = values ?? Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const handleSave = async () => {
    await updateMutation.mutateAsync(current);
    setValues(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-4">
      {settings.map((s) => {
        const meta = SETTING_LABELS[s.key] ?? { label: s.key, hint: '', unit: '' };
        return (
          <div key={s.key} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-card">
            <div className="flex-1">
              <div className="font-medium text-text-primary text-sm">{meta.label}</div>
              {meta.hint && <div className="text-xs text-text-muted mt-0.5">{meta.hint}</div>}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={current[s.key] ?? s.value}
                onChange={(e) => setValues({ ...current, [s.key]: Number(e.target.value) })}
                className="w-24 px-3 py-1.5 border border-surface-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <span className="text-xs text-text-muted w-12">{meta.unit}</span>
            </div>
          </div>
        );
      })}
      <button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50"
      >
        {saved ? <Check className="w-4 h-4" /> : null}
        {updateMutation.isPending ? 'Enregistrement...' : saved ? 'Enregistré' : 'Enregistrer'}
      </button>
    </div>
  );
}

/* ------------------------------- Types de documents ------------------------------- */

function DocTypesTab() {
  const { data: types, isLoading, isError, refetch } = useDocumentTypes();
  const createMutation = useCreateDocumentType();
  const updateMutation = useUpdateDocumentType();
  const deleteMutation = useDeleteDocumentType();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; label_fr: string; label_ar?: string | null } | null>(null);
  const [labelFr, setLabelFr] = useState('');
  const [labelAr, setLabelAr] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isError) {
    return <ErrorState message="Impossible de charger les types." onRetry={refetch} />;
  }

  const openCreate = () => {
    setEditing(null);
    setLabelFr('');
    setLabelAr('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (t: { id: number; label_fr: string; label_ar?: string | null }) => {
    setEditing(t);
    setLabelFr(t.label_fr);
    setLabelAr(t.label_ar ?? '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setError(null);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, label_fr: labelFr, label_ar: labelAr || undefined });
      } else {
        await createMutation.mutateAsync({ label_fr: labelFr, label_ar: labelAr || undefined });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message ?? 'Erreur inconnue');
    }
  };

  const columns = [
    { key: 'label_fr', label: 'Libellé (FR)', render: (row: { label_fr: string }) => <span className="font-medium text-text-primary">{row.label_fr}</span> },
    { key: 'code', label: 'Code', render: (row: { code: string }) => <span className="text-xs font-mono text-text-muted">{row.code}</span> },
    {
      key: 'is_system', label: 'Nature',
      render: (row: { is_system: boolean }) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${row.is_system ? 'bg-surface-100 text-text-muted' : 'bg-brand-100 text-brand-700'}`}>
          {row.is_system ? 'Système' : 'Personnalisé'}
        </span>
      ),
    },
    {
      key: 'actions', label: '', width: 'w-24',
      render: (row: { id: number; label_fr: string; label_ar?: string | null; is_system: boolean }) => (
        <div className="flex gap-1 justify-end">
          {!row.is_system && (
            <>
              <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-primary" aria-label="Modifier">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteMutation.mutate(row.id)} className="p-1.5 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger" aria-label="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-muted">Ajoutez vos propres types pour classer les documents téléversés.</p>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Nouveau type
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : !types?.length ? (
        <EmptyState type="create" title="Aucun type" description="Ajoutez un type de document." action={{ label: 'Nouveau type', onClick: openCreate }} />
      ) : (
        <DataTable columns={columns} data={types} getRowKey={(row) => row.id} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editing ? 'Modifier le type' : 'Nouveau type de document'}
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Annuler</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">
              {editing ? 'Mettre à jour' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{error}</div>}
          <FormField label="Libellé français" required>
            <input value={labelFr} onChange={(e) => setLabelFr(e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Ex : Attestation de voisinage" />
          </FormField>
          <FormField label="Libellé arabe (optionnel)">
            <input value={labelAr} onChange={(e) => setLabelAr(e.target.value)} dir="rtl"
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

/* --------------------------------- Documents --------------------------------- */

function DocumentsTab() {
  const { activeResidence } = useResidenceStore();
  const { data: residences } = useResidences();
  const [residenceId, setResidenceId] = useState<number | undefined>(activeResidence?.id);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: types } = useDocumentTypes();
  const { data, isLoading, isError, refetch } = useResidenceDocuments({
    residence_id: residenceId,
    type: typeFilter || undefined,
    search: search || undefined,
    per_page: 20,
    page,
  });

  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isError) {
    return <ErrorState message="Impossible de charger les documents." onRetry={refetch} />;
  }

  const handleUpload = async () => {
    if (!file || !residenceId || !docType) {
      setError('Résidence, type et fichier sont requis.');
      return;
    }
    setError(null);
    try {
      const form = new FormData();
      form.append('residence_id', String(residenceId));
      form.append('type', docType);
      if (title) form.append('title', title);
      form.append('file', file);
      await uploadMutation.mutateAsync(form);
      setIsModalOpen(false);
      setFile(null);
      setDocType('');
      setTitle('');
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      const details = resp?.errors ? Object.values(resp.errors).flat().join(' ') : '';
      setError(details || resp?.message || 'Échec du téléversement.');
    }
  };

  const columns = [
    { key: 'title', label: 'Titre', render: (row: { title: string; number: string | null }) => (
      <div><div className="font-medium text-text-primary">{row.title}</div>
      <div className="text-xs text-text-muted font-mono">{row.number}</div></div>
    ) },
    { key: 'type', label: 'Type', render: (row: { type: string }) => (
      <span className="text-sm text-text-secondary">{types?.find((t) => t.code === row.type)?.label_fr ?? row.type}</span>
    ) },
    { key: 'size', label: 'Taille', render: (row: { size: number | null }) => (
      <span className="text-sm text-text-muted">{row.size ? `${(row.size / 1024).toFixed(0)} Ko` : '—'}</span>
    ) },
    {
      key: 'is_locked', label: 'Verrou',
      render: (row: { is_locked: boolean }) => (
        <span className="text-xs">{row.is_locked ? '🔒' : '—'}</span>
      ),
    },
    {
      key: 'actions', label: '', width: 'w-24',
      render: (row: { id: number; title: string; is_locked: boolean }) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => documentsApi.download(row.id, row.title)}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-brand-600" aria-label="Télécharger">
            <Download className="w-4 h-4" />
          </button>
          {!row.is_locked && (
            <button onClick={() => deleteMutation.mutate(row.id)} className="p-1.5 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger" aria-label="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <select value={residenceId ?? ''} onChange={(e) => { setResidenceId(Number(e.target.value)); setPage(1); }}
          className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">Choisir une résidence</option>
          {residences?.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">Tous les types</option>
          {types?.map((t) => <option key={t.code} value={t.code}>{t.label_fr}</option>)}
        </select>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher..."
          className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        <div className="flex-1" />
        <button onClick={() => { setError(null); setIsModalOpen(true); }} disabled={!residenceId}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50">
          <Upload className="w-4 h-4" /> Téléverser
        </button>
      </div>

      {!residenceId ? (
        <EmptyState type="create" title="Sélectionnez une résidence" description="Les documents sont classés par résidence." action={{ label: '', onClick: () => {} }} />
      ) : isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : !data?.data.length ? (
        <EmptyState type="create" title="Aucun document" description="Téléversez le premier document de cette résidence." action={{ label: 'Téléverser', onClick: () => setIsModalOpen(true) }} />
      ) : (
        <DataTable
          columns={columns}
          data={data.data}
          getRowKey={(row) => row.id}
          pagination={{ page: data.meta.current_page, perPage: data.meta.per_page, total: data.meta.total, onPageChange: setPage }}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Téléverser un document"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Annuler</button>
            <button onClick={handleUpload} disabled={uploadMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
              {uploadMutation.isPending ? 'Envoi...' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{error}</div>}
          <FormField label="Type de document" required>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
              <option value="">Choisir un type</option>
              {types?.map((t) => <option key={t.code} value={t.code}>{t.label_fr}{t.is_system ? '' : ' (perso)'}</option>)}
            </select>
          </FormField>
          <FormField label="Titre (optionnel)">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Par défaut : nom du fichier" />
          </FormField>
          <FormField label="Fichier (PDF, JPG, PNG — 10 Mo max)" required>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-text-secondary file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-surface-100 file:text-sm file:font-medium hover:file:bg-surface-200" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

/* --------------------------------- Assistants --------------------------------- */

const ROLE_LABELS: Record<string, string> = {
  assistant: 'Assistant', syndic: 'Syndic', super_admin: 'Super admin',
};

function StaffTab() {
  const { data, isLoading, isError, refetch } = useStaff({ per_page: 20 });
  const { data: permGroups } = useStaffPermissions();
  const { data: residences } = useResidences();
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const toggleMutation = useToggleStaff();
  const deleteMutation = useDeleteStaff();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrivOpen, setIsPrivOpen] = useState(false);
  const [privTarget, setPrivTarget] = useState<StaffMember | null>(null);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConf, setPasswordConf] = useState('');
  const [role, setRole] = useState('assistant');
  const [selResidences, setSelResidences] = useState<number[]>([]);
  const [selPerms, setSelPerms] = useState<string[]>([]);

  if (isError) {
    return <ErrorState message="Impossible de charger les comptes." onRetry={refetch} />;
  }

  const openCreate = () => {
    setName(''); setEmail(''); setUsername(''); setPhone('');
    setPassword(''); setPasswordConf(''); setRole('assistant');
    setSelResidences([]); setSelPerms([]); setError(null);
    setIsModalOpen(true);
  };

  const openPrivileges = (member: StaffMember) => {
    setPrivTarget(member);
    setSelPerms(member.permissions ?? []);
    setSelResidences(Object.keys(member.residences ?? {}).map(Number));
    setError(null);
    setIsPrivOpen(true);
  };

  const togglePerm = (perm: string) =>
    setSelPerms((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]));

  const toggleResidence = (id: number) =>
    setSelResidences((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  const handleSave = async () => {
    setError(null);
    try {
      await createMutation.mutateAsync({
        name, email, username, phone: phone || undefined,
        password, password_confirmation: passwordConf, role,
        residences: selResidences, permissions: selPerms,
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      setError(resp?.errors ? Object.values(resp.errors).flat().join(' ') : (resp?.message ?? 'Erreur inconnue'));
    }
  };

  const handlePrivSave = async () => {
    if (!privTarget) return;
    setError(null);
    try {
      await updateMutation.mutateAsync({ id: privTarget.id, residences: selResidences, permissions: selPerms });
      setIsPrivOpen(false);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message ?? 'Erreur inconnue');
    }
  };

  const columns = [
    { key: 'name', label: 'Nom', render: (row: StaffMember) => (
      <div><div className="font-medium text-text-primary">{row.name}</div>
      <div className="text-xs text-text-muted">@{row.username}</div></div>
    ) },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rôle', render: (row: StaffMember) => (
      <span className="text-sm">{ROLE_LABELS[row.role] ?? row.role}</span>
    ) },
    {
      key: 'permissions', label: 'Privilèges',
      render: (row: StaffMember) => <span className="text-sm text-text-muted">{row.permissions?.length ?? 0} permission(s)</span>,
    },
    { key: 'is_active', label: 'Statut', render: (row: StaffMember) => <StatusBadge isActive={row.is_active} /> },
    {
      key: 'actions', label: '', width: 'w-32',
      render: (row: StaffMember) => (
        <div className="flex gap-1 justify-end">
          <button onClick={() => openPrivileges(row)} className="px-2 py-1 text-xs font-medium rounded-lg bg-surface-100 hover:bg-surface-200 text-text-primary">
            Privilèges
          </button>
          <button onClick={() => toggleMutation.mutate(row.id)} className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted" aria-label="Activer/Désactiver">
            <ToggleLeft className={`w-4 h-4 ${row.is_active ? 'text-success' : 'text-text-muted'}`} />
          </button>
          <button onClick={() => deleteMutation.mutate(row.id)} className="p-1.5 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger" aria-label="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-muted">Créez des comptes assistants et décidez de ce qu’ils peuvent faire.</p>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Nouvel assistant
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : !data?.data.length ? (
        <EmptyState type="create" title="Aucun compte staff" description="Créez le premier compte assistant." action={{ label: 'Nouvel assistant', onClick: openCreate }} />
      ) : (
        <DataTable
          columns={columns}
          data={data.data}
          getRowKey={(row) => row.id}
          pagination={{ page: data.meta.current_page, perPage: data.meta.per_page, total: data.meta.total, onPageChange: () => {} }}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau compte assistant" size="lg"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Annuler</button>
            <button onClick={handleSave} disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nom complet" required>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
            <FormField label="Nom d'utilisateur" required>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" required>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
            <FormField label="Téléphone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mot de passe" required>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
            <FormField label="Confirmation" required>
              <input type="password" value={passwordConf} onChange={(e) => setPasswordConf(e.target.value)} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
          </div>
          <FormField label="Rôle">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
              <option value="assistant">Assistant</option>
            </select>
          </FormField>
          <PrivilegeMatrix
            permGroups={permGroups ?? {}}
            selPerms={selPerms}
            onTogglePerm={togglePerm}
            residences={residences ?? []}
            selResidences={selResidences}
            onToggleResidence={toggleResidence}
          />
        </div>
      </Modal>

      <Modal isOpen={isPrivOpen} onClose={() => setIsPrivOpen(false)} title={`Privilèges — ${privTarget?.name ?? ''}`} size="lg"
        footer={
          <>
            <button onClick={() => setIsPrivOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Annuler</button>
            <button onClick={handlePrivSave} disabled={updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{error}</div>}
          <PrivilegeMatrix
            permGroups={permGroups ?? {}}
            selPerms={selPerms}
            onTogglePerm={togglePerm}
            residences={residences ?? []}
            selResidences={selResidences}
            onToggleResidence={toggleResidence}
          />
        </div>
      </Modal>
    </div>
  );
}

function PrivilegeMatrix({ permGroups, selPerms, onTogglePerm, residences, selResidences, onToggleResidence }: {
  permGroups: Record<string, { name: string; action: string }[]>;
  selPerms: string[];
  onTogglePerm: (perm: string) => void;
  residences: { id: number; nom: string }[];
  selResidences: number[];
  onToggleResidence: (id: number) => void;
}) {
  const allInGroup = (perms: { name: string }[]) => perms.every((p) => selPerms.includes(p.name));
  const toggleGroup = (perms: { name: string }[]) => {
    const names = perms.map((p) => p.name);
    if (allInGroup(perms)) {
      names.forEach((n) => { if (selPerms.includes(n)) onTogglePerm(n); });
    } else {
      names.forEach((n) => { if (!selPerms.includes(n)) onTogglePerm(n); });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium text-text-primary mb-2">Résidences accessibles</div>
        <div className="flex flex-wrap gap-2">
          {residences.map((r) => (
            <label key={r.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${selResidences.includes(r.id) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-surface-300 text-text-secondary'}`}>
              <input type="checkbox" checked={selResidences.includes(r.id)} onChange={() => onToggleResidence(r.id)} className="accent-brand-600" />
              {r.nom}
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-text-primary mb-2">Privilèges (ce qu’il peut voir et faire)</div>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {Object.entries(permGroups).map(([module, perms]) => (
            <div key={module} className="border border-surface-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary capitalize">{module.replace(/_/g, ' ')}</span>
                <button onClick={() => toggleGroup(perms)} className="text-xs text-brand-600 hover:underline">
                  {allInGroup(perms) ? 'Tout retirer' : 'Tout cocher'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {perms.map((p) => (
                  <label key={p.name} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs cursor-pointer ${selPerms.includes(p.name) ? 'bg-brand-600 text-white' : 'bg-surface-100 text-text-secondary'}`}>
                    <input type="checkbox" checked={selPerms.includes(p.name)} onChange={() => onTogglePerm(p.name)} className="hidden" />
                    {ACTION_LABELS[p.action] ?? p.action}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
