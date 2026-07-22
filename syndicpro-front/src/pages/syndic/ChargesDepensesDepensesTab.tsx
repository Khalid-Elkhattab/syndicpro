import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Pencil, Trash2, Paperclip } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { Depense, CompteCharge } from '@/types/entities.types';

interface DepensesTabProps {
  depensesData: Depense[];
  loadingDepenses: boolean;
  depensesMeta: { current_page: number; per_page: number; total: number; last_page: number } | undefined;
  depensePage: number;
  filterCompteChargeDepenses: number | null;
  depenseDateDebut: string;
  depenseDateFin: string;
  compteCharges: CompteCharge[];
  onOpenCreate: () => void;
  onOpenEdit: (item: Depense) => void;
  onDelete: (type: string, id: number, label: string) => void;
  onFilterChange: (filters: { compteChargeId?: number | null; dateDebut?: string; dateFin?: string }) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export default function DepensesTab({
  depensesData, loadingDepenses, depensesMeta, depensePage,
  filterCompteChargeDepenses, depenseDateDebut, depenseDateFin,
  compteCharges, onOpenCreate, onOpenEdit, onDelete,
  onFilterChange, onPageChange, onResetFilters,
}: DepensesTabProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-text-secondary">Compte :</label>
          <select
            value={filterCompteChargeDepenses ?? ''}
            onChange={(e) => onFilterChange({ compteChargeId: e.target.value ? Number(e.target.value) : null })}
            className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tous</option>
            {compteCharges.map((cc) => (
              <option key={cc.id} value={cc.id}>{cc.nom}</option>
            ))}
          </select>
          <label className="text-sm text-text-secondary ml-2">Du :</label>
          <input
            type="date"
            value={depenseDateDebut}
            onChange={(e) => onFilterChange({ dateDebut: e.target.value })}
            className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
          />
          <label className="text-sm text-text-secondary">Au :</label>
          <input
            type="date"
            value={depenseDateFin}
            onChange={(e) => onFilterChange({ dateFin: e.target.value })}
            className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
          />
          {(filterCompteChargeDepenses || depenseDateDebut || depenseDateFin) && (
            <button onClick={onResetFilters} className="text-xs text-brand-600 hover:underline">
              Réinitialiser
            </button>
          )}
        </div>
        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouvelle dépense
        </button>
      </div>

      {loadingDepenses ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : depensesData.length === 0 ? (
        <EmptyState
          title="Aucune dépense enregistrée"
          description="Toutes les dépenses de cette période apparaîtront ici."
          action={{ label: '+ Ajouter une dépense', onClick: onOpenCreate }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-surface-200">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-surface-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Sous-Charge</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Compte</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Montant</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Justificatif</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {depensesData.map((dep) => (
                <tr key={dep.id} className="border-t border-surface-100 hover:bg-brand-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary">{formatDate(dep.date)}</td>
                  <td className="px-4 py-3 text-sm text-text-primary">{dep.sous_charge?.nom ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{dep.sous_charge?.compte_charge?.nom ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-text-primary text-right">
                    {formatCurrency(dep.montant)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate">{dep.description}</td>
                  <td className="px-4 py-3 text-center">
                    {dep.has_justificatif ? (
                      <a href={dep.justificatif_url ?? '#'} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors" title="Voir le justificatif">
                        <Paperclip className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-text-muted text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onOpenEdit(dep)} className="p-1.5 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete('depenses', dep.id, formatDate(dep.date))} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {depensesMeta && depensesMeta.total > depensesMeta.per_page && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
              <span className="text-sm text-text-muted">
                {(depensesMeta.current_page - 1) * depensesMeta.per_page + 1}–{Math.min(depensesMeta.current_page * depensesMeta.per_page, depensesMeta.total)} sur {depensesMeta.total}
              </span>
              <div className="flex gap-2">
                <button onClick={() => onPageChange(Math.max(1, depensePage - 1))}
                  disabled={depensePage <= 1}
                  className="px-3 py-1 text-sm border border-surface-300 rounded-lg hover:bg-surface-100 disabled:opacity-50">
                  Précédent
                </button>
                <button onClick={() => onPageChange(depensePage + 1)}
                  disabled={depensePage >= (depensesMeta?.last_page ?? 1)}
                  className="px-3 py-1 text-sm border border-surface-300 rounded-lg hover:bg-surface-100 disabled:opacity-50">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
