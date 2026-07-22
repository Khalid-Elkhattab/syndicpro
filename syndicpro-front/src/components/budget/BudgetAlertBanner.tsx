import { memo } from 'react';
import { motion } from '@/lib/motion';
import type { BudgetSummary } from '@/api/budget.api';

interface BudgetAlertBannerProps {
  summary: BudgetSummary | undefined;
  onScrollToDepassed?: () => void;
}

export const BudgetAlertBanner = memo(function BudgetAlertBanner({ summary, onScrollToDepassed }: BudgetAlertBannerProps) {
  if (!summary) return null;

  const depassedCount = summary.par_compte.filter((c) => c.est_depasse).length;

  if (depassedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-danger-light border border-danger rounded-lg p-4 mb-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-medium text-danger-dark">
            {depassedCount} compte(s) en dépassement de budget
          </p>
          <p className="text-sm text-danger">
            Les dépenses dépassent le budget prévu pour ces comptes.
          </p>
        </div>
      </div>
      {onScrollToDepassed && (
        <button
          onClick={onScrollToDepassed}
          className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger-dark transition-colors text-sm font-medium"
        >
          Voir les détails
        </button>
      )}
    </motion.div>
  );
});