import { BudgetSummaryCards } from '@/components/budget/BudgetSummaryCards';
import { BudgetTable } from '@/components/budget/BudgetTable';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import type { BudgetSummary } from '@/api/budget.api';
import type { RapportBudgetResponse } from '@/api/rapport.api';

interface BudgetTabProps {
  rapportBudget: RapportBudgetResponse | undefined;
  summary: BudgetSummary | null;
  summaryLoading: boolean;
  handleExportBudget: () => void;
}

export default function BudgetTab({ rapportBudget, summary, summaryLoading, handleExportBudget }: BudgetTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Budget Prévisionnel</h2>
        {rapportBudget && (
          <Button variant="secondary" size="sm" onClick={handleExportBudget}>
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        )}
      </div>
      <BudgetSummaryCards summary={summary ?? undefined} isLoading={summaryLoading} />
      <BudgetTable summary={summary ?? undefined} isLoading={summaryLoading} />
    </>
  );
}
