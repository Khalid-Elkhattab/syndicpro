import { useState, useMemo, lazy, Suspense } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useUIStore } from '@/store/uiStore';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useCompteCharges,
  useCreateCompteCharge,
  useUpdateCompteCharge,
  useDeleteCompteCharge,
  useSousChargesByResidence,
  useCreateSousCharge,
  useUpdateSousCharge,
  useDeleteSousCharge,
} from '@/hooks/useCharges';
import { useDepenses, useCreateDepense, useUpdateDepense, useDeleteDepense } from '@/hooks/useDepenses';
import { useHorsBudgets, useCreateHorsBudget, useUpdateHorsBudget, useDeleteHorsBudget } from '@/hooks/useHorsBudgets';
import { ErrorState } from '@/components/ui/ErrorState';

const preloadDepenseFormModal = () => import('@/components/charges/DepenseFormModal');
const DepenseFormModal = lazy(() => preloadDepenseFormModal().then(m => ({ default: m.DepenseFormModal })));
const preloadDepensesTab = () => import('./ChargesDepensesDepensesTab');
const preloadHorsBudgetTab = () => import('./ChargesDepensesHorsBudgetTab');
const DepensesTab = lazy(() => preloadDepensesTab().then(m => ({ default: m.default })));
const HorsBudgetTab = lazy(() => preloadHorsBudgetTab().then(m => ({ default: m.default })));
import type { CompteCharge, SousCharge, Depense, HorsBudget } from '@/types/entities.types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const tabs = [
  { id: 'comptes', label: 'Comptes Charges' },
  { id: 'sousCharges', label: 'Sous-Charges' },
  { id: 'depenses', label: 'Dépenses' },
  { id: 'horsBudget', label: 'Hors Budget' },
] as const;

type TabId = (typeof tabs)[number]['id'];


