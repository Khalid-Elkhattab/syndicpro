import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, CreditCard, Download, Search } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { usePeriodes, useBudgetSummary } from '@/hooks/useBudget';
import { useRapportBudget, useRapportImpayes, useRapportPaiements } from '@/hooks/useRapports';
import { PeriodeTabs } from '@/components/budget/PeriodeTabs';
import { BudgetSummaryCards } from '@/components/budget/BudgetSummaryCards';
import { BudgetTable } from '@/components/budget/BudgetTable';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { ErrorState } from '@/components/ui/ErrorState';
import type { CotisationDetail, Paiement } from '@/types/entities.types';

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
  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: summaryRefetch } = useBudgetSummary(selectedPeriodeId ?? 0);
  const { data: rapportBudget, isLoading: rapportBudgetLoading, isError: rapportBudgetError, refetch: rapportBudgetRefetch } = useRapportBudget(residenceId, selectedPeriodeId ?? undefined);

  const periodesList = useMemo(() => periodes ?? [], [periodes]);

  const activePeriode = useMemo(() => {
    if (selectedPeriodeId) return periodesList.find((p) => p.id === selectedPeriodeId);
    const active = periodesList.find((p) => p.is_active);
    if (active) {
      setSelectedPeriodeId(active.id);
      return active;
    }
    if (periodesList.length > 0) {
      setSelectedPeriodeId(periodesList[0].id);
      return periodesList[0];
    }
    return null;
  }, [selectedPeriodeId, periodesList]);

  const impayeFilters = useMemo(() => ({
    periode_id: selectedPeriodeId ?? undefined,
    statut: impayeStatut as 'non_paye' | 'partiellement_paye' | undefined,
    page: impayePage,
    per_page: 20,
  }), [selectedPeriodeId, impayeStatut, impayePage]);

  const { data: impayesData, isLoading: impayesLoading, isError: rapportImpayesError, refetch: rapportImpayesRefetch } = useRapportImpayes(residenceId, impayeFilters);

  const paiementFilters = useMemo(() => ({
    date_debut: paiementDateDebut || undefined,
    date_fin: paiementDateFin || undefined,
    periode_id: selectedPeriodeId ?? undefined,
    page: paiementPage,
    per_page: 20,
  }), [paiementDateDebut, paiementDateFin, selectedPeriodeId, paiementPage]);

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
      'Appartement': d.appartement?.numero ?? '—',
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

  const impayeColumns = [
    {
      key: 'coproprietaire',
      label: 'Copropriétaire',
      render: (row: CotisationDetail) => row.coproprietaire?.name ?? '—',
    },
    {
      key: 'appartement',
      label: 'Appartement',
      render: (row: CotisationDetail) => row.appartement?.numero ?? '—',
    },
    {
      key: 'montant',
      label: 'Montant dû',
      render: (row: CotisationDetail) => (
        <span className="font-mono">{formatCurrency(row.montant)}</span>
      ),
    },
    {
      key: 'montant_paye',
      label: 'Payé',
      render: (row: CotisationDetail) => (
        <span className="font-mono">{formatCurrency(row.montant_paye)}</span>
      ),
    },
    {
      key: 'restant',
      label: 'Restant',
      render: (row: CotisationDetail) => {
        const restant = row.montant - row.montant_paye;
        return (
          <span className={`font-mono ${restant > 0 ? 'text-danger-dark' : 'text-success-dark'}`}>
            {formatCurrency(restant)}
          </span>
        );
      },
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row: CotisationDetail) => {
        const isNonPaye = row.statut === 'non_paye';
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isNonPaye
                ? 'bg-danger-light text-danger-dark'
                : 'bg-warning-light text-warning-dark'
            }`}
          >
            {isNonPaye ? 'Non payé' : 'Partiel'}
          </span>
        );
      },
    },
  ];

  const paiementColumns = [
    {
      key: 'date_paiement',
      label: 'Date',
      render: (row: Paiement) => formatDate(row.date_paiement),
    },
    {
      key: 'coproprietaire',
      label: 'Copropriétaire',
      render: (row: Paiement) => row.coproprietaire?.name ?? '—',
    },
    {
      key: 'montant',
      label: 'Montant',
      render: (row: Paiement) => (
        <span className="font-mono font-semibold">{formatCurrency(row.montant)}</span>
      ),
    },
    {
      key: 'mode_paiement',
      label: 'Mode',
      render: (row: Paiement) => {
        const labels: Record<string, string> = {
          especes: 'Espèces',
          virement: 'Virement',
          cheque: 'Chèque',
          carte: 'Carte',
        };
        return labels[row.mode_paiement] ?? row.mode_paiement;
      },
    },
    {
      key: 'reference',
      label: 'Référence',
      render: (row: Paiement) => row.reference ?? '—',
    },
  ];

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
            selectedPeriodeId={selectedPeriodeId}
            onSelect={setSelectedPeriodeId}
          />
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-surface-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {activeTab === 'budget' && (
        <motion.div
          key="budget"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Budget Prévisionnel</h2>
            {rapportBudget && (
              <Button variant="secondary" size="sm" onClick={handleExportBudget}>
                <Download className="w-4 h-4" />
                Exporter CSV
              </Button>
            )}
          </div>
          <BudgetSummaryCards summary={summary} isLoading={summaryLoading} />
          <BudgetTable summary={summary} isLoading={summaryLoading} />
        </motion.div>
      )}

      {activeTab === 'impayes' && (
        <motion.div
          key="impayes"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Rapport Impayés</h2>
            {impayesData?.data && impayesData.data.length > 0 && (
              <Button variant="secondary" size="sm" onClick={handleExportImpayes}>
                <Download className="w-4 h-4" />
                Exporter CSV
              </Button>
            )}
          </div>

          {impayesData?.meta && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-danger-light rounded-xl shadow-card p-6">
                <p className="text-sm font-medium text-text-secondary mb-1">Total impayés</p>
                <p className="text-3xl font-bold font-mono text-danger-dark">
                  {formatCurrency(impayesData.meta.total_impaye)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-card p-6">
                <p className="text-sm font-medium text-text-secondary mb-1">Nombre de dossiers</p>
                <p className="text-3xl font-bold font-mono text-text-primary">
                  {impayesData.meta.nb_impayes}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-card p-6">
                <p className="text-sm font-medium text-text-secondary mb-1">Répartition</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <span className="inline-block w-3 h-3 rounded-full bg-danger-dark mr-1" />
                    <span className="text-sm text-text-secondary">
                      Non payés : {impayesData.meta.par_statut.non_paye}
                    </span>
                  </div>
                  <div>
                    <span className="inline-block w-3 h-3 rounded-full bg-warning-dark mr-1" />
                    <span className="text-sm text-text-secondary">
                      Partiels : {impayesData.meta.par_statut.partiellement_paye}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <select
              value={impayeStatut ?? ''}
              onChange={(e) => { setImpayeStatut(e.target.value || undefined); setImpayePage(1); }}
              className="border border-surface-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">Tous les statuts</option>
              <option value="non_paye">Non payés</option>
              <option value="partiellement_paye">Partiels</option>
            </select>
          </div>

          <DataTable
            columns={impayeColumns}
            data={impayesData?.data ?? []}
            isLoading={impayesLoading}
            getRowKey={(row: CotisationDetail) => row.id}
            pagination={impayesData?.meta ? {
              page: impayePage,
              perPage: 20,
              total: impayesData.meta.total,
              onPageChange: setImpayePage,
            } : undefined}
            emptyMessage="Aucun impayé 🎉 Tous les copropriétaires sont à jour."
          />
        </motion.div>
      )}

      {activeTab === 'paiements' && (
        <motion.div
          key="paiements"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Rapport Paiements</h2>
            {paiementsData?.data && paiementsData.data.length > 0 && (
              <Button variant="secondary" size="sm" onClick={handleExportPaiements}>
                <Download className="w-4 h-4" />
                Exporter CSV
              </Button>
            )}
          </div>

          {paiementsData?.meta && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-brand-50 rounded-xl shadow-card p-6">
                <p className="text-sm font-medium text-text-secondary mb-1">Total perçu</p>
                <p className="text-2xl font-bold font-mono text-brand-600">
                  {formatCurrency(paiementsData.meta.total_percu)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-card p-6">
                <p className="text-sm font-medium text-text-secondary mb-1">Nombre de paiements</p>
                <p className="text-2xl font-bold font-mono text-text-primary">
                  {paiementsData.meta.nb_paiements}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-card p-6">
                <p className="text-sm font-medium text-text-secondary mb-1">Dont espèces</p>
                <p className="text-xl font-bold font-mono text-success-dark">
                  {formatCurrency(paiementsData.meta.par_mode.especes)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-card p-6">
                <p className="text-sm font-medium text-text-secondary mb-1">Dont virement</p>
                <p className="text-xl font-bold font-mono text-info">
                  {formatCurrency(paiementsData.meta.par_mode.virement)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Date début</label>
              <input
                type="date"
                value={paiementDateDebut}
                onChange={(e) => { setPaiementDateDebut(e.target.value); setPaiementPage(1); }}
                className="border border-surface-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Date fin</label>
              <input
                type="date"
                value={paiementDateFin}
                onChange={(e) => { setPaiementDateFin(e.target.value); setPaiementPage(1); }}
                className="border border-surface-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            {(paiementDateDebut || paiementDateFin) && (
              <button
                onClick={() => { setPaiementDateDebut(''); setPaiementDateFin(''); setPaiementPage(1); }}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors mt-5"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <DataTable
            columns={paiementColumns}
            data={paiementsData?.data ?? []}
            isLoading={paiementsLoading}
            getRowKey={(row: Paiement) => row.id}
            pagination={paiementsData?.meta ? {
              page: paiementPage,
              perPage: 20,
              total: paiementsData.meta.total,
              onPageChange: setPaiementPage,
            } : undefined}
            emptyMessage="Aucun paiement enregistré sur cette période."
          />
        </motion.div>
      )}
    </div>
  );
}
