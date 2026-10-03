import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Scale, Plus, ArrowRight } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useResidences } from '@/hooks/useResidences';
import {
  useLegalOverview, useNoQuitusTransfers, useLawyerCases,
  useCreateLawyerCase, useUpdateLawyerCaseStatus,
} from '@/hooks/useLegal';
import type { LegalUnpaidRow } from '@/api/legal.api';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { ErrorState } from '@/components/ui/ErrorState';

type Tab = 'unpaid' | 'noquitus' | 'cases';

const TABS: { key: Tab; label: string }[] = [
  { key: 'unpaid', label: 'Impayés' },
  { key: 'noquitus', label: 'Transferts sans quitus' },
  { key: 'cases', label: 'Dossiers avocat' },
];

const CASE_KIND_LABELS: Record<string, string> = {
  unpaid_dues: 'Impayés',
  no_quitus_transfer: 'Transfert sans quitus',
  other: 'Autre',
};

const STATUS_LABELS: Record<string, string> = {
  to_transmit: 'À transmettre',
  transmitted: 'Transmis',
  in_progress: 'En cours',
  closed: 'Clôturé',
};

const STATUS_ORDER = ['to_transmit', 'transmitted', 'in_progress', 'closed'];

export default function LegalPage() {
  const { activeResidence } = useResidenceStore();
  const { data: residences } = useResidences();
  const [residenceId, setResidenceId] = useState<number | undefined>(activeResidence?.id);
  const [tab, setTab] = useState<Tab>('unpaid');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Scale className="w-6 h-6" /> Juridique & recouvrement
          </h1>
          <p className="text-sm text-text-muted mt-1">Impayés, transferts sans quitus et dossiers avocat — motifs et nature des cas</p>
        </div>
        <select value={residenceId ?? ''} onChange={(e) => setResidenceId(Number(e.target.value))}
          className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">Choisir une résidence</option>
          {residences?.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select>
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

      {!residenceId ? (
        <EmptyState type="create" title="Sélectionnez une résidence" description="Choisissez une résidence pour voir sa situation juridique." action={{ label: '', onClick: () => {} }} />
      ) : (
        <>
          {tab === 'unpaid' && <UnpaidTab residenceId={residenceId} />}
          {tab === 'noquitus' && <NoQuitusTab residenceId={residenceId} />}
          {tab === 'cases' && <CasesTab residenceId={residenceId} />}
        </>
      )}
    </motion.div>
  );
}

/* ---------------------------------- Impayés ---------------------------------- */

