import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { FileText, AlertTriangle, CreditCard } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { usePeriodes, useBudgetSummary } from '@/hooks/useBudget';
import { useRapportBudget, useRapportImpayes, useRapportPaiements } from '@/hooks/useRapports';
import { PeriodeTabs } from '@/components/budget/PeriodeTabs';
import { formatDate } from '@/utils/formatDate';
import { ErrorState } from '@/components/ui/ErrorState';
import type { BudgetSummary } from '@/api/budget.api';
import type { RapportBudgetResponse } from '@/api/rapport.api';
import type { CotisationDetail, Paiement } from '@/types/entities.types';

const preloadBudgetTab = () => import('./RapportsPageBudgetTab');
const preloadImpayesTab = () => import('./RapportsPageImpayesTab');
const preloadPaiementsTab = () => import('./RapportsPagePaiementsTab');
const BudgetTab = lazy(() => preloadBudgetTab().then(m => ({ default: m.default })));
const ImpayesTab = lazy(() => preloadImpayesTab().then(m => ({ default: m.default })));
const PaiementsTab = lazy(() => preloadPaiementsTab().then(m => ({ default: m.default })));

type TabId = 'budget' | 'impayes' | 'paiements';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'budget', label: 'Budget', icon: <FileText className="w-4 h-4" /> },
  { id: 'impayes', label: 'Impayés', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'paiements', label: 'Paiements', icon: <CreditCard className="w-4 h-4" /> },
];

