import { memo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { Paperclip } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { HorsBudget } from '@/types/entities.types';

interface HorsBudgetSectionProps {
  data: HorsBudget[];
  isLoading: boolean;
}

export const HorsBudgetSection = memo(function HorsBudgetSection({ data, isLoading }: HorsBudgetSectionProps) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-text-muted">
        Aucune dépense hors budget.
      </div>
    );
  }

  return (
    <TableVirtuoso
      style={{ height: `${Math.min(data.length * 53 + 43, 400)}px` }}
      totalCount={data.length}
      fixedHeaderContent={() => (
        <tr className="bg-surface-50">
          <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-left">Date</th>
          <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-left">Description</th>
          <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Montant</th>
          <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Justificatif</th>
        </tr>
      )}
      itemContent={(index) => {
        const hb = data[index];
        return (
          <>
            <td className="px-6 py-3 text-sm text-text-primary">{formatDate(hb.date)}</td>
            <td className="px-6 py-3 text-sm text-text-secondary">{hb.description}</td>
            <td className="px-6 py-3 text-sm font-mono font-semibold text-text-primary text-right">
              {formatCurrency(hb.montant)}
            </td>
            <td className="px-6 py-3 text-center">
              {hb.has_justificatif ? (
                <a href={hb.justificatif_url ?? '#'} target="_blank" rel="noopener noreferrer"
                  className="inline-flex p-1.5 rounded text-brand-600 hover:bg-brand-50 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </a>
              ) : (
                <span className="text-text-muted text-sm">—</span>
              )}
            </td>
          </>
        );
      }}
      className="overflow-x-auto w-full"
    />
  );
});
