import { useState, useMemo, lazy, Suspense, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { usePeriodes, useBudgetSummary, useCreatePeriode, useUpdateBudget } from '@/hooks/useBudget';
import { useDepenses } from '@/hooks/useDepenses';
import { useHorsBudgets } from '@/hooks/useHorsBudgets';
import { PeriodeTabs } from '@/components/budget/PeriodeTabs';
import { BudgetAlertBanner } from '@/components/budget/BudgetAlertBanner';

const preloadBudgetSummaryCards = () => import('@/components/budget/BudgetSummaryCards');
const preloadBudgetTable = () => import('@/components/budget/BudgetTable');
const BudgetSummaryCards = lazy(() => preloadBudgetSummaryCards().then(m => ({ default: m.BudgetSummaryCards })));
const BudgetTable = lazy(() => preloadBudgetTable().then(m => ({ default: m.BudgetTable })));
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';


const preloadDepenseFormModal = () => import('@/components/charges/DepenseFormModal');
const DepenseFormModal = lazy(() => preloadDepenseFormModal().then(m => ({ default: m.DepenseFormModal })));

const preloadDepenseSidePanel = () => import('@/components/charges/DepenseSidePanel');
const DepenseSidePanel = lazy(() => preloadDepenseSidePanel().then(m => ({ default: m.DepenseSidePanel })));
const preloadHorsBudgetSection = () => import('@/components/budget/HorsBudgetSection');
const HorsBudgetSection = lazy(() => preloadHorsBudgetSection().then(m => ({ default: m.HorsBudgetSection })));
import { ErrorState } from '@/components/ui/ErrorState';
import type { Depense } from '@/types/entities.types';

export default function BudgetPage() {
  const { activeResidence } = useResidenceStore();
  const residenceId = activeResidence?.id ?? 0;

  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number | null>(null);
  const [showNewPeriodeModal, setShowNewPeriodeModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{ id: number; label: string; value: number } | null>(null);

  const [panelSousChargeId, setPanelSousChargeId] = useState<number | null>(null);
  const [panelSousChargeNom, setPanelSousChargeNom] = useState('');
  const [panelCompteChargeId, setPanelCompteChargeId] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showDepenseForm, setShowDepenseForm] = useState(false);

  const { data: periodes, isError: periodesError, refetch: periodesRefetch } = usePeriodes(residenceId);

  const periodesList = useMemo(() => periodes ?? [], [periodes]);

  const effectivePeriodeId = useMemo(() => {
    if (selectedPeriodeId) return selectedPeriodeId;
    const active = periodesList.find((p) => p.is_active);
    return active?.id ?? periodesList[0]?.id ?? null;
  }, [selectedPeriodeId, periodesList]);

  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: summaryRefetch } = useBudgetSummary(effectivePeriodeId ?? 0);
  const { data: panelDepenses, isLoading: panelLoading } = useDepenses(residenceId, {
    sous_charge_id: panelSousChargeId ?? undefined,
    per_page: 50,
  });
  const { data: horsBudgetsData, isLoading: hbLoading } = useHorsBudgets(residenceId);
  const createPeriode = useCreatePeriode();
  const updateBudget = useUpdateBudget();

  const horsBudgetsList = useMemo(() => horsBudgetsData?.data ?? [], [horsBudgetsData]);
  const panelDepensesList = useMemo(() => (panelDepenses?.data ?? []) as Depense[], [panelDepenses]);

  const activePeriode = useMemo(() => {
    if (!effectivePeriodeId) return null;
    return periodesList.find((p) => p.id === effectivePeriodeId) ?? null;
  }, [effectivePeriodeId, periodesList]);

  const depasseCount = useMemo(
    () => summary?.par_compte.filter((c) => c.est_depasse).length ?? 0,
    [summary]
  );

  const handleAddExpense = useCallback((compteChargeId: number, sousChargeId?: number) => {
    setPanelCompteChargeId(compteChargeId);
    if (sousChargeId) {
      preloadDepenseSidePanel();
      const sc = summary?.par_compte
        .find((c) => c.compte_charge_id === compteChargeId)
        ?.sous_charges_detail?.find((s) => s.sous_charge.id === sousChargeId);
      setPanelSousChargeId(sousChargeId);
      setPanelSousChargeNom(sc?.sous_charge.nom ?? '');
      setPanelOpen(true);
    } else {
      preloadDepenseFormModal();
      setShowDepenseForm(true);
    }
  }, [summary]);

  const handleCreatePeriode = useCallback(async (data: { annee: number; date_debut: string; date_fin: string; is_active?: boolean }) => {
    await createPeriode.mutateAsync({ residenceId, data });
    setShowNewPeriodeModal(false);
  }, [residenceId, createPeriode]);

  const handleUpdateBudget = useCallback(async (budgetId: number, montant_prevu: number) => {
    await updateBudget.mutateAsync({ budgetId, data: { montant_prevu } });
    setEditingBudget(null);
  }, [updateBudget]);

  const handlePeriodeSelect = useCallback((id: number) => {
    preloadBudgetSummaryCards();
    preloadBudgetTable();
    setSelectedPeriodeId(id);
  }, []);

  const handleAddNewPeriode = useCallback(() => setShowNewPeriodeModal(true), []);

  const handleEditBudget = useCallback((budgetId: number, label: string, value: number) => {
    setEditingBudget({ id: budgetId, label, value });
  }, []);

  if (!activeResidence) {
    return (
      <div className="p-6">
        <PageHeader title="Budget Prévisionnel" subtitle="Sélectionnez une résidence." />
      </div>
    );
  }

  if (periodesError) {
    return (
      <div className="p-6">
        <ErrorState message="Impossible de charger les périodes." onRetry={periodesRefetch} />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="p-6">
        <ErrorState message="Impossible de charger le budget." onRetry={summaryRefetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Prévisionnel"
        subtitle={`${activeResidence.nom}${activePeriode ? ` — Exercice ${activePeriode.annee}` : ''}`}
      />

      <PeriodeTabs
        periodes={periodesList}
        selectedPeriodeId={effectivePeriodeId}
        onSelect={handlePeriodeSelect}
        onAddNew={handleAddNewPeriode}
      />

      {effectivePeriodeId ? (
        <>
          <Suspense fallback={<div className="grid grid-cols-3 gap-4"><div className="h-28 bg-surface-100 rounded-xl animate-pulse" /><div className="h-28 bg-surface-100 rounded-xl animate-pulse" /><div className="h-28 bg-surface-100 rounded-xl animate-pulse" /></div>}>
            <BudgetSummaryCards summary={summary ?? undefined} isLoading={summaryLoading} />
          </Suspense>
          {depasseCount > 0 && <BudgetAlertBanner summary={summary ?? undefined} />}

          <Suspense fallback={<div className="h-64 bg-surface-100 rounded-xl animate-pulse" />}>
            <BudgetTable
              summary={summary ?? undefined}
              isLoading={summaryLoading}
              onAddExpense={handleAddExpense}
              onEditBudget={handleEditBudget}
            />
          </Suspense>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-4 bg-warning-light/50 border-b border-warning/20 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="font-semibold text-warning-dark">Dépenses hors budget</h3>
            </div>
            <Suspense fallback={<div className="p-6 space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />))}</div>}>
              <HorsBudgetSection data={horsBudgetsList} isLoading={hbLoading} />
            </Suspense>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <p className="text-text-muted">Sélectionnez une période pour voir le budget.</p>
        </div>
      )}

      <Modal
        isOpen={showNewPeriodeModal}
        onClose={() => setShowNewPeriodeModal(false)}
        title="Nouvelle période"
        size="sm"
      >
        <NewPeriodeForm
          onSubmit={handleCreatePeriode}
          onCancel={() => setShowNewPeriodeModal(false)}
          isLoading={createPeriode.isPending}
        />
      </Modal>

      <Modal
        isOpen={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        title={`Modifier le budget — ${editingBudget?.label ?? ''}`}
        size="sm"
      >
        {editingBudget && (
          <EditBudgetForm
            currentValue={editingBudget.value}
            onSubmit={(v) => handleUpdateBudget(editingBudget.id, v)}
            onCancel={() => setEditingBudget(null)}
            isLoading={updateBudget.isPending}
          />
        )}
      </Modal>

      {panelSousChargeId && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 z-50">
            <div className="absolute right-0 top-0 h-full w-[480px] bg-white p-6 shadow-xl animate-pulse">
              <div className="h-6 bg-surface-200 rounded w-1/2 mb-6" />
              <div className="space-y-3">
                <div className="h-10 bg-surface-200 rounded" />
                <div className="h-10 bg-surface-200 rounded" />
                <div className="h-10 bg-surface-200 rounded" />
              </div>
            </div>
          </div>
        }>
          <DepenseSidePanel
            isOpen={panelOpen}
            onClose={() => { setPanelOpen(false); setPanelSousChargeId(null); }}
            sousChargeNom={panelSousChargeNom}
            depenses={panelDepensesList}
            isLoading={panelLoading}
            onAdd={() => setShowDepenseForm(true)}
          />
        </Suspense>
      )}

      {showDepenseForm && panelCompteChargeId && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent mx-auto" />
            </div>
          </div>
        }>
          <DepenseFormModal
            isOpen={showDepenseForm}
            onClose={() => setShowDepenseForm(false)}
            onSubmit={async () => {}}
            comptesCharges={
              summary?.par_compte
                .filter((c) => c.compte_charge_id === panelCompteChargeId)
                .map((c) => ({
                  id: c.compte_charge_id,
                  nom: c.compte_charge.nom,
                  sous_charges: (c.sous_charges_detail ?? []).map((sc) => ({
                    id: sc.sous_charge.id,
                    nom: sc.sous_charge.nom,
                    compte_charge_id: c.compte_charge_id,
                  })),
                })) ?? []
            }
            mode="depense"
          />
        </Suspense>
      )}
    </div>
  );
}

function NewPeriodeForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: { annee: number; date_debut: string; date_fin: string; is_active?: boolean }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [actif, setActif] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!annee || !dateDebut || !dateFin) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    setError('');
    await onSubmit({
      annee: parseInt(annee, 10),
      date_debut: dateDebut,
      date_fin: dateFin,
      is_active: actif,
    });
  };

  return (
    <div className="space-y-4">
      <FormField label="Année" required error={error}>
        <input
          type="number"
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          min={2020}
          max={2100}
          className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Date début" required error={error}>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
          />
        </FormField>
        <FormField label="Date fin" required error={error}>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
          />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
          className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-text-primary">Définir comme période active</span>
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button onClick={handleSubmit} isLoading={isLoading}>Créer</Button>
      </div>
    </div>
  );
}

function EditBudgetForm({
  currentValue,
  onSubmit,
  onCancel,
  isLoading,
}: {
  currentValue: number;
  onSubmit: (value: number) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [value, setValue] = useState(currentValue.toString());

  const handleSubmit = async () => {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num < 0) return;
    await onSubmit(num);
  };

  return (
    <div className="space-y-4">
      <FormField label="Montant prévu (DH)" required>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ''))}
          className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-mono text-right"
        />
      </FormField>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button onClick={handleSubmit} isLoading={isLoading}>Enregistrer</Button>
      </div>
    </div>
  );
}
