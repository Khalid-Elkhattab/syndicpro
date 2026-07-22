import { useState, lazy, Suspense } from 'react';
import { motion } from '@/lib/motion';
import { Plus, Calendar } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useCotisationsFixes, useCotisationsExceptionnelles, useCreateCotisationFixe, useImpayes } from '@/hooks/useCotisations';
import { usePeriodes } from '@/hooks/useBudget';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEnregistrerPaiement } from '@/hooks/usePaiements';

const preloadWizard = () => import('@/components/cotisation/CotisationExceptionnelleWizard');
const preloadPayModal = () => import('@/components/paiement/EnregistrerPaiementModal');
const CotisationExceptionnelleWizard = lazy(() => preloadWizard().then(m => ({ default: m.CotisationExceptionnelleWizard })));
const EnregistrerPaiementModal = lazy(() => preloadPayModal().then(m => ({ default: m.EnregistrerPaiementModal })));
import { formatCurrency } from '@/utils/formatCurrency';
import { useUIStore } from '@/store/uiStore';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Cotisation, CotisationDetail } from '@/types/entities.types';

type TabId = 'fixes' | 'exceptionnelles' | 'impayes';

const tabs: { id: TabId; label: string }[] = [
  { id: 'fixes', label: 'Cotisations Fixes' },
  { id: 'exceptionnelles', label: 'Cotisations Exceptionnelles' },
  { id: 'impayes', label: 'Impayés' },
];

