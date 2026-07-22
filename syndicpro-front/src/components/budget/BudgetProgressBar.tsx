import { memo } from 'react';
import { motion } from '@/lib/motion';

interface BudgetProgressBarProps {
  percentage: number;
  showLabel?: boolean;
}

export const BudgetProgressBar = memo(function BudgetProgressBar({ percentage, showLabel = true }: BudgetProgressBarProps) {
  const getColor = () => {
    if (percentage >= 85) return 'bg-danger';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="w-full">
      <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${getColor()}`}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-text-muted mt-1 text-right">
          {percentage.toFixed(1)}%
        </p>
      )}
    </div>
  );
});