import { useEffect, useRef, useState } from 'react';
import { Wallet, Printer, Loader2, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { paymentsApi, PAYMENT_METHODS, type AllocationLine, type PaymentPreview, type RecordedPayment } from '@/api/payments.api';
import { residencesApi } from '@/api/residences.api';
import type { Residence } from '@/types/entities.types';
import type { OwnerProperty, OwnerSituation } from '@/api/owners.api';

interface EncaisserModalProps {
  ownerId: number;
  ownerName: string;
  properties: OwnerProperty[];
  situation: OwnerSituation | null;
  onClose: () => void;
  onRecorded: () => void;
}

type Step = 'form' | 'preview' | 'done';

const inputCls = 'w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none';

export function EncaisserModal({ ownerId, ownerName, properties, situation, onClose, onRecorded }: EncaisserModalProps) {
  const residenceIds = [...new Set(properties.map((p) => p.residence_id).filter((r): r is number => r != null))];
  const { data: residencesResp } = useQuery({
    queryKey: ['residences'],
    queryFn: async () => {
      const { data } = await residencesApi.index();
      return (data.data ?? []) as Residence[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const residenceName = (id: number) =>
    residencesResp?.find((r) => r.id === id)?.nom ?? `Résidence #${id}`;
  const residenceBalance = (id: number) =>
    (situation?.per_lot ?? []).filter((l) => l.residence_id === id).reduce((s, l) => s + l.remaining, 0);
  const [step, setStep] = useState<Step>('form');
  const [residenceId, setResidenceId] = useState<number | ''>(residenceIds[0] ?? '');
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<string>('cash');
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<PaymentPreview | null>(null);
  const [recorded, setRecorded] = useState<RecordedPayment | null>(null);
  const [encUrl, setEncUrl] = useState<string | null>(null);
  const [impUrl, setImpUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const encRef = useRef<HTMLIFrameElement>(null);
  const impRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => () => {
    if (encUrl) URL.revokeObjectURL(encUrl);
    if (impUrl) URL.revokeObjectURL(impUrl);
  }, [encUrl, impUrl]);

  const needsDoc = method === 'cheque' || method === 'effet';
  const amountNum = Number(amount);

  const loadPreview = async () => {
    setError(null);
    if (!residenceId) { setError('Choisissez la résidence.'); return; }
    if (!amountNum || amountNum <= 0) { setError('Montant invalide.'); return; }
    if (needsDoc && !documentNumber.trim()) { setError('Le numéro de pièce est obligatoire pour un chèque ou un effet.'); return; }
    setLoading(true);
    try {
      const { data } = await paymentsApi.preview({ residence_id: residenceId, owner_id: ownerId, amount: amountNum });
      setPreview(data.data);
      setStep('preview');
    } catch (err: unknown) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!residenceId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await paymentsApi.record({
        residence_id: residenceId,
        owner_id: ownerId,
        amount: amountNum,
        paid_on: paidOn,
        method,
        document_number: documentNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      const rec = data.data;
      setRecorded(rec);
      const [enc, imp] = await Promise.all([
        paymentsApi.receiptBlob(rec.receipts.encaissement_url),
        paymentsApi.receiptBlob(rec.receipts.imputation_url),
      ]);
      setEncUrl(enc);
      setImpUrl(imp);
      setStep('done');
      onRecorded();
    } catch (err: unknown) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const printBoth = () => {
    const first = encRef.current?.contentWindow;
    const second = impRef.current?.contentWindow;
    if (!first || !second) return;
    const onAfter = () => {
      window.removeEventListener('afterprint', onAfter);
      second.print();
    };
    window.addEventListener('afterprint', onAfter);
    first.print();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Encaisser — ${ownerName}`} size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Fermer</button>
          {step === 'form' && (
            <button onClick={loadPreview} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50">
              {loading ? 'Calcul...' : 'Aperçu de l’imputation'}
            </button>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('form')} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg">Retour</button>
              <button onClick={confirm} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success hover:opacity-90 rounded-lg disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                Confirmer l’encaissement
              </button>
            </>
          )}
          {step === 'done' && encUrl && impUrl && (
            <button onClick={printBoth} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">
              <Printer className="w-4 h-4" /> Imprimer les deux reçus
            </button>
          )}
        </>
      }
    >
      {error && <div className="mb-4 p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{error}</div>}

      {step === 'form' && (
        <div className="space-y-4">
          <FormField label="Résidence (un encaissement par résidence)">
            {residenceIds.length === 0 ? (
              <div className="text-sm text-danger">Aucune résidence liée à ce propriétaire.</div>
            ) : (
              <select value={residenceId} onChange={(e) => setResidenceId(Number(e.target.value))} className={inputCls}>
                {residenceIds.map((r) => (
                  <option key={r} value={r}>
                    {residenceName(r)} — reste {residenceBalance(r).toLocaleString('fr-MA')} MAD
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Montant reçu (MAD)">
              <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} font-mono`} placeholder="2000" />
            </FormField>
            <FormField label="Date d’encaissement">
              <input type="date" value={paidOn} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setPaidOn(e.target.value)} className={inputCls} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mode de règlement">
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </FormField>
            <FormField label={needsDoc ? 'N° de pièce (obligatoire)' : 'N° de pièce (optionnel)'}>
              <input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className={`${inputCls} font-mono`} placeholder="CHQ-..." />
            </FormField>
          </div>
          <FormField label="Observations">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </FormField>
          <p className="text-xs text-text-muted">Le montant sera imputé sur les dus les plus anciens. L’aperçu suivant montre le détail avant confirmation.</p>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-3">
          <PreviewTable lines={preview.lines} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <PreviewStat label="Reçu" value={`${preview.tendered.toLocaleString('fr-MA')} MAD`} />
            <PreviewStat label="Imputé" value={`${preview.applied.toLocaleString('fr-MA')} MAD`} />
            <PreviewStat label="Crédit" value={`${preview.credit.toLocaleString('fr-MA')} MAD`} />
            <PreviewStat label="Reste après" value={`${preview.remaining_after.toLocaleString('fr-MA')} MAD`} alert={preview.remaining_after > 0} />
          </div>
        </div>
      )}

      {step === 'done' && recorded && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 text-sm bg-success-light text-success-dark rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span>Encaissement <strong className="font-mono">{recorded.receipts.encaissement_number}</strong> · Imputation <strong className="font-mono">{recorded.receipts.imputation_number}</strong>
              {recorded.credit > 0 && <> · Crédit : <strong>{recorded.credit.toLocaleString('fr-MA')} MAD</strong></>} · Reste : <strong>{recorded.remaining_after.toLocaleString('fr-MA')} MAD</strong></span>
          </div>
          {encUrl && (
            <div>
              <div className="text-sm font-medium mb-1">Reçu d’encaissement ({recorded.receipts.encaissement_number})</div>
              <iframe ref={encRef} src={encUrl} title="Reçu d’encaissement" className="w-full h-96 border border-surface-200 rounded-lg" />
            </div>
          )}
          {impUrl && (
            <div>
              <div className="text-sm font-medium mb-1">Reçu d’imputation ({recorded.receipts.imputation_number})</div>
              <iframe ref={impRef} src={impUrl} title="Reçu d’imputation" className="w-full h-96 border border-surface-200 rounded-lg" />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export function PreviewTable({ lines }: { lines: AllocationLine[] }) {
  if (!lines.length) return <p className="text-sm text-text-muted">Aucun dû ouvert : le montant sera conservé en crédit.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-text-muted border-b border-surface-200">
          <th className="py-2">Période</th><th>Lot</th><th className="text-right">Dû avant</th><th className="text-right">Imputé</th><th className="text-right">Reste</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => (
          <tr key={l.due_id ?? `${l.period_start}-${l.lot_number}`} className="border-b border-surface-100">
            <td className="py-2">{l.period_start} → {l.period_end}</td>
            <td>{l.lot_number ?? '—'}</td>
            <td className="text-right font-mono">{l.open_before.toLocaleString('fr-MA')}</td>
            <td className="text-right font-mono text-success-dark font-medium">{l.applied.toLocaleString('fr-MA')}</td>
            <td className="text-right font-mono font-medium">{l.open_after.toLocaleString('fr-MA')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PreviewStat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="p-3 bg-surface-50 rounded-lg">
      <div className="text-xs text-text-muted">{label}</div>
      <div className={`font-bold ${alert ? 'text-danger' : 'text-text-primary'}`}>{value}</div>
    </div>
  );
}

function extractError(err: unknown): string {
  const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
  return resp?.errors ? Object.values(resp.errors).flat().join(' ') : (resp?.message ?? 'Erreur inconnue');
}
