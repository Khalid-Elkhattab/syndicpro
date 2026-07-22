import { memo } from 'react';
import { motion, useReducedMotion } from '@/lib/motion';
import { formatCurrency } from '@/utils/formatCurrency';
import { BudgetRow } from './BudgetRow';
import type { BudgetSummary } from '@/api/budget.api';

interface BudgetTableProps {
  summary: BudgetSummary | undefined;
  isLoading: boolean;
  onAddExpense?: (compteChargeId: number, sousChargeId?: number) => void;
  onEditBudget?: (budgetId: number, label: string, currentValue: number) => void;
}

export const BudgetTable = memo(function BudgetTable({ summary, isLoading, onAddExpense, onEditBudget }: BudgetTableProps) {
  const shouldReduceMotion = useReducedMotion();
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-surface-100 flex items-center px-4 gap-4">
              <div className="w-5 h-5 bg-surface-100 rounded" />
              <div className="flex-1 h-4 bg-surface-100 rounded" />
              <div className="w-28 h-4 bg-surface-100 rounded" />
              <div className="w-28 h-4 bg-surface-100 rounded" />
              <div className="w-28 h-4 bg-surface-100 rounded" />
              <div className="w-20 h-4 bg-surface-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary || summary.par_compte.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 text-center">
        <p className="text-text-muted">Aucun compte de charges défini pour cette période.</p>
      </div>
    );
  }

  const totalPrevu = summary.par_compte.reduce((sum, c) => sum + c.montant_prevu, 0);
  const totalConsomme = summary.par_compte.reduce((sum, c) => sum + c.montant_consomme, 0);
  const totalRestant = totalPrevu - totalConsomme;
  const globalPercentage = totalPrevu > 0 ? (totalConsomme / totalPrevu) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-surface-100 text-xs font-semibold text-text-secondary uppercase tracking-wider">
        <div className="col-span-3">Compte de charges</div>
        <div className="col-span-2 text-right">Prévu</div>
        <div className="col-span-2 text-right">Consommé</div>
        <div className="col-span-2 text-right">Restant</div>
        <div className="col-span-2 text-center">Progression</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      <div>
        {summary.par_compte.map((compte) => (
          <motion.div
            key={compte.id}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 0 }}
          >
            <BudgetRow compte={compte} onAddExpense={onAddExpense} onEditBudget={onEditBudget} />
          </motion.div>
        ))}
      </div>

      <div className="border-t-2 border-surface-200 bg-surface-50 py-4 px-4">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-3 font-semibold text-text-primary">TOTAL</div>
          <div className="col-span-2 text-right font-mono font-semibold text-text-primary">
            {formatCurrency(totalPrevu)}
          </div>
          <div className="col-span-2 text-right font-mono font-semibold text-text-primary">
            {formatCurrency(totalConsomme)}
          </div>
          <div className="col-span-2 text-right font-mono font-semibold text-text-primary">
            <span className={totalRestant >= 0 ? 'text-success-dark' : 'text-danger-dark'}>
              {formatCurrency(totalRestant)}
            </span>
          </div>
          <div className="col-span-2 px-2">
            <div className="h-3 bg-surface-200 rounded-full overflow-hidden">
              <motion.div
                initial={shouldReduceMotion ? { width: `${Math.min(globalPercentage, 100)}%` } : { width: 0 }}
                animate={{ width: `${Math.min(globalPercentage, 100)}%` }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  globalPercentage >= 85 ? 'bg-danger' : globalPercentage >= 60 ? 'bg-warning' : 'bg-success'
                }`}
              />
            </div>
          </div>
          <div className="col-span-1" />
        </div>
      </div>
    </div>
  );
});