function UnpaidTab({ residenceId }: { residenceId: number }) {
  const { data, isLoading, isError, refetch } = useLegalOverview(residenceId);
  const createMutation = useCreateLawyerCase();
  const [escalateRow, setEscalateRow] = useState<LegalUnpaidRow | null>(null);
  const [motif, setMotif] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isError) {
    return <ErrorState message="Impossible de charger les impayés." onRetry={refetch} />;
  }

  const handleEscalate = async () => {
    if (!escalateRow) return;
    setError(null);
    try {
      await createMutation.mutateAsync({
        residence_id: residenceId,
        owner_id: escalateRow.owner.id,
        lot_id: escalateRow.lots[0]?.lot_id ?? null,
        case_kind: 'unpaid_dues',
        motif: motif || escalateRow.motif,
        amount_claimed: escalateRow.amount_due,
      });
      setEscalateRow(null);
      setMotif('');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message ?? 'Erreur inconnue');
    }
  };

  const columns = [
    { key: 'owner', label: 'Copropriétaire', render: (row: LegalUnpaidRow) => (
      <div><div className="font-medium text-text-primary">{row.owner.display_name}</div>
      <div className="text-xs text-text-muted">{row.owner.phone ?? ''}</div></div>
    ) },
    { key: 'amount_due', label: 'Reste dû', render: (row: LegalUnpaidRow) => (
      <span className="font-medium text-danger">{row.amount_due.toLocaleString('fr-MA')} MAD</span>
    ) },
    { key: 'months_late', label: 'Retard', render: (row: LegalUnpaidRow) => (
      <span className="text-sm">{row.months_late} mois</span>
    ) },
    { key: 'motif', label: 'Motif', render: (row: LegalUnpaidRow) => (
      <span className="text-sm text-text-secondary">{row.motif}</span>
    ) },
    {
      key: 'lawyer_case', label: 'Dossier',
      render: (row: LegalUnpaidRow) => row.lawyer_case ? (
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
          {STATUS_LABELS[row.lawyer_case.status] ?? row.lawyer_case.status}
        </span>
      ) : (
        <span className="text-xs text-text-muted">Aucun</span>
      ),
    },
    {
      key: 'actions', label: '', width: 'w-28',
      render: (row: LegalUnpaidRow) => !row.lawyer_case ? (
        <button onClick={() => { setEscalateRow(row); setMotif(row.motif); setError(null); }}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700">
          <ArrowRight className="w-3 h-3" /> Juridique
        </button>
      ) : null,
    },
  ];

  return (
    <div>
      {data && (
        <div className="mb-4 p-4 bg-white rounded-xl shadow-card flex gap-6 text-sm">
          <div><span className="text-text-muted">Débiteurs :</span> <strong>{data.total}</strong></div>
          <div><span className="text-text-muted">Total réclamé :</span> <strong className="text-danger">{data.total_amount.toLocaleString('fr-MA')} MAD</strong></div>
          <div><span className="text-text-muted">Seuil juridique :</span> <strong>{data.thresholds.lawyer_after_months} mois</strong></div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : !data?.rows.length ? (
        <EmptyState type="create" title="Aucun impayé" description="Tous les copropriétaires sont à jour." action={{ label: '', onClick: () => {} }} />
      ) : (
        <DataTable columns={columns} data={data.rows} getRowKey={(row) => row.owner.id} />
      )}

      <Modal isOpen={!!escalateRow} onClose={() => setEscalateRow(null)} title="Transmettre au juridique"
        footer={
          <>
            <button onClick={() => setEscalateRow(null)} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Annuler</button>
            <button onClick={handleEscalate} disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
              {createMutation.isPending ? 'Création...' : 'Créer le dossier'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{error}</div>}
          <p className="text-sm text-text-secondary">
            Dossier <strong>Impayés</strong> pour {escalateRow?.owner.display_name} — {escalateRow?.amount_due.toLocaleString('fr-MA')} MAD.
          </p>
          <FormField label="Motif (pourquoi ce dossier part au juridique)" required>
            <textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------------------- Transferts sans quitus ---------------------------- */

function NoQuitusTab({ residenceId }: { residenceId: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useNoQuitusTransfers({ residence_id: residenceId, per_page: 20, page });

  if (isError) {
    return <ErrorState message="Impossible de charger les transferts." onRetry={refetch} />;
  }

  const columns = [
    { key: 'lot', label: 'Lot', render: (row: { lot: string }) => <span className="font-medium text-text-primary">{row.lot}</span> },
    { key: 'from_owner', label: 'Cédant', render: (row: { from_owner: string | null }) => <span className="text-sm">{row.from_owner ?? '—'}</span> },
    { key: 'to_owner', label: 'Acquéreur', render: (row: { to_owner: string | null }) => <span className="text-sm">{row.to_owner ?? '—'}</span> },
    { key: 'balance', label: 'Solde au transfert', render: (row: { balance_at_transfer: number | string }) => (
      <span className="text-sm font-medium text-danger">{Number(row.balance_at_transfer).toLocaleString('fr-MA')} MAD</span>
    ) },
    { key: 'motif', label: 'Motif (sans quitus)', render: (row: { motif: string }) => (
      <span className="text-sm text-text-secondary">{row.motif}</span>
    ) },
    {
      key: 'lawyer_case', label: 'Mesure légale',
      render: (row: { lawyer_case: { status: string } | null }) => row.lawyer_case ? (
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
          {STATUS_LABELS[row.lawyer_case.status] ?? row.lawyer_case.status}
        </span>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
  ];

  return (
    <div>
      <p className="text-sm text-text-muted mb-4">
        Transferts effectués <strong>sans quitus</strong> : le quitus est affiché « Aucun » et chaque cas est automatiquement
        signalé en mesure légale, comme les impayés.
      </p>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : !data?.data.length ? (
        <EmptyState type="create" title="Aucun transfert sans quitus" description="Tous les transferts ont un quitus." action={{ label: '', onClick: () => {} }} />
      ) : (
        <DataTable
          columns={columns}
          data={data.data}
          getRowKey={(row) => row.id}
          pagination={{ page: data.meta.current_page, perPage: data.meta.per_page, total: data.meta.total, onPageChange: setPage }}
        />
      )}
    </div>
  );
}

/* ------------------------------- Dossiers avocat ------------------------------- */

function CasesTab({ residenceId }: { residenceId: number }) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useLawyerCases({
    residence_id: residenceId,
    status: statusFilter || undefined,
    case_kind: kindFilter || undefined,
    per_page: 20,
    page,
  });
  const createMutation = useCreateLawyerCase();
  const statusMutation = useUpdateLawyerCaseStatus();

  // create form state (owner search handled via transfer owner search endpoint)
  const [ownerId, setOwnerId] = useState('');
  const [caseKind, setCaseKind] = useState('other');
  const [motif, setMotif] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isError) {
    return <ErrorState message="Impossible de charger les dossiers." onRetry={refetch} />;
  }

  const handleCreate = async () => {
    setError(null);
    try {
      await createMutation.mutateAsync({
        residence_id: residenceId,
        owner_id: Number(ownerId),
        case_kind: caseKind,
        motif,
        amount_claimed: Number(amount),
      });
      setIsCreateOpen(false);
      setOwnerId(''); setCaseKind('other'); setMotif(''); setAmount('');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message ?? 'Erreur inconnue');
    }
  };

  const advance = (id: number, current: string) => {
    const idx = STATUS_ORDER.indexOf(current);
    if (idx < 0 || idx >= STATUS_ORDER.length - 1) return;
    statusMutation.mutate({ id, status: STATUS_ORDER[idx + 1] });
  };

  const columns = [
    { key: 'owner', label: 'Concerné', render: (row: { owner: { display_name?: string; id: number } }) => (
      <span className="font-medium text-text-primary">{row.owner.display_name ?? `#${row.owner.id}`}</span>
    ) },
    { key: 'case_kind', label: 'Nature du cas', render: (row: { case_kind_label: string }) => (
      <span className="text-sm px-2 py-0.5 rounded-full bg-surface-100 text-text-secondary">{row.case_kind_label}</span>
    ) },
    { key: 'motif', label: 'Motif', render: (row: { motif: string | null }) => (
      <span className="text-sm text-text-secondary">{row.motif ?? '—'}</span>
    ) },
    { key: 'amount', label: 'Montant', render: (row: { amount_claimed: number | string }) => (
      <span className="text-sm font-medium">{Number(row.amount_claimed).toLocaleString('fr-MA')} MAD</span>
    ) },
    { key: 'status', label: 'Statut', render: (row: { status: string }) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${row.status === 'closed' ? 'bg-surface-100 text-text-muted' : 'bg-amber-100 text-amber-800'}`}>
        {STATUS_LABELS[row.status] ?? row.status}
      </span>
    ) },
    {
      key: 'actions', label: '', width: 'w-28',
      render: (row: { id: number; status: string }) => row.status !== 'closed' ? (
        <button onClick={() => advance(row.id, row.status)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700">
          <ArrowRight className="w-3 h-3" /> Avancer
        </button>
      ) : null,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={kindFilter} onChange={(e) => { setKindFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
          <option value="">Toutes natures</option>
          {Object.entries(CASE_KIND_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => { setError(null); setIsCreateOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Nouveau dossier
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : !data?.data.length ? (
        <EmptyState type="create" title="Aucun dossier" description="Créez le premier dossier juridique." action={{ label: 'Nouveau dossier', onClick: () => setIsCreateOpen(true) }} />
      ) : (
        <DataTable
          columns={columns}
          data={data.data}
          getRowKey={(row) => row.id}
          pagination={{ page: data.meta.current_page, perPage: data.meta.per_page, total: data.meta.total, onPageChange: setPage }}
        />
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nouveau dossier juridique"
        footer={
          <>
            <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Annuler</button>
            <button onClick={handleCreate} disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{error}</div>}
          <FormField label="ID propriétaire" required>
            <input value={ownerId} onChange={(e) => setOwnerId(e.target.value)} type="number"
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </FormField>
          <FormField label="Nature du cas" required>
            <select value={caseKind} onChange={(e) => setCaseKind(e.target.value)}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
              {Object.entries(CASE_KIND_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FormField>
          <FormField label="Montant réclamé (MAD)" required>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={0}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </FormField>
          <FormField label="Motif (pourquoi ce dossier part au juridique)" required>
            <textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
