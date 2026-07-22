interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  emptyMessage?: string;
  getRowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  pagination,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'Aucune donnée disponible.',
  getRowKey,
  onRowClick,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    onSort(key, sortDirection === 'asc' && sortKey === key ? 'desc' : 'asc');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-text-muted">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-200">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="bg-surface-100 text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                aria-sort={col.sortable ? (sortKey === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                className={`px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-text-primary select-none' : ''}`}
                style={{ width: col.width }}
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && onSort && (
                    <span className="text-text-muted text-sm">
                      {sortKey === col.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={getRowKey(row)}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              className={`border-t border-surface-100 hover:bg-brand-50/50 transition-colors animate-fade-in-up ${onRowClick ? 'cursor-pointer' : ''}`}
              style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
              onClick={() => onRowClick?.(row)}
              onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick?.(row); } } : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-text-primary">
                  {col.render
                    ? col.render(row, index)
                    : (row as Record<string, unknown>)[col.key]?.toString() ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && pagination.total > pagination.perPage && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
          <span className="text-sm text-text-muted">
            {(pagination.page - 1) * pagination.perPage + 1}–
            {Math.min(pagination.page * pagination.perPage, pagination.total)} sur {pagination.total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              aria-label="Page précédente"
              className="px-3 py-1 text-sm border border-surface-300 rounded-lg hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.perPage)}
              aria-label="Page suivante"
              className="px-3 py-1 text-sm border border-surface-300 rounded-lg hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
