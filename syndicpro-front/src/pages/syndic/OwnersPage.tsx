import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from '@/lib/motion';
import { Plus, Edit2, Trash2, Eye, Search, Phone, Mail, Home, Wallet, Receipt, Bell, FileText, Printer, Download, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useResidenceStore } from '@/store/residenceStore';
import { useResidences } from '@/hooks/useResidences';
import { useOwners, useOwnerFile, useCreateOwner, useUpdateOwner, useDeleteOwner } from '@/hooks/useOwners';
import type { OwnerListItem, OwnerFile } from '@/api/owners.api';
import { paymentsApi, PAYMENT_METHODS, PAYMENT_STATUS_LABELS } from '@/api/payments.api';
import { EncaisserModal } from '@/components/syndic/EncaisserModal';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/ErrorState';
import { ownerSchema, type OwnerFormData } from '@/utils/schemas';

type FileTab = 'infos' | 'biens' | 'situation' | 'paiements' | 'relances' | 'documents';

export default function OwnersPage() {
  const user = useAuthStore((s) => s.user);
  const can = (perm: string) =>
    user?.role === 'syndic' || (user?.role as string) === 'super_admin' ||
    (user?.permissions ?? []).includes(perm);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const selectedIds = useResidenceStore((s) => s.selectedIds);
  const { data: residences } = useResidences();
  // Sélection partielle → filtre ; « Toutes » (ou chargement) → global.
  const scopeIds = residences && selectedIds.length > 0 && selectedIds.length < residences.length
    ? selectedIds
    : undefined;
  const { data, isLoading, isError, refetch } = useOwners({
    search: search || undefined,
    per_page: 20,
    page,
    residence_ids: scopeIds,
  });

  const [fileId, setFileId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Lien profond depuis la recherche globale (?dossier=<id>) — même garde que le formulaire.
  const [lastDossier, setLastDossier] = useState<string | null>(null);
  const dossierParam = searchParams.get('dossier');
  if (dossierParam !== lastDossier) {
    setLastDossier(dossierParam);
    if (dossierParam && /^\d+$/.test(dossierParam)) {
      setFileId(Number(dossierParam));
      setSearchParams({}, { replace: true });
    }
  }
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerListItem | null>(null);
  const [deleting, setDeleting] = useState<OwnerListItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const deleteMutation = useDeleteOwner();

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState message="Impossible de charger les propriétaires." onRetry={refetch} />
      </div>
    );
  }

  const columns = [
    {
      key: 'display_name', label: 'Propriétaire',
      render: (row: OwnerListItem) => (
        <div>
          <div className="font-medium text-text-primary">{row.display_name}</div>
          <div className="text-xs text-text-muted">{row.type === 'company' ? 'Société' : 'Particulier'}</div>
        </div>
      ),
    },
    { key: 'identity_number', label: 'CIN / RC', render: (row: OwnerListItem) => <span className="font-mono text-sm">{row.identity_number ?? '—'}</span> },
    {
      key: 'contact', label: 'Contact',
      render: (row: OwnerListItem) => (
        <div className="text-sm text-text-secondary">
          <div>{row.phones?.[0]?.number ?? '—'}</div>
          <div className="text-xs text-text-muted">{row.emails?.[0]?.email ?? ''}</div>
        </div>
      ),
    },
    {
      key: 'properties', label: 'Biens',
      render: (row: OwnerListItem) => <span className="text-sm">{row.properties?.length ?? 0} lot(s)</span>,
    },
    {
      key: 'actions', label: '', width: 'w-32',
      render: (row: OwnerListItem) => (
        <div className="flex gap-1 justify-end">
          <button onClick={() => setFileId(row.id)} className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-brand-600" aria-label="Dossier">
            <Eye className="w-4 h-4" />
          </button>
          {can('owners.update') && (
            <button onClick={() => { setEditing(row); setIsFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-text-primary" aria-label="Modifier">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {can('owners.delete') && (
            <button onClick={() => { setDeleting(row); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger" aria-label="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Propriétaires</h1>
          <p className="text-sm text-text-muted mt-1">Recherche par CIN, nom ou local — dossier complet</p>
        </div>
        {can('owners.create') && (
          <button onClick={() => { setEditing(null); setIsFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
            <Plus className="w-4 h-4" /> Nouveau propriétaire
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="CIN, nom, téléphone, n° de lot..."
            className="w-full pl-9 pr-4 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : !data?.data.length ? (
        <EmptyState type="create" title="Aucun propriétaire" description="Ajoutez un propriétaire ou modifiez la recherche." action={can('owners.create') ? { label: 'Nouveau propriétaire', onClick: () => { setEditing(null); setIsFormOpen(true); } } : { label: '', onClick: () => {} }} />
      ) : (
        <DataTable
          columns={columns}
          data={data.data}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setFileId(row.id)}
          pagination={{ page: data.meta.current_page, perPage: data.meta.per_page, total: data.meta.total, onPageChange: setPage }}
        />
      )}

      {fileId && <OwnerFileModal ownerId={fileId} canEdit={can('owners.update')} canRecord={can('payments.create')} canCancel={can('payments.cancel')} onClose={() => setFileId(null)} onEdit={(owner) => { setFileId(null); setEditing(owner); setIsFormOpen(true); }} />}

      <OwnerFormModal
        isOpen={isFormOpen}
        editing={editing}
        onClose={() => { setIsFormOpen(false); setEditing(null); }}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onConfirm={async () => { if (deleting) await deleteMutation.mutateAsync(deleting.id); setIsDeleteOpen(false); setDeleting(null); }}
        onCancel={() => { setIsDeleteOpen(false); setDeleting(null); }}
        title="Supprimer le propriétaire"
        message={`Supprimer "${deleting?.display_name}" ? Impossible s'il détient encore un lot ou s'il est promoteur. (Corbeille : restaurable côté base.)`}
        confirmLabel="Supprimer"
        isDestructive
      />
    </motion.div>
  );
}

/* ------------------------------ Dossier propriétaire ------------------------------ */

const FILE_TABS: { key: FileTab; label: string; icon: React.ReactNode }[] = [
  { key: 'infos', label: 'Infos', icon: <Eye className="w-4 h-4" /> },
  { key: 'biens', label: 'Biens', icon: <Home className="w-4 h-4" /> },
  { key: 'situation', label: 'Situation', icon: <Wallet className="w-4 h-4" /> },
  { key: 'paiements', label: 'Paiements', icon: <Receipt className="w-4 h-4" /> },
  { key: 'relances', label: 'Relances', icon: <Bell className="w-4 h-4" /> },
  { key: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
];

function OwnerFileModal({ ownerId, canEdit, canRecord, canCancel, onClose, onEdit }: {
  ownerId: number;
  canEdit: boolean;
  canRecord: boolean;
  canCancel: boolean;
  onClose: () => void;
  onEdit: (owner: OwnerListItem) => void;
}) {
  const [tab, setTab] = useState<FileTab>('infos');
  const [encaisserOpen, setEncaisserOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'validated' | 'cancelled'>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: file, isLoading, isError, refetch } = useOwnerFile(ownerId);

  useEffect(() => {
    const done = () => document.body.classList.remove('print-dossier');
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  const printDossier = () => {
    document.body.classList.add('print-dossier');
    window.print();
  };

  const openReceipt = async (paymentId: number, kind: 'encaissement' | 'imputation') => {
    const url = `/api/syndic/payments/${paymentId}/receipts/${kind}`;
    const blobUrl = await paymentsApi.receiptBlob(url);
    window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  };

  const doCancel = async (paymentId: number) => {
    if (!cancelReason.trim()) { setCancelError('Motif obligatoire.'); return; }
    setBusy(true);
    setCancelError(null);
    try {
      await paymentsApi.cancel(paymentId, cancelReason.trim());
      setCancellingId(null);
      setCancelReason('');
      refetch();
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string } } }).response?.data;
      setCancelError(resp?.message ?? 'Erreur inconnue');
    } finally {
      setBusy(false);
    }
  };

  const payments = (file?.payments ?? []).filter((p) => paymentFilter === 'all' || p.status === paymentFilter);

  return (
    <Modal isOpen onClose={onClose} title={file ? `Dossier — ${file.owner.display_name}` : 'Dossier propriétaire'} size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Fermer</button>
          {file && (
            <button onClick={printDossier} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">
              <Printer className="w-4 h-4" /> Imprimer
            </button>
          )}
          {canRecord && file && (
            <button onClick={() => setEncaisserOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-success hover:opacity-90 rounded-lg">
              <Wallet className="w-4 h-4" /> Encaisser
            </button>
          )}
          {canEdit && file && (
            <button onClick={() => onEdit(file.owner)} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Modifier</button>
          )}
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : isError || !file ? (
        <ErrorState message="Impossible de charger le dossier." onRetry={refetch} />
      ) : (
        <div className="dossier-print" data-owner-file={file.owner.id}>
          <div className="hidden print:block mb-4">
            <h2 className="text-xl font-bold">Dossier copropriétaire — {file.owner.display_name}</h2>
            <p className="text-sm text-text-muted">CIN/RC : {file.owner.identity_number ?? '—'} · Imprimé le {new Date().toLocaleDateString('fr-MA')}</p>
          </div>
          <div className="hidden print:block"><DossierPrintView file={file} /></div>
          <div className="flex gap-1 mb-4 border-b border-surface-200 overflow-x-auto print:hidden">
            {FILE_TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          <div className="print:hidden">
          {tab === 'infos' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Nom complet" value={file.owner.display_name} />
              <InfoRow label="CIN / RC" value={file.owner.identity_number ?? '—'} mono />
              <InfoRow label="Type" value={file.owner.type === 'company' ? 'Société' : 'Particulier'} />
              <div className="col-span-2">
                <div className="text-xs text-text-muted mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphones</div>
                {file.owner.phones?.length ? file.owner.phones.map((p, i) => (
                  <div key={i} className="text-sm">{p.number}
                    {p.is_primary && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-surface-100">principal</span>}
                    {p.is_whatsapp && <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-success-light text-success">WhatsApp</span>}
                  </div>
                )) : <span className="text-sm text-text-muted">—</span>}
              </div>
              <div className="col-span-2">
                <div className="text-xs text-text-muted mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Emails</div>
                {file.owner.emails?.length ? file.owner.emails.map((e, i) => (
                  <div key={i} className="text-sm">{e.email}</div>
                )) : <span className="text-sm text-text-muted">—</span>}
              </div>
            </div>
          )}

          {tab === 'biens' && (
            <div className="space-y-2">
              {!file.owner.properties?.length && <p className="text-sm text-text-muted">Aucun bien.</p>}
              {file.owner.properties?.map((p, i) => (
                <div key={i} className="p-3 border border-surface-200 rounded-lg text-sm flex justify-between">
                  <span className="font-medium">Lot {p.lot_number ?? `#${p.lot_id}`} {p.building ? `(imm. ${p.building})` : ''}</span>
                  <span className="text-text-muted">{p.share_percent}% · depuis {p.started_on}{p.ended_on ? ` → ${p.ended_on}` : ' (actuel)'}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'situation' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label="Total dû" value={`${file.situation.total_due.toLocaleString('fr-MA')} MAD`} />
                <StatBox label="Payé" value={`${file.situation.total_paid.toLocaleString('fr-MA')} MAD`} />
                <StatBox label="Reste" value={`${file.situation.remaining.toLocaleString('fr-MA')} MAD`} alert={file.situation.remaining > 0} />
                <StatBox label="En retard" value={`${file.situation.overdue.toLocaleString('fr-MA')} MAD`} alert={file.situation.overdue > 0} />
              </div>
              <div className="text-xs text-text-muted">
                Plus ancien impayé : {file.situation.oldest_unpaid ?? '—'} · Dernier paiement : {file.situation.last_payment_on ?? '—'}
              </div>
              {file.situation.per_lot.map((l) => (
                <div key={l.lot_id} className="p-3 border border-surface-200 rounded-lg text-sm flex justify-between">
                  <span className="font-medium">Lot {l.lot_number ?? `#${l.lot_id}`}{l.building ? ` (imm. ${l.building})` : ''}</span>
                  <span>Dû {l.due.toLocaleString('fr-MA')} · Payé {l.paid.toLocaleString('fr-MA')} · <strong>Reste {l.remaining.toLocaleString('fr-MA')}</strong></span>
                </div>
              ))}
            </div>
          )}

          {tab === 'paiements' && (
            <div className="space-y-2">
              <div className="flex gap-2 text-xs print:hidden">
                {(['all', 'validated', 'cancelled'] as const).map((f) => (
                  <button key={f} onClick={() => setPaymentFilter(f)}
                    className={`px-2.5 py-1 rounded-full border ${paymentFilter === f ? 'bg-brand-600 text-white border-brand-600' : 'border-surface-300 text-text-muted'}`}>
                    {f === 'all' ? 'Tous' : PAYMENT_STATUS_LABELS[f]}
                  </button>
                ))}
              </div>
              {!payments.length && <p className="text-sm text-text-muted">Aucun paiement.</p>}
              {payments.map((p) => (
                <div key={p.id}>
                  <div className="p-3 border border-surface-200 rounded-lg text-sm flex justify-between items-center gap-2">
                    <span>{p.paid_on} · {PAYMENT_METHODS.find((m) => m.value === p.method)?.label ?? p.method}
                      {p.receipt_number ? <span className="font-mono text-xs ml-1">· {p.receipt_number}</span> : ''}
                      {p.allocation_receipt_number ? <span className="font-mono text-xs ml-1">· {p.allocation_receipt_number}</span> : ''}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{Number(p.amount).toLocaleString('fr-MA')} MAD · {PAYMENT_STATUS_LABELS[p.status] ?? p.status}</span>
                      {p.status === 'validated' && (
                        <>
                          <button onClick={() => openReceipt(p.id, 'encaissement')} title="Reçu d’encaissement" className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-brand-600 print:hidden">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => openReceipt(p.id, 'imputation')} title="Reçu d’imputation" className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-brand-600 print:hidden">
                            <Receipt className="w-4 h-4" />
                          </button>
                          {canCancel && (
                            <button onClick={() => { setCancellingId(p.id); setCancelReason(''); setCancelError(null); }} title="Annuler" className="p-1.5 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger print:hidden">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  {cancellingId === p.id && (
                    <div className="mt-1 p-3 border border-danger-border bg-danger-light/30 rounded-lg text-sm space-y-2">
                      <div className="font-medium text-danger">Annuler ce paiement ? Les dus seront recalculés.</div>
                      <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Motif obligatoire (ex. doublon, erreur de saisie)"
                        className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-danger" />
                      {cancelError && <div className="text-danger text-xs">{cancelError}</div>}
                      <div className="flex gap-2">
                        <button onClick={() => doCancel(p.id)} disabled={busy} className="px-3 py-1.5 text-xs font-medium text-white bg-danger rounded-lg disabled:opacity-50">Confirmer l’annulation</button>
                        <button onClick={() => setCancellingId(null)} className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-100 rounded-lg">Retour</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'relances' && (
            <div className="space-y-2">
              {!file.reminders.length && <p className="text-sm text-text-muted">Aucune relance.</p>}
              {file.reminders.map((r) => (
                <div key={r.id} className="p-3 border border-surface-200 rounded-lg text-sm flex justify-between">
                  <span>{r.type} · {r.channel}</span>
                  <span className="text-text-muted">{Number(r.amount_due).toLocaleString('fr-MA')} MAD · {r.status}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'documents' && (
            <div className="space-y-2">
              {!file.documents.length && <p className="text-sm text-text-muted">Aucun document.</p>}
              {file.documents.map((d) => (
                <div key={d.id} className="p-3 border border-surface-200 rounded-lg text-sm flex justify-between">
                  <span className="font-medium">{d.title}</span>
                  <span className="text-text-muted">{d.type}{d.number ? ` · ${d.number}` : ''}</span>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      )}
      {encaisserOpen && file && (
        <EncaisserModal
          ownerId={file.owner.id}
          ownerName={file.owner.display_name}
          properties={file.owner.properties ?? []}
          situation={file.situation}
          onClose={() => setEncaisserOpen(false)}
          onRecorded={() => refetch()}
        />
      )}
    </Modal>
  );
}

function DossierPrintView({ file }: { file: OwnerFile }) {
  const fmt = (n: number | string) => `${Number(n).toLocaleString('fr-MA')} MAD`;
  return (
    <div className="text-sm space-y-4">
      <section>
        <h3 className="font-bold mb-1">Biens</h3>
        {file.owner.properties?.map((p, i) => (
          <div key={i}>Lot {p.lot_number ?? `#${p.lot_id}`}{p.building ? ` (imm. ${p.building})` : ''} — {p.share_percent}% · depuis {p.started_on}{p.ended_on ? ` → ${p.ended_on}` : ' (actuel)'}</div>
        )) ?? <div>—</div>}
      </section>
      <section>
        <h3 className="font-bold mb-1">Situation</h3>
        <div>Total dû : {fmt(file.situation.total_due)} · Payé : {fmt(file.situation.total_paid)} · <strong>Reste : {fmt(file.situation.remaining)}</strong> · En retard : {fmt(file.situation.overdue)}</div>
        <div>Plus ancien impayé : {file.situation.oldest_unpaid ?? '—'} · Dernier paiement : {file.situation.last_payment_on ?? '—'}</div>
        {file.situation.per_lot.map((l) => (
          <div key={l.lot_id}>Lot {l.lot_number ?? `#${l.lot_id}`}{l.building ? ` (imm. ${l.building})` : ''} — Dû {fmt(l.due)} · Payé {fmt(l.paid)} · <strong>Reste {fmt(l.remaining)}</strong></div>
        ))}
      </section>
      <section>
        <h3 className="font-bold mb-1">Paiements</h3>
        {file.payments.length ? file.payments.map((p) => (
          <div key={p.id}>{p.paid_on} · {PAYMENT_METHODS.find((m) => m.value === p.method)?.label ?? p.method} · {fmt(p.amount)} · {PAYMENT_STATUS_LABELS[p.status] ?? p.status}{p.receipt_number ? ` · ${p.receipt_number}` : ''}{p.allocation_receipt_number ? ` · ${p.allocation_receipt_number}` : ''}</div>
        )) : <div>—</div>}
      </section>
      <section>
        <h3 className="font-bold mb-1">Relances</h3>
        {file.reminders.length ? file.reminders.map((r) => (
          <div key={r.id}>{r.type} · {r.channel} · {fmt(r.amount_due)} · {r.status}</div>
        )) : <div>—</div>}
      </section>
      <section>
        <h3 className="font-bold mb-1">Documents</h3>
        {file.documents.length ? file.documents.map((d) => (
          <div key={d.id}>{d.title} · {d.type}{d.number ? ` · ${d.number}` : ''}</div>
        )) : <div>—</div>}
      </section>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-0.5">{label}</div>
      <div className={`text-sm text-text-primary ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function StatBox({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="p-3 bg-surface-50 rounded-lg">
      <div className="text-xs text-text-muted">{label}</div>
      <div className={`font-bold ${alert ? 'text-danger' : 'text-text-primary'}`}>{value}</div>
    </div>
  );
}

/* ------------------------------ Create / Edit form ------------------------------ */

function OwnerFormModal({ isOpen, editing, onClose }: {
  isOpen: boolean;
  editing: OwnerListItem | null;
  onClose: () => void;
}) {
  const createMutation = useCreateOwner();
  const updateMutation = useUpdateOwner();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: { type: 'individual', preferred_locale: 'fr', phones: [], emails: [] },
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({ control, name: 'phones' });
  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ control, name: 'emails' });
  const ownerType = watch('type');

  const openWith = (owner: OwnerListItem | null) => {
    reset({
      type: (owner?.type as 'individual' | 'company') ?? 'individual',
      first_name: owner?.first_name ?? '',
      last_name: owner?.last_name ?? '',
      company_name: owner?.company_name ?? '',
      identity_number: owner?.identity_number ?? '',
      preferred_locale: 'fr',
      internal_notes: '',
      phones: owner?.phones?.map((p) => ({ number: p.number, is_whatsapp: p.is_whatsapp, is_primary: p.is_primary })) ?? [],
      emails: owner?.emails?.map((e) => ({ email: e.email, is_primary: e.is_primary })) ?? [],
    });
    setServerError(null);
  };

  // Sync form when modal opens / editing changes.
  const [lastKey, setLastKey] = useState<string | null>(null);
  const key = isOpen ? `open-${editing?.id ?? 'new'}` : 'closed';
  if (key !== lastKey) {
    setLastKey(key);
    if (isOpen) openWith(editing);
  }

  const onSubmit = async (payload: OwnerFormData) => {
    setServerError(null);
    try {
      const body = {
        type: payload.type ?? 'individual',
        first_name: payload.first_name || undefined,
        last_name: payload.last_name || undefined,
        company_name: payload.company_name || undefined,
        identity_number: payload.identity_number || undefined,
        preferred_locale: payload.preferred_locale ?? 'fr',
        internal_notes: payload.internal_notes || undefined,
        phones: (payload.phones ?? [])
          .filter((p) => p.number.trim() !== '')
          .map((p) => ({ number: p.number.trim(), is_whatsapp: !!p.is_whatsapp, is_primary: !!p.is_primary })),
        emails: (payload.emails ?? [])
          .filter((e) => e.email.trim() !== '')
          .map((e) => ({ email: e.email.trim(), is_primary: !!e.is_primary })),
      };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...body });
      } else {
        await createMutation.mutateAsync(body);
      }
      onClose();
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      setServerError(resp?.errors ? Object.values(resp.errors).flat().join(' ') : (resp?.message ?? 'Erreur inconnue'));
    }
  };

  const inputCls = 'w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Modifier le propriétaire' : 'Nouveau propriétaire'} size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Annuler</button>
          <button onClick={handleSubmit(onSubmit)} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">
            {editing ? 'Mettre à jour' : 'Créer'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {serverError && <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{serverError}</div>}
        <FormField label="Type">
          <select {...register('type')} className={inputCls}>
            <option value="individual">Particulier</option>
            <option value="company">Société</option>
          </select>
        </FormField>
        {ownerType === 'company' ? (
          <FormField label="Raison sociale">
            <input {...register('company_name')} className={inputCls} />
          </FormField>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prénom">
              <input {...register('first_name')} className={inputCls} />
            </FormField>
            <FormField label="Nom">
              <input {...register('last_name')} className={inputCls} />
            </FormField>
          </div>
        )}
        <FormField label="CIN / RC" error={errors.identity_number?.message}>
          <input {...register('identity_number')} className={`${inputCls} font-mono`} placeholder="CIN existant → dossier lié, pas de doublon" />
        </FormField>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Téléphones</span>
            <button type="button" onClick={() => appendPhone({ number: '', is_whatsapp: false, is_primary: phoneFields.length === 0 })}
              className="text-xs text-brand-600 hover:underline">+ Ajouter</button>
          </div>
          {phoneFields.map((f, i) => (
            <div key={f.id} className="flex gap-2 mb-2">
              <input {...register(`phones.${i}.number`)} placeholder="+212..." className={`${inputCls} flex-1`} />
              <label className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
                <input type="checkbox" {...register(`phones.${i}.is_whatsapp`)} className="accent-brand-600" /> WA
              </label>
              <label className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
                <input type="checkbox" {...register(`phones.${i}.is_primary`)} className="accent-brand-600" /> Principal
              </label>
              <button type="button" onClick={() => removePhone(i)} className="p-2 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger" aria-label="Retirer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Emails</span>
            <button type="button" onClick={() => appendEmail({ email: '', is_primary: emailFields.length === 0 })}
              className="text-xs text-brand-600 hover:underline">+ Ajouter</button>
          </div>
          {emailFields.map((f, i) => (
            <div key={f.id} className="flex gap-2 mb-2">
              <input type="email" {...register(`emails.${i}.email`)} placeholder="email@exemple.com" className={`${inputCls} flex-1`} />
              <label className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
                <input type="checkbox" {...register(`emails.${i}.is_primary`)} className="accent-brand-600" /> Principal
              </label>
              <button type="button" onClick={() => removeEmail(i)} className="p-2 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger" aria-label="Retirer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <FormField label="Notes internes">
          <textarea {...register('internal_notes')} rows={2} className={`${inputCls} resize-none`} />
        </FormField>
      </form>
    </Modal>
  );
}
