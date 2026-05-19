import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useUIStore } from '@/store/uiStore';
import { useCreateCotisationExceptionnelle, usePrevisualisation } from '@/hooks/useCotisations';
import { usePeriodes } from '@/hooks/useBudget';
import { StepIndicator } from './StepIndicator';
import { RepartitionPreview } from './RepartitionPreview';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';

interface WizardProps {
  onClose: () => void;
  residenceId: number;
}

const MODES = [
  { value: 'egale', label: 'Répartition Égale', description: 'Même montant pour tous les appartements', icon: '⚖️' },
  { value: 'par_appartement', label: 'Par Appartement', description: 'Définir manuellement par appartement', icon: '📋' },
  { value: 'par_tantieme', label: 'Par Tantième', description: 'Proportionnel aux tantièmes', icon: '📐' },
] as const;

const steps = ['Informations', 'Prévisualisation', 'Confirmation'];

export function CotisationExceptionnelleWizard({ onClose, residenceId }: WizardProps) {
  const [step, setStep] = useState(0);
  const addToast = useUIStore((s) => s.addToast);

  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [montantTotal, setMontantTotal] = useState('');
  const [periodeId, setPeriodeId] = useState<number | null>(null);
  const [mode, setMode] = useState<string>('egale');
  const [montantsMap, setMontantsMap] = useState<Record<number, number>>({});

  const { data: periodes } = usePeriodes(residenceId);
  const { data: previsData, isLoading: previsLoading } = usePrevisualisation(
    residenceId,
    step === 1 && label && montantTotal && periodeId
      ? { mode_repartition: mode, montant_total: parseFloat(montantTotal), periode_id: periodeId }
      : null
  );
  const createMutation = useCreateCotisationExceptionnelle();
  const [isSuccess, setIsSuccess] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const canGoNext = step === 0
    ? label.trim() && montantTotal && parseFloat(montantTotal) > 0 && periodeId
    : step === 1
    ? previsData && previsData.length > 0
    : true;

  const handleNext = () => {
    if (step < 2) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleGenerate = async () => {
    try {
      await createMutation.mutateAsync({
        residenceId,
        data: {
          label,
          montant_total: parseFloat(montantTotal),
          mode_repartition: mode as 'egale' | 'par_appartement' | 'par_tantieme',
          periode_id: periodeId!,
          description: description || undefined,
          montants_map: mode === 'par_appartement' ? montantsMap : undefined,
        },
      });
      setIsSuccess(true);
      setTimeout(() => {
        addToast('success', 'Cotisations générées avec succès.');
        onClose();
      }, 1000);
    } catch {
      addToast('error', 'Erreur lors de la génération des cotisations.');
    }
  };

  return (
    <div className="p-6">
      <StepIndicator steps={steps} currentStep={step} />

      <AnimatePresence mode="wait">
        {step === 0 && (
              <motion.div
                key="step3"
                initial={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
              >
            <FormField label="Label" required>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Réfection ascenseur"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </FormField>

            <FormField label="Description (optionnel)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm resize-none"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Montant total (DH)" required>
                <input
                  type="text"
                  inputMode="decimal"
                  value={montantTotal}
                  onChange={(e) => setMontantTotal(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm font-mono text-right"
                />
              </FormField>

              <FormField label="Période" required>
                <select
                  value={periodeId ?? ''}
                  onChange={(e) => setPeriodeId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {periodes?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.annee}{p.is_active ? ' (Actif)' : ''}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Mode de répartition" required>
              <div className="grid grid-cols-3 gap-3">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      mode === m.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{m.icon}</span>
                    <p className="text-sm font-semibold text-text-primary">{m.label}</p>
                    <p className="text-xs text-text-muted mt-1">{m.description}</p>
                  </button>
                ))}
              </div>
            </FormField>
          </motion.div>
        )}

        {step === 1 && (
              <motion.div
                key="step1"
                initial={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
              >
            {previsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : previsData && previsData.length > 0 ? (
              <RepartitionPreview
                items={previsData}
                mode={mode}
                montantTotal={parseFloat(montantTotal)}
                editable={mode === 'par_appartement'}
                montantsMap={montantsMap}
                onMontantChange={(id, v) => setMontantsMap((prev) => ({ ...prev, [id]: v }))}
              />
            ) : (
              <p className="text-center text-text-muted py-8">Impossible de calculer la répartition.</p>
            )}
          </motion.div>
        )}

        {step === 2 && (
              <motion.div
                key="step2"
                initial={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
              >
            {isSuccess ? (
              <motion.div
              initial={shouldReduceMotion ? { scale: 1 } : { scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
                className="flex flex-col items-center py-12"
              >
                <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <p className="text-lg font-semibold text-text-primary">Cotisations générées !</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-50 rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Label</p>
                    <p className="font-medium text-text-primary">{label}</p>
                  </div>
                  <div className="p-4 bg-surface-50 rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Montant total</p>
                    <p className="font-mono font-semibold text-text-primary">{formatCurrency(parseFloat(montantTotal))}</p>
                  </div>
                  <div className="p-4 bg-surface-50 rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Mode</p>
                    <p className="font-medium text-text-primary">{MODES.find((m) => m.value === mode)?.label}</p>
                  </div>
                  <div className="p-4 bg-surface-50 rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Appartements concernés</p>
                    <p className="font-medium text-text-primary">{previsData?.length ?? 0}</p>
                  </div>
                </div>

                <div className="p-4 bg-surface-50 rounded-lg">
                  <p className="text-xs text-text-muted mb-2">Aperçu des montants</p>
                  <div className="space-y-1">
                    {previsData?.slice(0, 3).map((item) => (
                      <div key={item.appartement_id} className="flex justify-between text-sm">
                        <span className="text-text-secondary">{item.numero} — {item.coproprietaire_nom}</span>
                        <span className="font-mono text-text-primary">{formatCurrency(item.montant_calcule)}</span>
                      </div>
                    ))}
                    {(previsData?.length ?? 0) > 3 && (
                      <p className="text-xs text-text-muted pt-1">
                        et {previsData!.length - 3} autre(s)...
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  isLoading={createMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  Générer les cotisations
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isSuccess && (
        <div className="flex justify-between mt-8 pt-4 border-t border-surface-200">
          <Button
            variant="secondary"
            onClick={step === 0 ? onClose : handleBack}
            disabled={createMutation.isPending}
          >
            {step === 0 ? (
              'Annuler'
            ) : (
              <><ArrowLeft className="w-4 h-4" /> Retour</>
            )}
          </Button>

          {step < 2 && (
            <Button onClick={handleNext} disabled={!canGoNext}>
              Suivant <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
