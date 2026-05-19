import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, Banknote, Building2, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { useCoproprietaires } from '@/hooks/useCoproprietaires';
import { useCotisations } from '@/hooks/useCotisations';
import { formatCurrency } from '@/utils/formatCurrency';

interface EnregistrerPaiementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    cotisations_detail_id: number;
    date_paiement: string;
    montant: number;
    mode_paiement: 'especes' | 'virement' | 'cheque' | 'carte';
    reference?: string;
  }) => Promise<void>;
  residenceId: number;
  preselectedDetailId?: number | null;
}

interface CoproprietairesSelect {
  id: number;
  name: string;
  email: string;
}

export function EnregistrerPaiementModal({
  isOpen,
  onClose,
  residenceId,
  preselectedDetailId,
  onSubmit,
}: EnregistrerPaiementModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState<'coproprietaire' | 'cotisation' | 'paiement'>('coproprietaire');
  const [selectedCoproprietaires, setSelectedCoproprietaires] = useState<CoproprietairesSelect | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCotisationDetail, setSelectedCotisationDetail] = useState<{
    id: number;
    label: string;
    montant: number;
    montant_paye: number;
    montant_restant: number;
  } | null>(null);

  const { data: coproprietairesResponse } = useCoproprietaires({ search: searchQuery, residence_id: residenceId });
  const coproprietairesData = coproprietairesResponse?.data ?? [];
  const { data: cotisationsData } = useCotisations(residenceId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      date_paiement: new Date().toISOString().split('T')[0],
      montant: '',
      mode_paiement: 'especes' as const,
      reference: '',
    },
  });

  const watchedMontant = watch('montant');
  const watchedMode = watch('mode_paiement');

  useEffect(() => {
    if (!isOpen) {
      setStep('coproprietaire');
      setSelectedCoproprietaires(null);
      setSelectedCotisationDetail(null);
      setSearchQuery('');
    } else if (preselectedDetailId && cotisationsData) {
      for (const cotisation of cotisationsData) {
        const details = cotisation.cotisation_details ?? [];
        for (const detail of details) {
          if (detail.id === preselectedDetailId) {
            setSelectedCotisationDetail({
              id: detail.id,
              label: `${cotisation.label}`,
              montant: detail.montant,
              montant_paye: detail.montant_paye,
              montant_restant: detail.montant_restant,
            });
            setSelectedCoproprietaires({
              id: detail.coproprietaire_id,
              name: '',
              email: '',
            });
            setValue('montant', detail.montant_restant.toString());
            setStep('paiement');
            return;
          }
        }
      }
    }
  }, [isOpen, preselectedDetailId, cotisationsData, setValue]);

  const filteredCoproprietaires = coproprietairesData?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const getCotisationsDetailsForCoproprietaires = () => {
    if (!selectedCoproprietaires || !cotisationsData) return [];
    
    const details: Array<{
      id: number;
      label: string;
      montant: number;
      montant_paye: number;
      montant_restant: number;
    }> = [];

    cotisationsData.forEach((cotisation) => {
      if (cotisation.cotisation_details) {
       cotisation.cotisation_details.forEach((detail) => {
          if (detail.coproprietaire_id === selectedCoproprietaires.id && detail.statut !== 'paye') {
            details.push({
              id: detail.id,
              label: `${cotisation.label} - ${detail.apppartement?.numero ?? ''}`,
              montant: detail.montant,
              montant_paye: detail.montant_paye,
              montant_restant: detail.montant_restant,
            });
          }
        });
      }
    });
    return details;
  };

  const calculateRemainingAfterPayment = () => {
    if (!selectedCotisationDetail || !watchedMontant) return 0;
    const amount = parseFloat(watchedMontant) || 0;
    return selectedCotisationDetail.montant_restant - amount;
  };

  const handleSelectCoproprietaires = (c: CoproprietairesSelect) => {
    setSelectedCoproprietaires(c);
    setStep('cotisation');
  };

  const handleSelectCotisation = (detail: typeof selectedCotisationDetail) => {
    setSelectedCotisationDetail(detail);
    setValue('montant', detail.montant_restant.toString());
    setStep('paiement');
  };

  const handleFormSubmit = async (formData: {
    date_paiement: string;
    montant: string;
    mode_paiement: 'especes' | 'virement' | 'cheque' | 'carte';
    reference: string;
  }) => {
    if (!selectedCotisationDetail) return;

    await onSubmit({
      cotisations_detail_id: selectedCotisationDetail.id,
      date_paiement: formData.date_paiement,
      montant: parseFloat(formData.montant),
      mode_paiement: formData.mode_paiement,
      reference: formData.reference || undefined,
    });
  };

  const modeOptions = [
    { value: 'especes', label: 'Espèces', icon: Banknote },
    { value: 'virement', label: 'Virement', icon: Building2 },
    { value: 'cheque', label: 'Chèque', icon: FileText },
    { value: 'carte', label: 'Carte', icon: CreditCard },
  ] as const;

  const remaining = calculateRemainingAfterPayment();
  const isOverpaid = remaining < 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, y: 40, scale: 0.95 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg bg-white rounded-xl shadow-modal overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-surface-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  Enregistrer un paiement
                </h2>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center mt-4 space-x-2 text-sm">
                <span className={`px-2 py-1 rounded ${step === 'coproprietaire' ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-text-muted'}`}>
                  1. Copropriétaire
                </span>
                <span className="text-text-muted">→</span>
                <span className={`px-2 py-1 rounded ${step === 'cotisation' ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-text-muted'}`}>
                  2. Cotisation
                </span>
                <span className="text-text-muted">→</span>
                <span className={`px-2 py-1 rounded ${step === 'paiement' ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-text-muted'}`}>
                  3. Paiement
                </span>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {step === 'coproprietaire' && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Rechercher un copropriétaire
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nom ou email..."
                      className="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    {filteredCoproprietaires.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCoproprietaires(c)}
                        className="w-full p-3 text-left border border-surface-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                      >
                        <div className="font-medium text-text-primary">{c.name}</div>
                        <div className="text-sm text-text-muted">{c.email}</div>
                      </button>
                    ))}
                    {filteredCoproprietaires.length === 0 && (
                      <p className="text-center text-text-muted py-4">
                        Aucun copropriétaire trouvé
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 'cotisation' && (
                <div>
                  <div className="mb-4 p-3 bg-surface-50 rounded-lg">
                    <span className="text-sm text-text-muted">Copropriétaire sélectionné: </span>
                    <span className="font-medium text-text-primary">{selectedCoproprietaires?.name}</span>
                  </div>

                  <h3 className="text-sm font-medium text-text-secondary mb-3">
                    Sélectionner une cotisation impayée
                  </h3>

                  <div className="space-y-2">
                    {getCotisationsDetailsForCoproprietaires().map((detail) => (
                      <button
                        key={detail.id}
                        onClick={() => handleSelectCotisation(detail)}
                        className="w-full p-4 text-left border border-surface-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
                      >
                        <div className="font-medium text-text-primary">{detail.label}</div>
                        <div className="mt-1 flex justify-between text-sm">
                          <span className="text-text-muted">Montant: {formatCurrency(detail.montant)}</span>
                          <span className="text-text-muted">Restant: {formatCurrency(detail.montant_restant)}</span>
                        </div>
                      </button>
                    ))}
                    {getCotisationsDetailsForCoproprietaires().length === 0 && (
                      <p className="text-center text-text-muted py-4">
                        Aucune cotisation impayée pour ce copropriétaire
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setStep('coproprietaire')}
                    className="mt-4 text-sm text-brand-600 hover:text-brand-700"
                  >
                    ← Retour
                  </button>
                </div>
              )}

              {step === 'paiement' && (
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                  <div className="mb-4 p-3 bg-surface-50 rounded-lg">
                    <div className="text-sm text-text-muted">Cotisation sélectionnée</div>
                    <div className="font-medium text-text-primary">{selectedCotisationDetail?.label}</div>
                    <div className="text-sm text-text-muted">
                      Restant à payer: {formatCurrency(selectedCotisationDetail?.montant_restant ?? 0)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Montant (DH)
                      </label>
                      <input
                        type="text"
                        {...register('montant', { required: true, min: 0.01 })}
                        className={`w-full px-3 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-brand-500 ${errors.montant ? 'border-danger' : 'border-surface-300'}`}
                        placeholder="0,00"
                      />
                      {errors.montant && (
                        <p className="text-danger text-xs mt-1">Le montant est obligatoire</p>
                      )}
                      {isOverpaid && (
                        <p className="text-danger text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Le montant dépasse le restant à payer
                        </p>
                      )}
                    </div>

                    <AnimatePresence mode="wait">
                      {watchedMontant && parseFloat(watchedMontant) > 0 && selectedCotisationDetail && (
                        <motion.div
                          initial={shouldReduceMotion ? { height: 'auto', opacity: 1 } : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={shouldReduceMotion ? { height: 'auto', opacity: 1 } : { opacity: 0, height: 0 }}
                          className={`p-3 rounded-lg text-sm ${remaining >= 0 ? 'bg-success-light text-success-dark' : 'bg-danger-light text-danger-dark'}`}
                        >
                          Restant après ce paiement: {formatCurrency(Math.max(0, remaining))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Date de paiement
                      </label>
                      <input
                        type="date"
                        {...register('date_paiement', { required: true })}
                        className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Mode de paiement
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {modeOptions.map((mode) => (
                          <label
                            key={mode.value}
                            className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${watchedMode === mode.value ? 'border-brand-500 bg-brand-50' : 'border-surface-200 hover:border-surface-300'}`}
                          >
                            <input
                              type="radio"
                              {...register('mode_paiement')}
                              value={mode.value}
                              className="sr-only"
                            />
                            <mode.icon className="w-5 h-5 text-text-muted" />
                            <span className="text-sm font-medium text-text-primary">{mode.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Référence (optionnel)
                      </label>
                      <input
                        type="text"
                        {...register('reference')}
                        placeholder={watchedMode === 'virement' ? 'N° de virement' : watchedMode === 'cheque' ? 'N° de chèque' : ''}
                        className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setStep('cotisation')}
                      className="flex-1 px-4 py-2 border border-surface-300 rounded-lg text-text-secondary hover:bg-surface-50"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isOverpaid}
                      className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Enregistrement...' : 'Enregistrer le paiement'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}