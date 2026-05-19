import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Image } from 'lucide-react';

interface DepenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  comptesCharges: Array<{
    id: number;
    nom: string;
    sous_charges: Array<{ id: number; nom: string; compte_charge_id: number }>;
  }>;
  initialData?: {
    id?: number;
    sous_charge_id?: number;
    date?: string;
    montant?: number;
    description?: string;
  };
  mode: 'depense' | 'horsBudget';
  onError?: (message: string) => void;
}

interface GroupedSousCharges {
  [compteChargeId: number]: {
    compteChargeNom: string;
    sousCharges: Array<{ id: number; nom: string }>;
  };
}

export function DepenseFormModal({
  isOpen,
  onClose,
  onSubmit,
  comptesCharges,
  initialData,
  mode,
  onError,
}: DepenseFormModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompteCharge, setSelectedCompteCharge] = useState<number | null>(null);

  const grouped: GroupedSousCharges = {};
  comptesCharges.forEach((cc) => {
    if (cc.sous_charges && cc.sous_charges.length > 0) {
      grouped[cc.id] = {
        compteChargeNom: cc.nom,
        sousCharges: cc.sous_charges.map((sc) => ({ id: sc.id, nom: sc.nom })),
      };
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      sous_charge_id: initialData?.sous_charge_id ?? '',
      date: initialData?.date ?? new Date().toISOString().split('T')[0],
      montant: initialData?.montant ?? '',
      description: initialData?.description ?? '',
    },
  });

  const watchedSousChargeId = watch('sous_charge_id');
  const watchedMontant = watch('montant');

  const formatAmount = (value: string): string => {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleMontantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setValue('montant', raw);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        onError?.('Le fichier ne doit pas dépasser 5 Mo.');
        return;
      }
      setFile(f);
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (mode === 'depense' && data.sous_charge_id) {
        formData.append('sous_charge_id', String(data.sous_charge_id));
      }
      formData.append('date', String(data.date));
      formData.append('montant', String(data.montant));
      formData.append('description', String(data.description));
      if (file) {
        formData.append('justificatif', file);
      }
      await onSubmit(formData);
      reset();
      setFile(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setFile(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-lg bg-white rounded-xl shadow-modal"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="text-lg font-semibold text-text-primary">
                {initialData?.id
                  ? `Modifier la ${mode === 'horsBudget' ? 'dépense hors budget' : 'dépense'}`
                  : `Nouvelle ${mode === 'horsBudget' ? 'dépense hors budget' : 'dépense'}`}
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {mode === 'depense' && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-text-secondary">
                    Sous-charge <span className="text-danger">*</span>
                  </label>
                  <select
                    {...register('sous_charge_id')}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm"
                  >
                    <option value="">Sélectionnez une sous-charge</option>
                    {Object.entries(grouped).map(([ccId, cc]) => (
                      <optgroup key={ccId} label={cc.compteChargeNom}>
                        {cc.sousCharges.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            {sc.nom}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.sous_charge_id && (
                    <p className="text-sm text-danger">{errors.sous_charge_id.message as string}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-text-secondary">
                    Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm"
                  />
                  {errors.date && (
                    <p className="text-sm text-danger">{errors.date.message as string}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-text-secondary">
                    Montant (DH) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      {...register('montant')}
                      onChange={handleMontantChange}
                      placeholder="0,00"
                      className="w-full px-3 py-2 pr-12 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm font-mono text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted font-medium">
                      DH
                    </span>
                  </div>
                  {errors.montant && (
                    <p className="text-sm text-danger">{errors.montant.message as string}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-text-secondary">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  maxLength={1000}
                  placeholder="Description de la dépense..."
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm resize-none"
                />
                <div className="flex justify-between">
                  {errors.description && (
                    <p className="text-sm text-danger">{errors.description.message as string}</p>
                  )}
                  <span className="text-xs text-text-muted ml-auto">
                    {(watch('description') ?? '').length}/1000
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-text-secondary">
                  Justificatif <span className="text-text-muted">(optionnel)</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    file
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-surface-300 hover:border-brand-400 hover:bg-surface-50'
                  }`}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      {file.type.includes('pdf') ? (
                        <FileText className="w-6 h-6 text-brand-600" />
                      ) : (
                        <Image className="w-6 h-6 text-brand-600" />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium text-text-primary">{file.name}</p>
                        <p className="text-xs text-text-muted">
                          {(file.size / 1024).toFixed(1)} Ko
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="ml-auto p-1 rounded text-text-muted hover:text-danger"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-text-muted" />
                      <p className="text-sm text-text-muted">
                        Glissez un fichier ou{' '}
                        <span className="text-brand-600 font-medium">cliquez pour sélectionner</span>
                      </p>
                      <p className="text-xs text-text-muted">PDF, JPG, PNG — max 5 Mo</p>
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}