function downloadCSV<T extends Record<string, unknown>>(rows: T[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val == null) return '';
        const str = String(val);
        return str.includes(';') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(';')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TabFallback() {
  return <div className="h-64 bg-surface-100 rounded-xl animate-pulse" />;
}

function TabContent({ activeTab, summary, summaryLoading, rapportBudget, impayesData, impayesLoading, impayeStatut, impayePage, paiementsData, paiementsLoading, paiementDateDebut, paiementDateFin, paiementPage, handleExportBudget, handleExportImpayes, handleExportPaiements, onImpayeStatutChange, onImpayePageChange, onPaiementDateDebutChange, onPaiementDateFinChange, onPaiementPageChange }: {
  activeTab: TabId;
  summary: BudgetSummary | null;
  summaryLoading: boolean;
  rapportBudget: RapportBudgetResponse | undefined;
  impayesData: { data: CotisationDetail[]; meta: { total_impaye: number; nb_impayes: number; total: number; par_statut: { non_paye: number; partiellement_paye: number } } } | undefined;
  impayesLoading: boolean;
  impayeStatut: string | undefined;
  impayePage: number;
  paiementsData: { data: Paiement[]; meta: { total_percu: number; nb_paiements: number; total: number; par_mode: { especes: number; virement: number } } } | undefined;
  paiementsLoading: boolean;
  paiementDateDebut: string;
  paiementDateFin: string;
  paiementPage: number;
  handleExportBudget: () => void;
  handleExportImpayes: () => void;
  handleExportPaiements: () => void;
  onImpayeStatutChange: (statut: string | undefined) => void;
  onImpayePageChange: (page: number) => void;
  onPaiementDateDebutChange: (date: string) => void;
  onPaiementDateFinChange: (date: string) => void;
  onPaiementPageChange: (page: number) => void;
}) {
  const onResetDates = () => { onPaiementDateDebutChange(''); onPaiementDateFinChange(''); onPaiementPageChange(1); };

  return (
    <Suspense fallback={<TabFallback />}>
      {activeTab === 'budget' && <BudgetTab rapportBudget={rapportBudget} summary={summary} summaryLoading={summaryLoading} handleExportBudget={handleExportBudget} />}
      {activeTab === 'impayes' && <ImpayesTab impayesData={impayesData} impayesLoading={impayesLoading} impayeStatut={impayeStatut} impayePage={impayePage} handleExportImpayes={handleExportImpayes} onStatutChange={onImpayeStatutChange} onPageChange={onImpayePageChange} />}
      {activeTab === 'paiements' && <PaiementsTab paiementsData={paiementsData} paiementsLoading={paiementsLoading} paiementDateDebut={paiementDateDebut} paiementDateFin={paiementDateFin} paiementPage={paiementPage} handleExportPaiements={handleExportPaiements} onDateDebutChange={onPaiementDateDebutChange} onDateFinChange={onPaiementDateFinChange} onResetDates={onResetDates} onPageChange={onPaiementPageChange} />}
    </Suspense>
  );
}

export default function RapportsPage() {
  const { activeResidence } = useResidenceStore();
  const residenceId = activeResidence?.id ?? 0;
  const [activeTab, setActiveTab] = useState<TabId>('budget');
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number | null>(null);

  const [impayePage, setImpayePage] = useState(1);
  const [impayeStatut, setImpayeStatut] = useState<string | undefined>();
  const [paiementPage, setPaiementPage] = useState(1);
  const [paiementDateDebut, setPaiementDateDebut] = useState('');
  const [paiementDateFin, setPaiementDateFin] = useState('');

  const { data: periodes, isLoading: periodesLoading, isError: periodesError, refetch: periodesRefetch } = usePeriodes(residenceId);

  const periodesList = useMemo(() => periodes ?? [], [periodes]);

  const effectivePeriodeId = useMemo(() => {
    if (selectedPeriodeId) return selectedPeriodeId;
    const active = periodesList.find((p) => p.is_active);
    return active?.id ?? periodesList[0]?.id ?? null;
  }, [selectedPeriodeId, periodesList]);

  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: summaryRefetch } = useBudgetSummary(effectivePeriodeId ?? 0);
  const { data: rapportBudget, isError: rapportBudgetError, refetch: rapportBudgetRefetch } = useRapportBudget(residenceId, effectivePeriodeId ?? undefined);

  const activePeriode = useMemo(() => {
    if (!effectivePeriodeId) return null;
    return periodesList.find((p) => p.id === effectivePeriodeId) ?? null;
  }, [effectivePeriodeId, periodesList]);

  const impayeFilters = useMemo(() => ({
    periode_id: effectivePeriodeId ?? undefined,
    statut: impayeStatut as 'non_paye' | 'partiellement_paye' | undefined,
    page: impayePage,
    per_page: 20,
  }), [effectivePeriodeId, impayeStatut, impayePage]);

  const { data: impayesData, isLoading: impayesLoading, isError: rapportImpayesError, refetch: rapportImpayesRefetch } = useRapportImpayes(residenceId, impayeFilters);

  const paiementFilters = useMemo(() => ({
    date_debut: paiementDateDebut || undefined,
    date_fin: paiementDateFin || undefined,
    periode_id: effectivePeriodeId ?? undefined,
    page: paiementPage,
    per_page: 20,
  }), [paiementDateDebut, paiementDateFin, effectivePeriodeId, paiementPage]);

  const { data: paiementsData, isLoading: paiementsLoading, isError: rapportPaiementsError, refetch: rapportPaiementsRefetch } = useRapportPaiements(residenceId, paiementFilters);

  const handleExportBudget = useCallback(() => {
    if (!rapportBudget) return;
    const rows = rapportBudget.par_compte.map((c) => ({
      'Compte de charge': c.compte_charge.nom,
      'Budget prévu (DH)': c.montant_prevu.toFixed(2),
      'Total consommé (DH)': c.montant_consomme.toFixed(2),
      'Restant (DH)': c.montant_restant.toFixed(2),
      '% Consommé': c.pourcentage_consomme.toFixed(1),
      'Statut': c.est_depasse ? 'Dépassé' : 'OK',
    }));
    downloadCSV(rows, `rapport_budget_${activePeriode?.annee ?? 'inconnu'}.csv`);
  }, [rapportBudget, activePeriode]);

  const handleExportImpayes = useCallback(() => {
    if (!impayesData?.data) return;
    const rows = impayesData.data.map((d: CotisationDetail) => ({
      'Copropriétaire': d.coproprietaire?.name ?? '—',
      'Lot': d.appartement?.numero ?? '—',
      'Montant dû (DH)': d.montant.toFixed(2),
      'Payé (DH)': d.montant_paye.toFixed(2),
      'Restant (DH)': (d.montant - d.montant_paye).toFixed(2),
      'Statut': d.statut === 'non_paye' ? 'Non payé' : 'Partiel',
    }));
    downloadCSV(rows, `rapport_impayes_${activePeriode?.annee ?? 'inconnu'}.csv`);
  }, [impayesData, activePeriode]);

  const handleExportPaiements = useCallback(() => {
    if (!paiementsData?.data) return;
    const rows = paiementsData.data.map((p: Paiement) => ({
      'Date': formatDate(p.date_paiement),
      'Copropriétaire': p.coproprietaire?.name ?? '—',
      'Montant (DH)': p.montant.toFixed(2),
      'Mode': p.mode_paiement === 'especes' ? 'Espèces'
            : p.mode_paiement === 'virement' ? 'Virement'
            : p.mode_paiement === 'cheque' ? 'Chèque' : 'Carte',
      'Référence': p.reference ?? '—',
    }));
    downloadCSV(rows, `rapport_paiements_${activePeriode?.annee ?? 'inconnu'}.csv`);
  }, [paiementsData, activePeriode]);

  const preloadTab = (tabId: TabId) => {
    if (tabId === 'budget') preloadBudgetTab();
    else if (tabId === 'impayes') preloadImpayesTab();
    else preloadPaiementsTab();
  };

  if (!residenceId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-8">Rapports</h1>
        <div className="bg-white rounded-xl shadow-card p-8 text-center">
          <p className="text-text-muted">Veuillez sélectionner une résidence pour voir les rapports.</p>
        </div>
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
        <ErrorState message="Impossible de charger le budget summary." onRetry={summaryRefetch} />
      </div>
    );
  }

  const rapportTabError =
    (activeTab === 'budget' && rapportBudgetError) ||
    (activeTab === 'impayes' && rapportImpayesError) ||
    (activeTab === 'paiements' && rapportPaiementsError);

  const rapportTabRefetch =
    activeTab === 'budget' ? rapportBudgetRefetch :
    activeTab === 'impayes' ? rapportImpayesRefetch :
    rapportPaiementsRefetch;

  if (rapportTabError) {
    return (
      <div className="p-6">
        <ErrorState message={`Impossible de charger le rapport ${activeTab}.`} onRetry={rapportTabRefetch} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Rapports</h1>
          <p className="text-text-secondary text-sm mt-1">
            {activeResidence?.nom} — {activePeriode?.annee ?? 'Chargement...'}
          </p>
        </div>
      </div>

      {!periodesLoading && periodesList.length > 0 && (
        <div className="mb-6">
          <PeriodeTabs
            periodes={periodesList}
            selectedPeriodeId={effectivePeriodeId}
            onSelect={setSelectedPeriodeId}
          />
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-surface-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onMouseEnter={() => preloadTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <TabContent activeTab={activeTab} summary={summary ?? null} summaryLoading={summaryLoading}
        rapportBudget={rapportBudget}
        impayesData={impayesData} impayesLoading={impayesLoading}
        impayeStatut={impayeStatut} impayePage={impayePage}
        paiementsData={paiementsData} paiementsLoading={paiementsLoading}
        paiementDateDebut={paiementDateDebut} paiementDateFin={paiementDateFin} paiementPage={paiementPage}
        handleExportBudget={handleExportBudget} handleExportImpayes={handleExportImpayes} handleExportPaiements={handleExportPaiements}
        onImpayeStatutChange={(s) => setImpayeStatut(s)} onImpayePageChange={setImpayePage}
        onPaiementDateDebutChange={setPaiementDateDebut} onPaiementDateFinChange={setPaiementDateFin}
        onPaiementPageChange={setPaiementPage}
      />
    </div>
  );
}
