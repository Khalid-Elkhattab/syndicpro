import { useMemo, useState } from 'react';
import { motion } from '@/lib/motion';
import { Plus, Eye, Rocket, Trash2 } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useResidenceFinance } from '@/hooks/useResidenceFinance';
import { useLotsForTransfer } from '@/hooks/useTransfer';
import {
  useContributions,
  useContribution,
  useContributionPreview,
  useCreateContribution,
  useDeleteContribution,
  usePublishContribution,
} from '@/hooks/useContributions';
import { LOT_TYPES, type ContributionFixedRate, type ContributionItem } from '@/api/contributions.api';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/ErrorState';

const MODE_DESCRIPTIONS: Record<string, string> = {
  fixed: 'Montant mensuel fixe par type de lot (ex : appartement → 300 MAD).',
  per_surface: 'Montant mensuel fixe par tranche de surface (ex : <100 m² → 300 MAD).',
  tantieme: 'Budget annuel ÷ tantièmes totaux, au prorata des tantièmes.',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-surface-100 text-text-secondary',
  published: 'bg-success-light text-success-dark',
  cancelled: 'bg-danger-light text-danger-dark',
};

function fmtMoney(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  return `${Number(v).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

export default function ContributionsPage() {
  const { activeResidence } = useResidenceStore();
  const residenceId = activeResidence?.id ?? 0;

  const { data: contributions, isLoading, isError, refetch } = useContributions(residenceId);
  const { data: finance } = useResidenceFinance(residenceId);
  const { data: lots } = useLotsForTransfer({ residence_id: residenceId || undefined });
  const deleteMutation = useDeleteContribution();
  const publishMutation = usePublishContribution();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<ContributionItem | null>(null);
  const [publishing, setPublishing] = useState<ContributionItem | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const buildings = useMemo(() => {
    const map = new Map<number, string>();
    (lots ?? []).forEach((l) => {
      if (l.building_id && !map.has(l.building_id)) map.set(l.building_id, l.building ?? `#${l.building_id}`);
    });
    return [...map.entries()].map(([id, number]) => ({ id, number }));
  }, [lots]);

  if (!residenceId) {
    return (
      <div className="p-8">
        <EmptyState
          type="create"
          title="Aucune résidence sélectionnée"
          description="Choisissez une résidence dans le menu de gauche."
          action={{ label: '', onClick: () => {} }}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState message="Impossible de charger les cotisations." onRetry={refetch} />
      </div>
    );
  }

  const columns = [
    {
      key: 'name', label: 'Cotisation',
      render: (row: ContributionItem) => (
        <div>
          <div className="font-medium text-text-primary">{row.name}</div>
          <div className="text-xs text-text-muted">{row.type_label} · {row.calculation_mode_label}</div>
        </div>
      ),
    },
    {
      key: 'period', label: 'Période',
      render: (row: ContributionItem) => <span className="text-sm">{row.starts_on} → {row.ends_on}</span>,
    },
    {
      key: 'annual', label: 'Budget annuel',
      render: (row: ContributionItem) => <span className="text-sm font-mono">{fmtMoney(row.annual_budget)}</span>,
    },
    {
      key: 'lots', label: 'Lots',
      render: (row: ContributionItem) => <span className="text-sm">{row.contribution_lots_count || '—'}</span>,
    },
    {
      key: 'status', label: 'Statut',
      render: (row: ContributionItem) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[row.status] ?? 'bg-surface-100'}`}>
          {row.status_label}
        </span>
      ),
    },
    {
      key: 'actions', label: '', width: 'w-32',
      render: (row: ContributionItem) => (
        <div className="flex gap-1 justify-end">
          <button onClick={() => setDetailId(row.id)} className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted hover:text-brand-600" aria-label="Voir">
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'draft' && (
            <>
              <button onClick={() => setPublishing(row)} className="p-1.5 rounded-lg hover:bg-success-light text-text-muted hover:text-success-dark" aria-label="Publier">
                <Rocket className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleting(row)} className="p-1.5 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger" aria-label="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handlePublish = async () => {
    if (!publishing) return;
    setServerError(null);
    try {
      await publishMutation.mutateAsync(publishing.id);
      setPublishing(null);
      setDetailId(publishing.id);
    } catch (err: unknown) {
      setServerError(extractMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setServerError(null);
    try {
      await deleteMutation.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (err: unknown) {
      setServerError(extractMessage(err));
    }
  };

  const decidedYear = finance?.fiscal_years.find((fy) => fy.calculation_mode);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Appels de fonds</h1>
          <p className="text-sm text-text-muted mt-1">Cotisations standard et exceptionnelles {activeResidence ? `— ${activeResidence.nom}` : ''}</p>
        </div>
        <button onClick={() => { setServerError(null); setIsCreateOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Nouvelle cotisation
        </button>
      </div>

      {finance && (
        <div className="mb-4 p-3 bg-surface-50 border border-surface-200 rounded-lg text-sm text-text-secondary">
          Mode par défaut : <strong>{finance.residence.calculation_mode_label ?? '—'}</strong>
          {decidedYear && (
            <> · Exercice {decidedYear.name} : <strong>{decidedYear.calculation_mode_label}</strong>
              {decidedYear.assembly ? ` (PV : ${decidedYear.assembly.title})` : ' (PV non lié)'}</>
          )}
        </div>
      )}

      {serverError && (
        <div className="mb-4 p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{serverError}</div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : !contributions?.length ? (
        <EmptyState
          type="create"
          title="Aucune cotisation"
          description="Créez une cotisation standard ou exceptionnelle, prévisualisez par lot, puis publiez."
          action={{ label: 'Nouvelle cotisation', onClick: () => setIsCreateOpen(true) }}
        />
      ) : (
        <DataTable columns={columns} data={contributions} getRowKey={(row) => row.id} onRowClick={(row) => setDetailId(row.id)} />
      )}

      {isCreateOpen && (
        <CreateModal
          residenceId={residenceId}
          financeModes={finance?.modes ?? []}
          defaultMode={decidedYear?.calculation_mode ?? finance?.residence.calculation_mode ?? 'tantieme'}
          fiscalYears={(finance?.fiscal_years ?? []).map((fy) => ({ id: fy.id, name: fy.name, starts_on: fy.starts_on, ends_on: fy.ends_on }))}
          buildings={buildings}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {detailId !== null && (
        <DetailModal contributionId={detailId} onClose={() => setDetailId(null)} onPublished={() => setDetailId(detailId)} />
      )}

      <ConfirmDialog
        isOpen={publishing !== null}
        onConfirm={handlePublish}
        onCancel={() => setPublishing(null)}
        title="Publier la cotisation"
        message={`Publier « ${publishing?.name} » ? Les dus mensuels seront générés et la cotisation sera verrouillée.`}
        confirmLabel="Publier"
      />
      <ConfirmDialog
        isOpen={deleting !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        title="Supprimer le brouillon"
        message={`Supprimer « ${deleting?.name} » ? Seuls les brouillons peuvent être supprimés.`}
        confirmLabel="Supprimer"
        isDestructive
      />
    </motion.div>
  );
}

function extractMessage(err: unknown): string {
  const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
  if (!resp) return 'Une erreur est survenue.';
  if (resp.errors) return Object.values(resp.errors).flat().join(' ');
  return resp.message ?? 'Une erreur est survenue.';
}

/* ------------------------------ Create modal ------------------------------ */

function CreateModal({ residenceId, financeModes, defaultMode, fiscalYears, buildings, onClose }: {
  residenceId: number;
  financeModes: { value: string; label: string }[];
  defaultMode: string;
  fiscalYears: { id: number; name: string; starts_on: string; ends_on: string }[];
  buildings: { id: number; number: string }[];
  onClose: () => void;
}) {
  const createMutation = useCreateContribution();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('syndic');
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [mode, setMode] = useState(defaultMode);
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [annualBudget, setAnnualBudget] = useState('');
  const [appliesToAll, setAppliesToAll] = useState(true);
  const [buildingIds, setBuildingIds] = useState<number[]>([]);
  const [rates, setRates] = useState<ContributionFixedRate[]>([
    { lot_type: 'apartment', min_surface: null, max_surface: null, monthly_amount: 0 },
  ]);

  const pickFiscalYear = (id: string) => {
    setFiscalYearId(id);
    const fy = fiscalYears.find((f) => String(f.id) === id);
    if (fy) {
      setStartsOn(fy.starts_on.slice(0, 10));
      setEndsOn(fy.ends_on.slice(0, 10));
    }
  };

  const toggleBuilding = (id: number) =>
    setBuildingIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));

  const updateRate = (i: number, patch: Partial<ContributionFixedRate>) =>
    setRates((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const handleSave = async () => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        residenceId,
        type,
        name: name.trim(),
        fiscal_year_id: fiscalYearId !== '' ? Number(fiscalYearId) : null,
        starts_on: startsOn,
        ends_on: endsOn,
        calculation_mode: mode,
        annual_budget: mode === 'tantieme' ? (annualBudget !== '' ? Number(annualBudget) : null) : null,
        applies_to_all_buildings: type === 'syndic' ? true : appliesToAll,
        building_ids: type === 'exceptionnelle' && !appliesToAll ? buildingIds : undefined,
        fixed_rates: mode === 'tantieme'
          ? undefined
          : rates.map((r) => ({
            lot_type: mode === 'per_surface' ? null : r.lot_type,
            min_surface: r.min_surface ?? null,
            max_surface: r.max_surface ?? null,
            monthly_amount: Number(r.monthly_amount),
          })),
      });
      onClose();
    } catch (err: unknown) {
      setServerError(extractMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none';

  return (
    <Modal
      isOpen onClose={onClose} title="Nouvelle cotisation" size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Annuler</button>
          <button onClick={handleSave} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
            {isSubmitting ? 'Création...' : 'Créer le brouillon'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {serverError && <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{serverError}</div>}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nom" required>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cotisation 2026" className={inputCls} />
          </FormField>
          <FormField label="Type" required>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option value="syndic">Standard (syndic)</option>
              <option value="exceptionnelle">Exceptionnelle</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Exercice (optionnel)">
            <select value={fiscalYearId} onChange={(e) => pickFiscalYear(e.target.value)} className={inputCls}>
              <option value="">—</option>
              {fiscalYears.map((fy) => <option key={fy.id} value={fy.id}>{fy.name}</option>)}
            </select>
          </FormField>
          <FormField label="Début" required>
            <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className={inputCls} />
          </FormField>
          <FormField label="Fin" required>
            <input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className={inputCls} />
          </FormField>
        </div>

        <div>
          <span className="block text-sm font-medium text-text-primary mb-2">Mode de calcul</span>
          <div className="grid sm:grid-cols-3 gap-2">
            {(financeModes.length ? financeModes : [
              { value: 'fixed', label: 'Forfaitaire' },
              { value: 'per_surface', label: 'Par surface' },
              { value: 'tantieme', label: 'Tantièmes' },
            ]).map((m) => (
              <label key={m.value} className={`cursor-pointer border rounded-lg p-3 text-sm transition-colors ${mode === m.value ? 'border-brand-600 bg-brand-50' : 'border-surface-200 hover:border-brand-300'}`}>
                <input type="radio" name="mode" value={m.value} checked={mode === m.value} onChange={(e) => setMode(e.target.value)} className="sr-only" />
                <div className="font-semibold text-text-primary">{m.label}</div>
                <div className="text-xs text-text-muted mt-1">{MODE_DESCRIPTIONS[m.value] ?? ''}</div>
              </label>
            ))}
          </div>
        </div>

        {mode === 'tantieme' ? (
          <FormField label="Budget annuel (MAD)" required>
            <input type="number" min={0} step="0.01" value={annualBudget} onChange={(e) => setAnnualBudget(e.target.value)} placeholder="120000" className={inputCls} />
          </FormField>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">Grille forfaitaire (mensuel par type de lot)</span>
              <button
                onClick={() => setRates([...rates, { lot_type: 'apartment', min_surface: null, max_surface: null, monthly_amount: 0 }])}
                className="text-xs text-brand-600 hover:underline"
              >
                + Ajouter une ligne
              </button>
            </div>
            <div className="space-y-2">
              {rates.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  {mode === 'fixed' ? (
                    <select value={r.lot_type ?? 'apartment'} onChange={(e) => updateRate(i, { lot_type: e.target.value })} className="col-span-4 px-2 py-2 border border-surface-300 rounded-lg text-sm outline-none">
                      {LOT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  ) : (
                    <span className="col-span-4 px-2 py-2 text-sm text-text-muted">Toutes typologies</span>
                  )}
                  <input type="number" min={0} placeholder="Surf. min" value={r.min_surface ?? ''} onChange={(e) => updateRate(i, { min_surface: e.target.value === '' ? null : Number(e.target.value) })} className="col-span-2 px-2 py-2 border border-surface-300 rounded-lg text-sm outline-none" />
                  <input type="number" min={0} placeholder="Surf. max" value={r.max_surface ?? ''} onChange={(e) => updateRate(i, { max_surface: e.target.value === '' ? null : Number(e.target.value) })} className="col-span-2 px-2 py-2 border border-surface-300 rounded-lg text-sm outline-none" />
                  <input type="number" min={0} step="0.01" placeholder="MAD/mois" value={r.monthly_amount} onChange={(e) => updateRate(i, { monthly_amount: Number(e.target.value) })} className="col-span-3 px-2 py-2 border border-surface-300 rounded-lg text-sm outline-none" />
                  <button onClick={() => setRates(rates.filter((_, idx) => idx !== i))} disabled={rates.length <= 1} className="col-span-1 p-2 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger disabled:opacity-30" aria-label="Retirer">×</button>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {mode === 'fixed'
                ? 'Chaque lot doit correspondre à exactement une ligne (type + tranche de surface).'
                : 'Ex : <100 m² → 300 MAD, 100–200 m² → 400 MAD, >200 m² → 500 MAD. Les tranches ne doivent ni se chevaucher ni laisser de trou.'}
            </p>
          </div>
        )}

        {type === 'exceptionnelle' && (
          <div>
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input type="checkbox" checked={appliesToAll} onChange={(e) => setAppliesToAll(e.target.checked)} className="accent-brand-600" />
              S’applique à tous les bâtiments
            </label>
            {!appliesToAll && (
              <div className="flex flex-wrap gap-2 mt-2">
                {buildings.length === 0 && <span className="text-xs text-text-muted">Aucun bâtiment trouvé (importez des lots).</span>}
                {buildings.map((b) => (
                  <label key={b.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${buildingIds.includes(b.id) ? 'border-brand-600 bg-brand-50' : 'border-surface-300'}`}>
                    <input type="checkbox" checked={buildingIds.includes(b.id)} onChange={() => toggleBuilding(b.id)} className="accent-brand-600" />
                    {b.number}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------ Detail modal ------------------------------ */

