import { useState } from 'react';
import { motion } from '@/lib/motion';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, FileCheck, UserPlus, Search } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useResidences } from '@/hooks/useResidences';
import {
  useLotsForTransfer, useTransferWizardData, useRunTransfer, useIssueQuitus, useOwnerSearch,
} from '@/hooks/useTransfer';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

const REASONS = [
  { value: 'sale', label: 'Vente' },
  { value: 'promoter_sale', label: 'Première vente (promoteur)' },
  { value: 'inheritance', label: 'Héritage' },
  { value: 'donation', label: 'Donation' },
  { value: 'other', label: 'Autre' },
];

type QuitusChoice = { kind: 'quitus'; id: number } | { kind: 'none' };

export default function TransferWizardPage() {
  const { activeResidence } = useResidenceStore();
  const { data: residences } = useResidences();
  const [residenceId, setResidenceId] = useState<number | undefined>(activeResidence?.id);
  const [lotSearch, setLotSearch] = useState('');
  const [lotId, setLotId] = useState<number | undefined>(undefined);
  const [step, setStep] = useState(0);

  // wizard state
  const [quitusChoice, setQuitusChoice] = useState<QuitusChoice | null>(null);
  const [noQuitusMotif, setNoQuitusMotif] = useState('');
  const [buyerId, setBuyerId] = useState<number | undefined>(undefined);
  const [newBuyer, setNewBuyer] = useState({ first_name: '', last_name: '', identity_number: '', phone: '' });
  const [useNewBuyer, setUseNewBuyer] = useState(false);
  const [buyerSearch, setBuyerSearch] = useState('');
  const [effectiveOn, setEffectiveOn] = useState('');
  const [reason, setReason] = useState('sale');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: lots } = useLotsForTransfer({ residence_id: residenceId, search: lotSearch || undefined });
  const { data: wizard, isLoading: wizardLoading, isError: wizardError, refetch: refetchWizard } = useTransferWizardData(lotId);
  const runMutation = useRunTransfer();
  const quitusMutation = useIssueQuitus();
  const { data: buyerResults } = useOwnerSearch(buyerSearch);

  const pickLot = (id: number) => {
    setLotId(id);
    setStep(1);
    setQuitusChoice(null);
    setNoQuitusMotif('');
    setBuyerId(undefined);
    setError(null);
    setSuccess(null);
  };

  const handleIssueQuitus = async () => {
    if (!wizard?.outgoing_owner || !lotId) return;
    setError(null);
    try {
      await quitusMutation.mutateAsync({ owner_id: wizard.outgoing_owner.id, lot_id: lotId, purpose: 'sale' });
      refetchWizard();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message ?? 'Émission impossible (solde non nul ?).');
    }
  };

  const canConfirm = () => {
    if (!wizard || !effectiveOn || !reason) return false;
    if (!quitusChoice) return false;
    if (quitusChoice.kind === 'none' && !noQuitusMotif.trim()) return false;
    if (useNewBuyer) {
      return !!(newBuyer.first_name.trim() && newBuyer.last_name.trim());
    }
    return !!buyerId;
  };

  const handleRun = async () => {
    if (!lotId || !canConfirm()) return;
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        effective_on: effectiveOn,
        reason,
        notes: notes || undefined,
      };
      if (quitusChoice?.kind === 'quitus') {
        payload.quitus_id = quitusChoice.id;
      } else {
        payload.no_quitus_motif = noQuitusMotif.trim();
      }
      if (useNewBuyer) {
        payload.new_owner = {
          first_name: newBuyer.first_name.trim(),
          last_name: newBuyer.last_name.trim(),
          identity_number: newBuyer.identity_number.trim() || undefined,
          phones: newBuyer.phone.trim()
            ? [{ number: newBuyer.phone.trim(), is_primary: true, is_whatsapp: true }]
            : undefined,
        };
      } else {
        payload.to_owner_id = buyerId;
      }
      const response = await runMutation.mutateAsync({ lotId, ...payload } as Parameters<typeof runMutation.mutateAsync>[0]);
      setSuccess((response.data as unknown as { message?: string }).message ?? 'Transfert effectué.');
      setStep(4);
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      setError(resp?.errors ? Object.values(resp.errors).flat().join(' ') : (resp?.message ?? 'Échec du transfert.'));
    }
  };

  const steps = ['Lot', 'Quitus', 'Acquéreur', 'Confirmation'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Transfert de lot</h1>
        <p className="text-sm text-text-muted mt-1">Cession vendeur → acquéreur, avec ou sans quitus</p>
      </div>

      {/* stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step > i ? 'bg-success text-white' : step === i ? 'bg-brand-600 text-white' : 'bg-surface-200 text-text-muted'
            }`}>
              {step > i ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm ${step === i ? 'font-medium text-text-primary' : 'text-text-muted'}`}>{label}</span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-surface-200" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{error}</div>
      )}

      {/* STEP 0 — lot */}
      {step === 0 && (
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Résidence" required>
              <select value={residenceId ?? ''} onChange={(e) => { setResidenceId(Number(e.target.value)); setLotId(undefined); }}
                className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Choisir</option>
                {residences?.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
            </FormField>
            <FormField label="Rechercher un lot">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input value={lotSearch} onChange={(e) => setLotSearch(e.target.value)} placeholder="N° de lot..."
                  className="w-full pl-9 pr-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
            </FormField>
          </div>
          {!residenceId ? (
            <EmptyState type="create" title="Sélectionnez une résidence" description="Puis choisissez le lot à transférer." action={{ label: '', onClick: () => {} }} />
          ) : !lots?.length ? (
            <EmptyState type="create" title="Aucun lot" description="Aucun lot trouvé pour cette recherche." action={{ label: '', onClick: () => {} }} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {lots.map((lot) => (
                <button
                  key={lot.id}
                  onClick={() => pickLot(lot.id)}
                  className="text-left p-4 border border-surface-200 rounded-lg hover:border-brand-500 hover:shadow-card transition-all"
                >
                  <div className="font-medium text-text-primary">Lot {lot.number} <span className="text-xs text-text-muted">({lot.type_label})</span></div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {lot.building ? `Imm. ${lot.building} — ` : ''}{lot.current_owner ?? 'Sans propriétaire'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 1 — quitus */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          {wizardLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />)}</div>
          ) : wizardError || !wizard ? (
            <ErrorState message="Impossible de charger les données du lot." onRetry={refetchWizard} />
          ) : (
            <>
              <div className="p-4 bg-surface-50 rounded-lg text-sm space-y-1">
                <div><span className="text-text-muted">Lot :</span> <strong>{wizard.lot.number} ({wizard.lot.type_label})</strong></div>
                <div><span className="text-text-muted">Cédant :</span> <strong>{wizard.outgoing_owner?.display_name ?? '—'}</strong></div>
                <div>
                  <span className="text-text-muted">Solde exigible :</span>{' '}
                  <strong className={wizard.overdue_balance > 0 ? 'text-danger' : 'text-success'}>
                    {Number(wizard.overdue_balance).toLocaleString('fr-MA')} MAD
                  </strong>
                </div>
              </div>

              <div className="text-sm font-medium text-text-primary">Quitus de vente du cédant</div>
              <div className="space-y-2">
                {wizard.valid_quitus.map((q) => (
                  <label key={q.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${quitusChoice?.kind === 'quitus' && quitusChoice.id === q.id ? 'border-brand-600 bg-brand-50' : 'border-surface-200'}`}>
                    <input type="radio" name="quitus" checked={quitusChoice?.kind === 'quitus' && quitusChoice.id === q.id}
                      onChange={() => setQuitusChoice({ kind: 'quitus', id: q.id })} className="accent-brand-600" />
                    <FileCheck className="w-4 h-4 text-success" />
                    <span className="text-sm"><strong>{q.number}</strong> — émis le {q.issued_on}{q.valid_until ? `, valide jusqu’au ${q.valid_until}` : ''}</span>
                  </label>
                ))}

                <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${quitusChoice?.kind === 'none' ? 'border-amber-500 bg-amber-50' : 'border-surface-200'}`}>
                  <input type="radio" name="quitus" checked={quitusChoice?.kind === 'none'}
                    onChange={() => setQuitusChoice({ kind: 'none' })} className="accent-amber-600 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">Sans quitus — <span className="text-text-muted">affiché « Aucun »</span></div>
                    <div className="flex items-start gap-1.5 text-xs text-amber-700 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      Le transfert sera automatiquement signalé en mesure légale, comme les impayés.
                    </div>
                    {quitusChoice?.kind === 'none' && (
                      <textarea value={noQuitusMotif} onChange={(e) => setNoQuitusMotif(e.target.value)} rows={2}
                        placeholder="Motif obligatoire : pourquoi aucun quitus ? (ex : vendeur introuvable, acte en régularisation...)"
                        className="mt-2 w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none" />
                    )}
                  </div>
                </label>
              </div>

              {wizard.overdue_balance <= 0 && (
                <button onClick={handleIssueQuitus} disabled={quitusMutation.isPending}
                  className="text-sm text-brand-600 hover:underline disabled:opacity-50">
                  {quitusMutation.isPending ? 'Émission...' : '+ Émettre un quitus maintenant (solde à zéro)'}
                </button>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(0)} className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">
                  <ArrowLeft className="w-4 h-4" /> Retour
                </button>
                <button onClick={() => { setEffectiveOn(wizard.suggested_effective_on); setStep(2); }} disabled={!quitusChoice || (quitusChoice.kind === 'none' && !noQuitusMotif.trim())}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
                  Continuer <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 2 — acquéreur */}
      {step === 2 && wizard && (
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <div className="flex gap-2 border-b border-surface-200 pb-3">
            <button onClick={() => setUseNewBuyer(false)} className={`px-4 py-1.5 text-sm font-medium rounded-lg ${!useNewBuyer ? 'bg-brand-600 text-white' : 'bg-surface-100 text-text-secondary'}`}>
              Propriétaire existant
            </button>
            <button onClick={() => setUseNewBuyer(true)} className={`flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg ${useNewBuyer ? 'bg-brand-600 text-white' : 'bg-surface-100 text-text-secondary'}`}>
              <UserPlus className="w-4 h-4" /> Nouveau
            </button>
          </div>

          {!useNewBuyer ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input value={buyerSearch} onChange={(e) => setBuyerSearch(e.target.value)} placeholder="Rechercher par CIN ou nom (2 lettres min)..."
                  className="w-full pl-9 pr-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(buyerResults ?? []).map((o) => (
                  <button key={o.id} onClick={() => setBuyerId(o.id)}
                    className={`w-full text-left p-3 border rounded-lg text-sm ${buyerId === o.id ? 'border-brand-600 bg-brand-50 font-medium' : 'border-surface-200'}`}>
                    {o.display_name}
                  </button>
                ))}
                {buyerSearch.trim().length >= 2 && !(buyerResults ?? []).length && (
                  <p className="text-sm text-text-muted">Aucun résultat — créez un nouveau propriétaire.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Prénom" required>
                <input value={newBuyer.first_name} onChange={(e) => setNewBuyer({ ...newBuyer, first_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </FormField>
              <FormField label="Nom" required>
                <input value={newBuyer.last_name} onChange={(e) => setNewBuyer({ ...newBuyer, last_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </FormField>
              <FormField label="CIN">
                <input value={newBuyer.identity_number} onChange={(e) => setNewBuyer({ ...newBuyer, identity_number: e.target.value })}
                  className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </FormField>
              <FormField label="Téléphone">
                <input value={newBuyer.phone} onChange={(e) => setNewBuyer({ ...newBuyer, phone: e.target.value })} placeholder="+212..."
                  className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
              </FormField>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={() => setStep(3)} disabled={useNewBuyer ? !(newBuyer.first_name.trim() && newBuyer.last_name.trim()) : !buyerId}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — confirmation */}
      {step === 3 && wizard && (
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <div className="p-4 bg-surface-50 rounded-lg text-sm space-y-1">
            <div><span className="text-text-muted">Lot :</span> <strong>{wizard.lot.number}</strong></div>
            <div><span className="text-text-muted">Cédant :</span> <strong>{wizard.outgoing_owner?.display_name}</strong></div>
            <div><span className="text-text-muted">Quitus :</span>{' '}
              {quitusChoice?.kind === 'quitus'
                ? <strong>{wizard.valid_quitus.find((q) => q.id === quitusChoice.id)?.number}</strong>
                : <strong className="text-amber-700">Aucun — mesure légale ({noQuitusMotif})</strong>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date d’effet" required>
              <input type="date" value={effectiveOn} onChange={(e) => setEffectiveOn(e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </FormField>
            <FormField label="Motif du changement" required>
              <select value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Notes (optionnel)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none" />
          </FormField>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={handleRun} disabled={!canConfirm() || runMutation.isPending}
              className="px-6 py-2 text-sm font-medium text-white bg-success hover:opacity-90 rounded-lg disabled:opacity-50">
              {runMutation.isPending ? 'Transfert...' : 'Confirmer le transfert'}
            </button>
          </div>
        </div>
      )}

      {/* DONE */}
      {step === 4 && success && (
        <div className="bg-white rounded-xl shadow-card p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-success-light flex items-center justify-center">
            <Check className="w-6 h-6 text-success" />
          </div>
          <p className="text-text-primary font-medium">{success}</p>
          <button onClick={() => { setStep(0); setLotId(undefined); setSuccess(null); }}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">
            Nouveau transfert
          </button>
        </div>
      )}

    </motion.div>
  );
}
