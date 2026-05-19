import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Download, Clock } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EnregistrerPaiementModal } from '@/components/paiement/EnregistrerPaiementModal';
import { usePaiements, useEnregistrerPaiement, useTotalPercu } from '@/hooks/usePaiements';
import { useCoproprietaires } from '@/hooks/useCoproprietaires';
import { formatCurrency } from '@/utils/formatCurrency';
import { useUIStore } from '@/store/uiStore';
import { ErrorState } from '@/components/ui/ErrorState';

export default function PaiementsPage() {
  const activeResidence = useResidenceStore((s) => s.activeResidence);
  const addToast = useUIStore((s) => s.addToast);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    date_debut: '',
    date_fin: '',
    coproprietaire_id: undefined as number | undefined,
  });

  const { data: coproprietairesData } = useCoproprietaires({ residence_id: activeResidence?.id ?? 0 });
  const { data: paiementsData, isLoading, isError: paiementsError, refetch } = usePaiements(activeResidence?.id ?? 0, { ...filters, page });
  const { data: totalPercu } = useTotalPercu(activeResidence?.id ?? 0);
  const createPaiement = useEnregistrerPaiement();

  const handleSubmitPaiement = async (data: {
    cotisation_detail_id: number;
    date_paiement: string;
    montant: number;
    mode_paiement: 'especes' | 'virement' | 'cheque' | 'carte';
    reference?: string;
  }) => {
    try {
      await createPaiement.mutateAsync(data);
      addToast('success', 'Paiement enregistré avec succès. Le reçu est en cours de génération.');
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      addToast('error', 'Erreur lors de l\'enregistrement du paiement.');
    }
  };

  const handleDownloadRecu = async (paiementId: number) => {
    window.open(`/api/syndic/paiements/${paiementId}/download-recu`, '_blank');
  };

  const columns = [
    {
      key: 'date_paiement',
      label: 'Date',
      sortable: true,
    },
    {
      key: 'coproprietaires',
      label: 'Copropriétaire',
      render: (row: any) => row.coproprietaire?.name ?? '—',
    },
    {
      key: 'appartement',
      label: 'Appartement',
      render: (row: any) => {
        const detail = row.cotisation_detail;
        const appartement = detail?.appartement;
        return appartement ? `${appartement.numero}` : '—';
      },
    },
    {
      key: 'cotisation',
      label: 'Cotisation',
      render: (row: any) => row.cotisation_detail?.cotisation?.label ?? '—',
    },
    {
      key: 'montant',
      label: 'Montant',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-semibold text-text-primary">
          {formatCurrency(row.montant)}
        </span>
      ),
    },
    {
      key: 'mode_paiement',
      label: 'Mode',
      render: (row: any) => row.mode_paiement_label ?? '—',
    },
    {
      key: 'reference',
      label: 'Référence',
      render: (row: any) => row.reference ?? '—',
    },
    {
      key: 'recu',
      label: 'Reçu',
      render: (row: any) => (
        row.has_recu ? (
          <button
            onClick={() => handleDownloadRecu(row.id)}
            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
          >
            <FileText className="w-4 h-4" />
            <span>Télécharger</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-text-muted">
            <Clock className="w-4 h-4" />
            <span>En cours</span>
          </span>
        )
      ),
    },
  ];

  if (!activeResidence) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-text-primary">Paiements</h1>
        <p className="text-text-muted mt-4">Veuillez sélectionner une résidence.</p>
      </div>
    );
  }

  if (paiementsError) {
    return (
      <div className="p-8">
        <ErrorState message="Impossible de charger les paiements." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Paiements"
        subtitle={activeResidence.nom}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Enregistrer un paiement
          </button>
        }
      />

      {(filters.date_debut || filters.date_fin || filters.coproprietaire_id) && totalPercu && (
        <div className="mb-6 p-4 bg-surface-50 rounded-lg">
          <div className="text-sm text-text-muted">Total perçu sur la période</div>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(totalPercu.total_percu)}
          </div>
          <div className="text-sm text-text-muted">
            {totalPercu.nb_paiements} paiement{totalPercu.nb_paiements !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-4 flex-wrap">
        <input
          type="date"
          value={filters.date_debut}
          onChange={(e) => { setFilters({ ...filters, date_debut: e.target.value }); setPage(1); }}
          className="px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          placeholder="Date début"
        />
        <input
          type="date"
          value={filters.date_fin}
          onChange={(e) => { setFilters({ ...filters, date_fin: e.target.value }); setPage(1); }}
          className="px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          placeholder="Date fin"
        />
        <select
          value={filters.coproprietaire_id ?? ''}
          onChange={(e) => setFilters({ ...filters, coproprietaire_id: e.target.value ? Number(e.target.value) : undefined })}
          className="px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Tous les copropriétaires</option>
          {coproprietairesData?.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {(filters.date_debut || filters.date_fin || filters.coproprietaire_id) && (
          <button
            onClick={() => { setFilters({ date_debut: '', date_fin: '', coproprietaire_id: undefined }); setPage(1); }}
            className="px-3 py-2 text-brand-600 hover:text-brand-700"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} />
      ) : paiementsData?.data && paiementsData.data.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DataTable
            columns={columns}
            data={paiementsData.data}
            getRowKey={(row) => row.id}
            pagination={{
              page: paiementsData.meta.current_page,
              perPage: paiementsData.meta.per_page,
              total: paiementsData.meta.total,
              onPageChange: setPage,
            }}
          />
        </motion.div>
      ) : (
        <EmptyState
          title="Aucun paiement enregistré"
          description="Les paiements apparaîtront ici une fois enregistrés."
          action={{
            label: 'Enregistrer un paiement',
            onClick: () => setIsModalOpen(true),
          }}
        />
      )}

      <EnregistrerPaiementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitPaiement}
        residenceId={activeResidence.id}
      />
    </div>
  );
}