import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { Paiement } from '@/types/entities.types';

interface PaiementMeta {
  total_percu: number;
  nb_paiements: number;
  total: number;
  par_mode: { especes: number; virement: number };
}

interface PaiementsTabProps {
  paiementsData: { data: Paiement[]; meta: PaiementMeta } | undefined;
  paiementsLoading: boolean;
  paiementDateDebut: string;
  paiementDateFin: string;
  paiementPage: number;
  handleExportPaiements: () => void;
  onDateDebutChange: (date: string) => void;
  onDateFinChange: (date: string) => void;
  onResetDates: () => void;
  onPageChange: (page: number) => void;
}

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

export default function PaiementsTab({
  paiementsData, paiementsLoading, paiementDateDebut, paiementDateFin, paiementPage,
  handleExportPaiements, onDateDebutChange, onDateFinChange, onResetDates, onPageChange,
}: PaiementsTabProps) {
  return (
    <>
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
            onChange={(e) => { onDateDebutChange(e.target.value); onPageChange(1); }}
            className="border border-surface-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Date fin</label>
          <input
            type="date"
            value={paiementDateFin}
            onChange={(e) => { onDateFinChange(e.target.value); onPageChange(1); }}
            className="border border-surface-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        {(paiementDateDebut || paiementDateFin) && (
          <button
            onClick={onResetDates}
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
          onPageChange,
        } : undefined}
        emptyMessage="Aucun paiement enregistré sur cette période."
      />
    </>
  );
}