function DetailModal({ contributionId, onClose, onPublished }: {
  contributionId: number;
  onClose: () => void;
  onPublished: () => void;
}) {
  const { data: contribution, isLoading } = useContribution(contributionId);
  const { data: preview, isLoading: previewLoading, refetch: refetchPreview } = useContributionPreview(contributionId);
  const publishMutation = usePublishContribution();
  const [serverError, setServerError] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!contribution) return;
    setServerError(null);
    try {
      await publishMutation.mutateAsync(contribution.id);
      refetchPreview();
      onPublished();
    } catch (err: unknown) {
      setServerError(extractMessage(err));
    }
  };

  return (
    <Modal
      isOpen onClose={onClose}
      title={contribution ? contribution.name : 'Cotisation'}
      size="lg"
      footer={<button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Fermer</button>}
    >
      {isLoading || !contribution ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-surface-100 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {serverError && <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{serverError}</div>}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              { label: 'Type', value: contribution.type_label },
              { label: 'Mode', value: contribution.calculation_mode_label },
              { label: 'Statut', value: contribution.status_label },
              { label: 'Budget annuel', value: fmtMoney(contribution.annual_budget) },
            ].map((s) => (
              <div key={s.label} className="p-3 bg-surface-50 rounded-lg">
                <div className="text-sm font-bold text-text-primary">{s.value}</div>
                <div className="text-xs text-text-muted">{s.label}</div>
              </div>
            ))}
          </div>

          {contribution.calculation_mode !== 'tantieme' && !!contribution.fixed_rates?.length && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Grille forfaitaire</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted">
                    <th className="px-3 py-1.5 text-left font-medium">Type de lot</th>
                    <th className="px-3 py-1.5 text-right font-medium">Surface min</th>
                    <th className="px-3 py-1.5 text-right font-medium">Surface max</th>
                    <th className="px-3 py-1.5 text-right font-medium">MAD / mois</th>
                  </tr>
                </thead>
                <tbody>
                  {contribution.fixed_rates.map((r, i) => (
                    <tr key={i} className="border-t border-surface-100">
                      <td className="px-3 py-1.5">{r.lot_type ? (LOT_TYPES.find((t) => t.value === r.lot_type)?.label ?? r.lot_type) : 'Toutes typologies'}</td>
                      <td className="px-3 py-1.5 text-right">{r.min_surface ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right">{r.max_surface ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fmtMoney(r.monthly_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-text-primary">Aperçu par lot</h4>
              {preview && (
                <span className="text-sm text-text-secondary">
                  Total annuel : <strong className="font-mono">{fmtMoney(preview.annual_total)}</strong>
                  {' '}· mensuel : <strong className="font-mono">{fmtMoney(preview.monthly_total)}</strong>
                </span>
              )}
            </div>
            {previewLoading ? (
              <div className="h-24 bg-surface-100 rounded-lg animate-pulse" />
            ) : !preview?.rows.length ? (
              <p className="text-sm text-text-muted">Aucun lot concerné.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto border border-surface-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-surface-50 sticky top-0">
                    <tr className="text-text-muted">
                      <th className="px-3 py-1.5 text-left font-medium">Lot</th>
                      <th className="px-3 py-1.5 text-left font-medium">Type</th>
                      <th className="px-3 py-1.5 text-right font-medium">Annuel</th>
                      <th className="px-3 py-1.5 text-right font-medium">Mensuel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r) => (
                      <tr key={r.lot_id} className="border-t border-surface-100">
                        <td className="px-3 py-1.5 font-medium">{r.building ? `${r.building} — ` : ''}{r.number}</td>
                        <td className="px-3 py-1.5 text-text-muted">{r.type_label}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fmtMoney(r.annual)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fmtMoney(r.monthly)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!!preview?.warnings.length && (
              <ul className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-0.5">
                {preview.warnings.map((w, i) => <li key={i}>• {w}</li>)}
              </ul>
            )}
          </div>

          {contribution.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {publishMutation.isPending ? 'Publication...' : 'Publier : générer les dus mensuels'}
            </button>
          )}
          {contribution.status === 'published' && (
            <p className="text-xs text-text-muted text-center">
              Publiée{contribution.published_at ? ` le ${contribution.published_at}` : ''} — les montants sont figés (snapshots).
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
