import { memo } from 'react';
import { motion, useReducedMotion } from '@/lib/motion';
import { formatCurrency } from '@/utils/formatCurrency';
import { EmptyState } from '@/components/ui/EmptyState';
import type { BudgetSummary } from '@/api/budget.api';

interface BudgetSummaryCardsProps {
  summary: BudgetSummary | undefined;
  isLoading: boolean;
}

export const BudgetSummaryCards = memo(function BudgetSummaryCards({ summary, isLoading }: BudgetSummaryCardsProps) {
  const shouldReduceMotion = useReducedMotion();
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-card p-6">
            <div className="h-4 bg-surface-100 rounded w-24 mb-2 animate-pulse" />
            <div className="h-8 bg-surface-100 rounded w-32 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return <EmptyState type="budget" title="Aucun budget" description="Aucune donnée budgétaire disponible pour cette période." />;
  }

  const cards = [
    {
      label: 'Budget Prévu',
      value: summary.prevu_total,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
    {
      label: 'Total Consommé',
      value: summary.consomme_total,
      color: 'text-warning-dark',
      bg: 'bg-warning-light',
    },
    {
      label: 'Restant',
      value: summary.restant_total,
      color: summary.restant_total >= 0 ? 'text-success-dark' : 'text-danger-dark',
      bg: summary.restant_total >= 0 ? 'bg-success-light' : 'bg-danger-light',
    },
    {
      label: 'Hors Budget',
      value: summary.hors_budget_total,
      color: 'text-warning-dark',
      bg: 'bg-warning-light',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <motion.div
          key={card.label}
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0 }}
          className={`bg-white rounded-xl shadow-card p-6 ${card.bg}`}
        >
          <p className="text-sm font-medium text-text-secondary mb-1">{card.label}</p>
          <p className={`text-2xl font-bold font-mono ${card.color}`}>
            {formatCurrency(card.value)}
          </p>
        </motion.div>
      ))}
    </div>
  );
});