export default function ChargesDepensesPage() {
  const activeResidence = useResidenceStore((s) => s.activeResidence);
  const [activeTab, setActiveTab] = useState<TabId>('comptes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedCompteCharge, setSelectedCompteCharge] = useState<CompteCharge | null>(null);
  const [selectedSousCharge, setSelectedSousCharge] = useState<SousCharge | null>(null);
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
  const [selectedHorsBudget, setSelectedHorsBudget] = useState<HorsBudget | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: string; id: number; label: string }>({
    open: false,
    type: '',
    id: 0,
    label: '',
  });
  const [depensePage, setDepensePage] = useState(1);
  const [hbPage, setHbPage] = useState(1);
  const [filterCompteCharge, setFilterCompteCharge] = useState<number | null>(null);
  const [filterCompteChargeDepenses, setFilterCompteChargeDepenses] = useState<number | null>(null);
  const [depenseDateDebut, setDepenseDateDebut] = useState('');
  const [depenseDateFin, setDepenseDateFin] = useState('');
  const [hbDateDebut, setHbDateDebut] = useState('');
  const [hbDateFin, setHbDateFin] = useState('');
  const addToast = useUIStore((s) => s.addToast);

  const residenceId = activeResidence?.id ?? 0;

  const { data: compteCharges = [], isLoading: loadingComptes, isError: compteChargesError, refetch: compteChargesRefetch } = useCompteCharges(residenceId);
  const { data: sousChargesAll = [] } = useSousChargesByResidence(residenceId);
  const { data: depensesResult, isLoading: loadingDepenses, isError: depensesError, refetch: depensesRefetch } = useDepenses(residenceId, {
    compte_charge_id: filterCompteChargeDepenses ?? undefined,
    date_debut: depenseDateDebut || undefined,
    date_fin: depenseDateFin || undefined,
    page: depensePage,
  });
  const depensesData = depensesResult?.data ?? [];
  const depensesMeta = depensesResult?.meta;
  const { data: horsBudgetsResult, isLoading: loadingHorsBudgets, isError: horsBudgetsError, refetch: horsBudgetsRefetch } = useHorsBudgets(residenceId, {
    date_debut: hbDateDebut || undefined,
    date_fin: hbDateFin || undefined,
    page: hbPage,
  });
  const horsBudgetsData = horsBudgetsResult?.data ?? [];
  const horsBudgetsMeta = horsBudgetsResult?.meta;

  const createCompteCharge = useCreateCompteCharge();
  const updateCompteCharge = useUpdateCompteCharge();
  const deleteCompteCharge = useDeleteCompteCharge();
  const createSousCharge = useCreateSousCharge();
  const updateSousCharge = useUpdateSousCharge();
  const deleteSousCharge = useDeleteSousCharge();
  const createDepense = useCreateDepense();
  const updateDepense = useUpdateDepense();
  const deleteDepense = useDeleteDepense();
  const createHorsBudget = useCreateHorsBudget();
  const updateHorsBudget = useUpdateHorsBudget();
  const deleteHorsBudget = useDeleteHorsBudget();

  const filteredSousCharges = useMemo(() => {
    if (!filterCompteCharge) return sousChargesAll;
    return sousChargesAll.filter((sc) => sc.compte_charge_id === filterCompteCharge);
  }, [sousChargesAll, filterCompteCharge]);

  const comptesWithSousCharges = useMemo(() => {
    return compteCharges.map((cc) => ({
      ...cc,
      sous_charges: sousChargesAll.filter((sc) => sc.compte_charge_id === cc.id),
    }));
  }, [compteCharges, sousChargesAll]);

  const openCreateModal = (type: string) => {
    if (type === 'depenses' || type === 'horsBudget') preloadDepenseFormModal();
    setModalType('create');
    setSelectedCompteCharge(null);
    setSelectedSousCharge(null);
    setSelectedDepense(null);
    setSelectedHorsBudget(null);
    setIsModalOpen(true);
  };

  const openEditModal = (
    type: string,
    item:
      | CompteCharge
      | SousCharge
      | Depense
      | HorsBudget
  ) => {
    setModalType('edit');
    if (type === 'comptes') {
      setSelectedCompteCharge(item as CompteCharge);
    } else if (type === 'sousCharges') {
      setSelectedSousCharge(item as SousCharge);
    } else if (type === 'depenses') {
      setSelectedDepense(item as Depense);
    } else {
      setSelectedHorsBudget(item as HorsBudget);
    }
    setIsModalOpen(true);
  };

  const confirmDelete = (type: string, id: number, label: string, extra?: string) => {
    setDeleteConfirm({ open: true, type, id, label: extra ? `${label} (${extra})` : label });
  };

  const handleDelete = async () => {
    try {
      const { type, id } = deleteConfirm;
      if (type === 'comptes') {
        await deleteCompteCharge.mutateAsync({ residenceId, id });
      } else if (type === 'sousCharges') {
        const sc = sousChargesAll.find((s) => s.id === id);
        await deleteSousCharge.mutateAsync({
          compteChargeId: sc?.compte_charge_id ?? 0,
          id,
          residenceId,
        });
      } else if (type === 'depenses') {
        await deleteDepense.mutateAsync({ residenceId, id });
      } else {
        await deleteHorsBudget.mutateAsync({ residenceId, id });
      }
      setDeleteConfirm({ open: false, type: '', id: 0, label: '' });
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Erreur lors de la suppression.';
      addToast('error', msg);
      setDeleteConfirm({ open: false, type: '', id: 0, label: '' });
    }
  };

  const handleToggleActif = async (cc: CompteCharge) => {
    await updateCompteCharge.mutateAsync({
      residenceId,
      id: cc.id,
      is_active: !cc.is_active,
    });
  };

  const handleSubmitCompteCharge = async (data: { nom: string; description?: string }) => {
    if (modalType === 'create') {
      await createCompteCharge.mutateAsync({ residenceId, ...data });
    } else if (selectedCompteCharge) {
      await updateCompteCharge.mutateAsync({ residenceId, id: selectedCompteCharge.id, ...data });
    }
    setIsModalOpen(false);
  };

  const handleSubmitSousCharge = async (data: { nom: string; description?: string; compte_charge_id: number }) => {
    if (modalType === 'create') {
      await createSousCharge.mutateAsync({ compteChargeId: data.compte_charge_id, residenceId, nom: data.nom, description: data.description });
    } else if (selectedSousCharge) {
      await updateSousCharge.mutateAsync({
        compteChargeId: selectedSousCharge.compte_charge_id,
        id: selectedSousCharge.id,
        residenceId,
        nom: data.nom,
        description: data.description,
      });
    }
    setIsModalOpen(false);
  };

  const handleSubmitDepense = async (formData: FormData) => {
    if (modalType === 'create') {
      await createDepense.mutateAsync({ residenceId, formData });
    } else if (selectedDepense) {
      const payload: Record<string, string | number> = {};
      formData.forEach((v, k) => { payload[k] = v instanceof File ? '' : (typeof v === 'string' ? v : String(v)); });
      await updateDepense.mutateAsync({ residenceId, id: selectedDepense.id, data: payload as { date?: string; montant?: number; description?: string } });
    }
    setIsModalOpen(false);
  };

  const handleSubmitHorsBudget = async (formData: FormData) => {
    if (modalType === 'create') {
      await createHorsBudget.mutateAsync({ residenceId, formData });
    } else if (selectedHorsBudget) {
      const payload: Record<string, string | number> = {};
      formData.forEach((v, k) => { payload[k] = v instanceof File ? '' : (typeof v === 'string' ? v : String(v)); });
      await updateHorsBudget.mutateAsync({ residenceId, id: selectedHorsBudget.id, data: payload as { date?: string; montant?: number; description?: string } });
    }
    setIsModalOpen(false);
  };

  if (!activeResidence) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Charges & Dépenses</h1>
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <p className="text-text-muted">Veuillez sélectionner une résidence pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (compteChargesError) {
    return (
      <div className="p-6">
        <ErrorState message="Impossible de charger les comptes de charges." onRetry={compteChargesRefetch} />
      </div>
    );
  }

  const chargeDepError =
    (activeTab === 'depenses' && depensesError) ||
    (activeTab === 'horsBudget' && horsBudgetsError);

  const chargeDepRefetch =
    activeTab === 'depenses' ? depensesRefetch : horsBudgetsRefetch;

  const preloadTab = (tabId: TabId) => {
    if (tabId === 'depenses') preloadDepensesTab();
    else if (tabId === 'horsBudget') preloadHorsBudgetTab();
  };

  if (chargeDepError) {
    return (
      <div className="p-6">
        <ErrorState message={`Impossible de charger les ${activeTab === 'depenses' ? 'dépenses' : 'dépenses hors budget'}.`} onRetry={chargeDepRefetch} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Charges & Dépenses" subtitle={activeResidence?.nom} />

      <div className="flex items-center gap-1 mb-6 bg-surface-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onMouseEnter={() => preloadTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'comptes' && (
        <div className="bg-white rounded-xl shadow-card">
          <div className="p-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => openCreateModal('comptes')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Nouveau compte
              </button>
            </div>

            {loadingComptes ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-surface-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : compteCharges.length === 0 ? (
              <EmptyState
                title="Aucun compte de charges"
                description="Commencez par créer vos comptes de charges pour organiser vos dépenses."
                action={{ label: '+ Nouveau compte', onClick: () => openCreateModal('comptes') }}
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-surface-200">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-surface-100 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Nb sous-charges</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comptesWithSousCharges.map((cc) => (
                      <tr key={cc.id} className="border-t border-surface-100 hover:bg-brand-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{cc.nom}</p>
                            {cc.description && <p className="text-xs text-text-muted mt-0.5">{cc.description}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-text-secondary">
                            {cc.sous_charges?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleActif(cc)}
                            className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
                              cc.is_active ? 'text-success' : 'text-text-muted'
                            }`}
                          >
                            {cc.is_active ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                            {cc.is_active ? 'Actif' : 'Désactivé'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal('comptes', cc)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const nb = cc.sous_charges?.length ?? 0;
                                confirmDelete('comptes', cc.id, cc.nom, nb > 0 ? `${nb} sous-charge(s)` : undefined);
                              }}
                              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}

        {activeTab === 'sousCharges' && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-secondary">Compte :</label>
                <select
                  value={filterCompteCharge ?? ''}
                  onChange={(e) => setFilterCompteCharge(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Tous les comptes</option>
                  {compteCharges.map((cc) => (
                    <option key={cc.id} value={cc.id}>{cc.nom}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => openCreateModal('sousCharges')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Nouvelle sous-charge
              </button>
            </div>

            {filteredSousCharges.length === 0 && !filterCompteCharge ? (
              <EmptyState
                title="Aucune sous-charge"
                description="Créez d'abord un compte de charges, puis ajoutez des sous-charges."
                action={{ label: '+ Nouvelle sous-charge', onClick: () => openCreateModal('sousCharges') }}
              />
            ) : filteredSousCharges.length === 0 ? (
              <EmptyState
                title="Aucune sous-charge pour ce compte"
                description="Ajoutez des sous-charges à ce compte de charges."
                action={{ label: '+ Nouvelle sous-charge', onClick: () => openCreateModal('sousCharges') }}
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-surface-200">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-surface-100 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Sous-Charge</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Compte parent</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSousCharges.map((sc) => {
                      const parent = compteCharges.find((cc) => cc.id === sc.compte_charge_id);
                      return (
                        <tr key={sc.id} className="border-t border-surface-100 hover:bg-brand-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-text-primary">{sc.nom}</td>
                          <td className="px-4 py-3 text-sm text-text-secondary">{parent?.nom ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-text-muted">{sc.description ?? '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditModal('sousCharges', sc)} className="p-1.5 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => confirmDelete('sousCharges', sc.id, sc.nom)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'depenses' && (
          <Suspense fallback={<div className="h-64 bg-surface-100 rounded-xl animate-pulse" />}>
            <DepensesTab
              depensesData={depensesData} loadingDepenses={loadingDepenses}
              depensesMeta={depensesMeta} depensePage={depensePage}
              filterCompteChargeDepenses={filterCompteChargeDepenses}
              depenseDateDebut={depenseDateDebut} depenseDateFin={depenseDateFin}
              compteCharges={compteCharges}
              onOpenCreate={() => openCreateModal('depenses')}
              onOpenEdit={(item) => openEditModal('depenses', item)}
              onDelete={confirmDelete}
              onFilterChange={(f) => {
                if (f.compteChargeId !== undefined) setFilterCompteChargeDepenses(f.compteChargeId);
                if (f.dateDebut !== undefined) setDepenseDateDebut(f.dateDebut);
                if (f.dateFin !== undefined) setDepenseDateFin(f.dateFin);
                setDepensePage(1);
              }}
              onPageChange={setDepensePage}
              onResetFilters={() => { setFilterCompteChargeDepenses(null); setDepenseDateDebut(''); setDepenseDateFin(''); setDepensePage(1); }}
            />
          </Suspense>
        )}

        {activeTab === 'horsBudget' && (
          <Suspense fallback={<div className="h-64 bg-surface-100 rounded-xl animate-pulse" />}>
            <HorsBudgetTab
              horsBudgetsData={horsBudgetsData} loadingHorsBudgets={loadingHorsBudgets}
              horsBudgetsMeta={horsBudgetsMeta} hbPage={hbPage}
              hbDateDebut={hbDateDebut} hbDateFin={hbDateFin}
              onOpenCreate={() => openCreateModal('horsBudget')}
              onOpenEdit={(item) => openEditModal('horsBudget', item)}
              onDelete={confirmDelete}
              onFilterChange={(f) => {
                if (f.dateDebut !== undefined) setHbDateDebut(f.dateDebut);
                if (f.dateFin !== undefined) setHbDateFin(f.dateFin);
                setHbPage(1);
              }}
              onPageChange={setHbPage}
              onResetFilters={() => { setHbDateDebut(''); setHbDateFin(''); setHbPage(1); }}
            />
          </Suspense>
        )}

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, type: '', id: 0, label: '' })}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteConfirm.label}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        isDestructive
      />

      {isModalOpen && (
        <CompteChargeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitCompteCharge}
          initialData={selectedCompteCharge}
        />
      )}

      {isModalOpen && activeTab === 'sousCharges' && (
        <SousChargeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitSousCharge}
          initialData={selectedSousCharge}
          compteCharges={compteCharges}
        />
      )}

      {isModalOpen && (activeTab === 'depenses' || activeTab === 'horsBudget') && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent mx-auto" />
            </div>
          </div>
        }>
          <DepenseFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={activeTab === 'horsBudget' ? handleSubmitHorsBudget : handleSubmitDepense}
            comptesCharges={comptesWithSousCharges}
            mode={activeTab === 'horsBudget' ? 'horsBudget' : 'depense'}
            onError={(msg) => addToast('error', msg)}
            initialData={
              selectedDepense
                ? {
                    id: selectedDepense.id,
                    sous_charge_id: selectedDepense.sous_charge_id,
                    date: selectedDepense.date,
                    montant: selectedDepense.montant,
                    description: selectedDepense.description,
                  }
                : undefined
            }
          />
        </Suspense>
      )}
    </div>
  );
}

function CompteChargeModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nom: string; description?: string }) => Promise<void>;
  initialData: CompteCharge | null;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      nom: initialData?.nom ?? '',
      description: initialData?.description ?? '',
    },
    resolver: zodResolver(
      z.object({
        nom: z.string().min(1, 'Le nom est obligatoire.').max(150),
        description: z.string().max(500).optional().nullable(),
      })
    ),
  });

  const handleFormSubmit = async (data: { nom: string; description?: string | null }) => {
    await onSubmit({ nom: data.nom, description: data.description ?? undefined });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Modifier le compte' : 'Nouveau compte de charges'}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSubmit(handleFormSubmit)}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            {initialData ? 'Enregistrer' : 'Créer'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField label="Nom" error={errors.nom?.message} required>
          <input
            {...register('nom')}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            placeholder="Ex: Entretien & Réparation"
          />
        </FormField>
        <FormField label="Description" error={errors.description?.message}>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm resize-none"
            placeholder="Description optionnelle..."
          />
        </FormField>
      </form>
    </Modal>
  );
}

function SousChargeModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  compteCharges,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nom: string; description?: string; compte_charge_id: number }) => Promise<void>;
  initialData: SousCharge | null;
  compteCharges: CompteCharge[];
}) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      nom: initialData?.nom ?? '',
      description: initialData?.description ?? '',
      compte_charge_id: initialData?.compte_charge_id ?? '',
    },
  });

  const handleFormSubmit = async (data: { nom: string; description?: string | null; compte_charge_id: number | string }) => {
    await onSubmit({
      nom: data.nom,
      description: data.description ?? undefined,
      compte_charge_id: Number(data.compte_charge_id),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Modifier la sous-charge' : 'Nouvelle sous-charge'}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSubmit(handleFormSubmit)}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            {initialData ? 'Enregistrer' : 'Créer'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField label="Compte parent" error={errors.compte_charge_id?.message as string} required>
          <select
            {...register('compte_charge_id')}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
          >
            <option value="">Sélectionnez un compte</option>
            {compteCharges.map((cc) => (
              <option key={cc.id} value={cc.id}>{cc.nom}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Nom" error={errors.nom?.message} required>
          <input
            {...register('nom')}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            placeholder="Ex: Entretien électricité"
          />
        </FormField>
        <FormField label="Description" error={errors.description?.message}>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm resize-none"
            placeholder="Description optionnelle..."
          />
        </FormField>
      </form>
    </Modal>
  );
}