export default function CotisationsPage() {
  const activeResidence = useResidenceStore((s) => s.activeResidence);
  const addToast = useUIStore((s) => s.addToast);
  const residenceId = activeResidence?.id ?? 0;

  const [activeTab, setActiveTab] = useState<TabId>('fixes');
  const [showFixeModal, setShowFixeModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payDetailId, setPayDetailId] = useState<number | null>(null);
  const [impayePage, setImpayePage] = useState(1);
  const [impayeStatut, setImpayeStatut] = useState('');

  const { data: periodes, isError: periodesError, refetch: periodesRefetch } = usePeriodes(residenceId);
  const activePeriode = periodes?.find((p) => p.is_active) ?? periodes?.[0];
  const { data: fixes, isLoading: fixesLoading, isError: fixesError, refetch: fixesRefetch } = useCotisationsFixes(residenceId, activePeriode?.id);
  const { data: exceptionnelles, isLoading: excLoading, isError: excError, refetch: excRefetch } = useCotisationsExceptionnelles(residenceId, activePeriode?.id);
  const { data: impayesData, isLoading: impLoading, isError: impayesError, refetch: impayesRefetch } = useImpayes(residenceId, {
    statut: impayeStatut || undefined,
    page: impayePage,
    per_page: 20,
  });

  const createFixe = useCreateCotisationFixe();
  const createPaiement = useEnregistrerPaiement();

  const handleCreateFixe = async (data: { label: string; montant_mensuel: number; periode_id: number; description?: string }) => {
    await createFixe.mutateAsync({ residenceId, data });
    setShowFixeModal(false);
    addToast('success', 'Cotisation fixe créée. Les détails seront générés automatiquement chaque mois.');
  };

  const handlePayFromImpayes = async (pData: {
    cotisation_detail_id: number;
    date_paiement: string;
    montant: number;
    mode_paiement: 'especes' | 'virement' | 'cheque' | 'carte';
    reference?: string;
  }) => {
    await createPaiement.mutateAsync(pData);
    addToast('success', 'Paiement enregistré. Le reçu est en cours de génération.');
    setPayModalOpen(false);
    setPayDetailId(null);
  };

  if (!activeResidence) {
    return (
      <div className="p-6">
        <PageHeader title="Cotisations" subtitle="Sélectionnez une résidence." />
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

  const tabError =
    (activeTab === 'fixes' && fixesError) ||
    (activeTab === 'exceptionnelles' && excError) ||
    (activeTab === 'impayes' && impayesError);

  const tabRefetch =
    activeTab === 'fixes' ? fixesRefetch :
    activeTab === 'exceptionnelles' ? excRefetch :
    impayesRefetch;

  if (tabError) {
    return (
      <div className="p-6">
        <ErrorState message={`Impossible de charger les ${activeTab === 'impayes' ? 'impayés' : 'cotisations'}.`} onRetry={tabRefetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cotisations"
        subtitle={`${activeResidence.nom} · ${activePeriode?.annee ?? ''}`}
      />

      <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id ? 'bg-white text-brand-600 shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'fixes' && (
        <motion.div key="fixes" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowFixeModal(true)}>
              <Plus className="w-4 h-4" /> Nouvelle cotisation fixe
            </Button>
          </div>

          {fixesLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-surface-100 rounded-lg animate-pulse" />)}</div>
          ) : !fixes || fixes.length === 0 ? (
            <EmptyState title="Aucune cotisation fixe" description="Créez votre première cotisation mensuelle." action={{ label: '+ Nouvelle cotisation fixe', onClick: () => setShowFixeModal(true) }} />
          ) : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-100 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Label</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Montant/mois</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Période</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Générations</th>
                  </tr>
                </thead>
                <tbody>
                  {fixes.map((c: Cotisation, i: number) => (
                    <motion.tr key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="border-t border-surface-100 hover:bg-surface-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-text-primary">{c.label}</td>
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-text-primary text-right">{formatCurrency(c.montant_mensuel ?? 0)}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{c.periode?.annee ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{c.description ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                          <Calendar className="w-3.5 h-3.5" />
                          Générée le 1er de chaque mois
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'exceptionnelles' && (
        <motion.div key="exc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-end mb-4">
            <Button onClick={() => { preloadWizard(); setShowWizard(true); }}>
              <Plus className="w-4 h-4" /> Nouvelle cotisation exceptionnelle
            </Button>
          </div>

          {excLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-surface-100 rounded-lg animate-pulse" />)}</div>
          ) : !exceptionnelles || exceptionnelles.length === 0 ? (
            <EmptyState title="Aucune cotisation exceptionnelle" description="Créez une cotisation ponctuelle." action={{ label: '+ Nouvelle cotisation', onClick: () => setShowWizard(true) }} />
          ) : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-100 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Label</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Montant total</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Mode répartition</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Période</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptionnelles.map((c: Cotisation, i: number) => (
                    <motion.tr key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="border-t border-surface-100 hover:bg-surface-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-text-primary">{c.label}</td>
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-text-primary text-right">{formatCurrency(c.montant_total)}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {c.mode_repartition === 'egale' ? 'Répartition égale'
                          : c.mode_repartition === 'par_tantieme' ? 'Par tantième'
                          : c.mode_repartition === 'par_appartement' ? 'Par appartement'
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{c.periode?.annee ?? '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'impayes' && (
        <motion.div key="imp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-4">
            <select
              value={impayeStatut}
              onChange={(e) => { setImpayeStatut(e.target.value); setImpayePage(1); }}
              className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Tous</option>
              <option value="non_paye">Non payés</option>
              <option value="partiellement_paye">Partiels</option>
            </select>
          </div>

          {impLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-surface-100 rounded-lg animate-pulse" />)}</div>
          ) : !impayesData || impayesData.data.length === 0 ? (
            <EmptyState title="Aucun impayé 🎉" description="Tous les copropriétaires sont à jour." />
          ) : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-100 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Copropriétaire</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Appartement</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Dû</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Payé</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Restant</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {impayesData.data.map((d: CotisationDetail, i: number) => {
                    const restant = d.montant - d.montant_paye;
                    return (
                      <motion.tr key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className="border-t border-surface-100 hover:bg-surface-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-text-primary">{d.coproprietaire?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{d.appartement?.numero ?? '—'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-text-primary text-right">{formatCurrency(d.montant)}</td>
                        <td className="px-4 py-3 text-sm font-mono text-text-secondary text-right">{formatCurrency(d.montant_paye)}</td>
                        <td className={`px-4 py-3 text-sm font-mono font-semibold text-right ${restant > 0 ? 'text-danger-dark' : 'text-success-dark'}`}>
                          {formatCurrency(restant)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            d.statut === 'non_paye' ? 'bg-danger-light text-danger-dark' : 'bg-warning-light text-warning-dark'
                          }`}>
                            {d.statut === 'non_paye' ? 'Non payé' : 'Partiel'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => { preloadPayModal(); setPayDetailId(d.id); setPayModalOpen(true); }}
                            className="px-3 py-1 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                          >
                            Payer
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {impayesData.meta && impayesData.meta.total > impayesData.meta.per_page && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
                  <span className="text-sm text-text-muted">
                    {(impayesData.meta.current_page - 1) * impayesData.meta.per_page + 1}–
                    {Math.min(impayesData.meta.current_page * impayesData.meta.per_page, impayesData.meta.total)} sur {impayesData.meta.total}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setImpayePage((p) => Math.max(1, p - 1))}
                      disabled={impayePage <= 1}
                      className="px-3 py-1 text-sm border border-surface-300 rounded-lg hover:bg-surface-100 disabled:opacity-50">Précédent</button>
                    <button onClick={() => setImpayePage((p) => p + 1)}
                      disabled={impayePage >= impayesData.meta.last_page}
                      className="px-3 py-1 text-sm border border-surface-300 rounded-lg hover:bg-surface-100 disabled:opacity-50">Suivant</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      <Modal isOpen={showFixeModal} onClose={() => setShowFixeModal(false)} title="Nouvelle cotisation fixe" size="sm">
        <FixeForm
          periodes={periodes ?? []}
          onSubmit={handleCreateFixe}
          onCancel={() => setShowFixeModal(false)}
          isLoading={createFixe.isPending}
        />
      </Modal>

      <Modal isOpen={showWizard} onClose={() => setShowWizard(false)} title="Nouvelle cotisation exceptionnelle" size="lg">
        <Suspense fallback={<div className="p-12 text-center text-text-muted">Chargement...</div>}>
          <CotisationExceptionnelleWizard onClose={() => setShowWizard(false)} residenceId={residenceId} />
        </Suspense>
      </Modal>

      {payModalOpen && payDetailId && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent mx-auto" />
            </div>
          </div>
        }>
          <EnregistrerPaiementModal
            isOpen={payModalOpen}
            onClose={() => { setPayModalOpen(false); setPayDetailId(null); }}
            onSubmit={handlePayFromImpayes}
            residenceId={residenceId}
            preselectedDetailId={payDetailId}
          />
        </Suspense>
      )}
    </div>
  );
}

function FixeForm({
  periodes,
  onSubmit,
  onCancel,
  isLoading,
}: {
  periodes: Array<{ id: number; annee: number; is_active: boolean }>;
  onSubmit: (data: { label: string; montant_mensuel: number; periode_id: number; description?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [label, setLabel] = useState('');
  const [montant, setMontant] = useState('');
  const [periodeId, setPeriodeId] = useState<number>(periodes.find((p) => p.is_active)?.id ?? periodes[0]?.id ?? 0);
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!label || !montant || !periodeId) return;
    await onSubmit({ label, montant_mensuel: parseFloat(montant), periode_id: periodeId, description: description || undefined });
  };

  return (
    <div className="space-y-4">
      <FormField label="Label" required>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex: Charges mensuelles"
          className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm" />
      </FormField>
      <FormField label="Montant mensuel (DH)" required>
        <input type="text" inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0,00"
          className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm font-mono text-right" />
      </FormField>
      <FormField label="Période" required>
        <select value={periodeId} onChange={(e) => setPeriodeId(Number(e.target.value))}
          className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm">
          {periodes.map((p) => (
            <option key={p.id} value={p.id}>{p.annee}{p.is_active ? ' (Actif)' : ''}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Description (optionnel)">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm resize-none" />
      </FormField>
      <div className="p-3 bg-info-light rounded-lg text-sm text-info-dark">
        Les détails seront générés automatiquement chaque mois.
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button onClick={handleSubmit} isLoading={isLoading} disabled={!label || !montant || !periodeId}>Créer</Button>
      </div>
    </div>
  );
}
