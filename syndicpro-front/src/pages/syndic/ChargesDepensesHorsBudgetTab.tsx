import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Pencil, Trash2, Paperclip, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { HorsBudget } from '@/types/entities.types';

interface HorsBudgetTabProps {
  horsBudgetsData: HorsBudget[];
  loadingHorsBudgets: boolean;
  horsBudgetsMeta: { current_page: number; per_page: number; total: number; last_page: number } | undefined;
  hbPage: number;
  hbDateDebut: string;
  hbDateFin: string;
  onOpenCreate: () => void;
  onOpenEdit: (item: HorsBudget) => void;
  onDelete: (type: string, id: number, label: string) => void;
  onFilterChange: (filters: { dateDebut?: string; dateFin?: string }) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export default function HorsBudgetTab({
  horsBudgetsData, loadingHorsBudgets, horsBudgetsMeta, hbPage,
  hbDateDebut, hbDateFin,
  onOpenCreate, onOpenEdit, onDelete,
  onFilterChange, onPageChange, onResetFilters,
}: HorsBudgetTabProps) {
  return (
    <div className="bg-white rounded-xl shadow-card">
      <div className="p-6 bg-warning-light/30">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium text-warning-dark">Dépenses hors budget</span>
            </div>
            <label className="text-sm text-text-secondary ml-2">Du :</label>
            <input
              type="date"
              value={hbDateDebut}
              onChange={(e) => onFilterChange({ dateDebut: e.target.value })}
              className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
            />
            <label className="text-sm text-text-secondary">Au :</label>
            <input
              type="date"
              value={hbDateFin}
              onChange={(e) => onFilterChange({ dateFin: e.target.value })}
              className="px-3 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
            />
            {(hbDateDebut || hbDateFin) && (
              <button onClick={onResetFilters} className="text-xs text-brand-600 hover:underline">
                Réinitialiser
              </button>
            )}
          </div>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle dépense hors budget
          </button>
        </div>

        {loadingHorsBudgets ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : horsBudgetsData.length === 0 ? (
          <EmptyState
            title="Aucune dépense hors budget"
            description="Les dépenses non prévues au budget apparaîtront ici."
            action={{ label: '+ Ajouter une dépense', onClick: onOpenCreate }}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-surface-200">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-surface-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Montant</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Justificatif</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {horsBudgetsData.map((hb) => (
                  <tr key={hb.id} className="border-t border-surface-100 hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-primary">{formatDate(hb.date)}</td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-text-primary text-right">
                      {formatCurrency(hb.montant)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate">{hb.description}</td>
                    <td className="px-4 py-3 text-center">
                      {hb.has_justificatif ? (
                        <a href={hb.justificatif_url ?? '#'} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors">
                          <Paperclip className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-text-muted text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onOpenEdit(hb)} className="p-1.5 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete('horsBudget', hb.id, formatDate(hb.date))} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {horsBudgetsMeta && horsBudgetsMeta.total > horsBudgetsMeta.per_page && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
                <span className="text-sm text-text-muted">
                  {(horsBudgetsMeta.current_page - 1) * horsBudgetsMeta.per_page + 1}–{Math.min(horsBudgetsMeta.current_page * horsBudgetsMeta.per_page, horsBudgetsMeta.total)} sur {horsBudgetsMeta.total}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => onPageChange(Math.max(1, hbPage - 1))}
                    disabled={hbPage <= 1}
                    className="px-3 py-1 text-sm border border-surface-300 rounded-lg hover:bg-surface-100 disabled:opacity-50">
                    Précédent
                  </button>
                  <button onClick={() => onPageChange(hbPage + 1)}
                    disabled={hbPage >= (horsBudgetsMeta?.last_page ?? 1)}
                    className="px-3 py-1 text-sm border border-surface-300 rounded-lg hover:bg-surface-100 disabled:opacity-50">
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
