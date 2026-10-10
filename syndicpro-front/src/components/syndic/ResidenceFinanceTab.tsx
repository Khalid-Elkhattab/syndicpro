import { useState } from 'react';
import { useResidenceFinance, useUpdateResidenceFinance } from '@/hooks/useResidenceFinance';

const MODE_DESCRIPTIONS: Record<string, string> = {
  fixed: 'Montant mensuel fixe défini par type de lot (grille forfaitaire).',
  per_surface: 'Montant mensuel fixe par tranche de surface (ex : <100 m² → 300 MAD).',
  tantieme: 'Budget annuel ÷ tantièmes totaux, au prorata des tantièmes.',
};

const ARREARS_LABELS: Record<string, string> = {
  seller_pays: 'Vendeur paie (quitus exigé)',
  buyer_pays: 'Acquéreur paie',
  manual: 'Manuel',
};

/**
 * Paramètres financiers d'une résidence : mode de calcul par défaut +
 * décision annuelle votée en AG et actée au PV (un mode par exercice et par an).
 */
export function ResidenceFinanceTab({ residenceId }: { residenceId: number }) {
  const { data: finance, isLoading } = useResidenceFinance(residenceId);
  const updateMutation = useUpdateResidenceFinance();
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(0);

  const [defaultMode, setDefaultMode] = useState<string | null>(null);
  const [arrears, setArrears] = useState<string | null>(null);
  const [quitusDays, setQuitusDays] = useState<string>('');
  const [yearId, setYearId] = useState<string>('');
  const [yearMode, setYearMode] = useState('tantieme');
  const [assemblyId, setAssemblyId] = useState<string>('');

  if (isLoading || !finance) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-surface-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const currentDefault = defaultMode ?? finance.residence.calculation_mode ?? 'tantieme';

  const handleSaveDefault = async () => {
    setServerError(null);
    try {
      await updateMutation.mutateAsync({
        residenceId,
        calculation_mode: currentDefault,
        arrears_on_sale: arrears ?? finance.residence.arrears_on_sale ?? undefined,
        quitus_validity_days: quitusDays !== '' ? Number(quitusDays) : undefined,
      });
      setSavedTick((t) => t + 1);
    } catch (err: unknown) {
      setServerError(extractMessage(err));
    }
  };

  const handleRecordDecision = async () => {
    if (!yearId) return;
    setServerError(null);
    try {
      await updateMutation.mutateAsync({
        residenceId,
        fiscal_year_id: Number(yearId),
        year_calculation_mode: yearMode,
        assembly_id: assemblyId !== '' ? Number(assemblyId) : null,
      });
      setSavedTick((t) => t + 1);
    } catch (err: unknown) {
      setServerError(extractMessage(err));
    }
  };

  return (
    <div className="space-y-5" key={savedTick}>
      {serverError && (
        <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">
          {serverError}
        </div>
      )}

      {/* Mode par défaut de la résidence */}
      <section>
        <h4 className="text-sm font-semibold text-text-primary mb-1">Mode de calcul par défaut</h4>
        <p className="text-xs text-text-muted mb-3">
          Appliqué aux nouvelles cotisations, sauf décision annuelle contraire votée en AG.
        </p>
        <div className="grid sm:grid-cols-3 gap-2">
          {finance.modes.map((m) => (
            <label
              key={m.value}
              className={`cursor-pointer border rounded-lg p-3 text-sm transition-colors ${
                currentDefault === m.value
                  ? 'border-brand-600 bg-brand-50 text-text-primary'
                  : 'border-surface-200 text-text-secondary hover:border-brand-300'
              }`}
            >
              <input
                type="radio"
                name="default-mode"
                value={m.value}
                checked={currentDefault === m.value}
                onChange={(e) => setDefaultMode(e.target.value)}
                className="sr-only"
              />
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs text-text-muted mt-1">{MODE_DESCRIPTIONS[m.value] ?? ''}</div>
            </label>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <label className="block text-sm">
            <span className="text-text-secondary">Arriérés à la vente</span>
            <select
              value={arrears ?? finance.residence.arrears_on_sale ?? 'seller_pays'}
              onChange={(e) => setArrears(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-surface-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
            >
              {Object.entries(ARREARS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-text-secondary">Validité du quitus (jours)</span>
            <input
              type="number"
              min={1}
              max={365}
              placeholder={String(finance.residence.quitus_validity_days ?? 30)}
              value={quitusDays}
              onChange={(e) => setQuitusDays(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-surface-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
        </div>

        <button
          onClick={handleSaveDefault}
          disabled={updateMutation.isPending}
          className="mt-3 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </section>

      {/* Décision annuelle AG/PV */}
      <section className="border-t border-surface-100 pt-4">
        <h4 className="text-sm font-semibold text-text-primary mb-1">Décision annuelle (AG / PV)</h4>
        <p className="text-xs text-text-muted mb-3">
          Le mode se décide une fois par an en assemblée générale et est acté au PV. Liez l’AG correspondante.
        </p>

        <div className="space-y-2 mb-3">
          {finance.fiscal_years.length === 0 && (
            <p className="text-xs text-text-muted">Aucun exercice pour cette résidence.</p>
          )}
          {finance.fiscal_years.map((fy) => (
            <div key={fy.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-50 rounded-lg text-sm">
              <span className="font-medium text-text-primary">{fy.name}</span>
              <span className="text-text-secondary">
                {fy.calculation_mode_label ?? (
                  <span className="text-text-muted">Mode non décidé — défaut ({finance.residence.calculation_mode_label ?? '—'})</span>
                )}
              </span>
              <span className="text-xs text-text-muted">
                {fy.assembly ? `PV : ${fy.assembly.title}` : 'PV : —'}
              </span>
            </div>
          ))}
        </div>

        {finance.fiscal_years.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-2 items-end">
            <label className="block text-sm">
              <span className="text-text-secondary">Exercice</span>
              <select
                value={yearId}
                onChange={(e) => setYearId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-surface-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Choisir…</option>
                {finance.fiscal_years.map((fy) => (
                  <option key={fy.id} value={fy.id}>{fy.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-text-secondary">Mode voté</span>
              <select
                value={yearMode}
                onChange={(e) => setYearMode(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-surface-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
              >
                {finance.modes.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-text-secondary">PV (AG)</span>
              <select
                value={assemblyId}
                onChange={(e) => setAssemblyId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-surface-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Aucune (à lier plus tard)</option>
                {finance.assemblies.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {finance.fiscal_years.length > 0 && finance.assemblies.length === 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
            Aucune AG enregistrée pour cette résidence : la décision sera enregistrée sans référence PV.
          </p>
        )}

        {finance.fiscal_years.length > 0 && (
          <button
            onClick={handleRecordDecision}
            disabled={updateMutation.isPending || yearId === ''}
            className="mt-3 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Enregistrement...' : 'Acter la décision au PV'}
          </button>
        )}
      </section>
    </div>
  );
}

function extractMessage(err: unknown): string {
  const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
  if (!resp) return 'Une erreur est survenue.';
  if (resp.errors) return Object.values(resp.errors).flat().join(' ');
  return resp.message ?? 'Une erreur est survenue.';
}
