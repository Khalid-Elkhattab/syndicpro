import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import type { CotisationDetail } from '@/types/entities.types';

interface ImpayeMeta {
  total_impaye: number;
  nb_impayes: number;
  total: number;
  par_statut: { non_paye: number; partiellement_paye: number };
}

interface ImpayesTabProps {
  impayesData: { data: CotisationDetail[]; meta: ImpayeMeta } | undefined;
  impayesLoading: boolean;
  impayeStatut: string | undefined;
  impayePage: number;
  handleExportImpayes: () => void;
  onStatutChange: (statut: string | undefined) => void;
  onPageChange: (page: number) => void;
}

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

export default function ImpayesTab({ impayesData, impayesLoading, impayeStatut, impayePage, handleExportImpayes, onStatutChange, onPageChange }: ImpayesTabProps) {
  return (
    <>
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
          onChange={(e) => { onStatutChange(e.target.value || undefined); onPageChange(1); }}
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
          onPageChange,
        } : undefined}
        emptyMessage="Aucun impayé 🎉 Tous les copropriétaires sont à jour."
      />
    </>
  );
}
