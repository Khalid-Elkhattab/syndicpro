import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/utils/formatCurrency';

interface DepensePieChartProps {
  data: Array<{
    nom: string;
    value: number;
    color: string;
  }>;
  isLoading?: boolean;
}

const DEFAULT_COLORS = ['#6366f1', '#f59e0b', '#16a34a', '#dc2626', '#2563eb', '#8b5cf6'];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { nom: string; total: number } }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const total = entry.payload?.total || 0;
  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-white border border-surface-200 rounded-lg shadow-dropdown p-3">
      <p className="text-sm font-medium text-text-primary mb-1">{entry.name}</p>
      <p className="text-sm font-mono text-text-primary">{formatCurrency(entry.value)}</p>
      <p className="text-xs text-text-muted">{pct}% du total</p>
    </div>
  );
}

export function DepensePieChart({ data, isLoading }: DepensePieChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="h-4 bg-surface-200 rounded w-40 mb-4 animate-pulse" />
        <div className="flex items-center justify-center h-[250px]">
          <div className="w-40 h-40 bg-surface-100 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6 text-center">
        <p className="text-text-muted">Aucune donnée disponible.</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div role="img" aria-label="Graphique de répartition des dépenses" className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-base font-semibold text-text-primary mb-4">Répartition des dépenses</h3>
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              nameKey="nom"
            >
              {data.map((entry, index) => (
                <Cell key={entry.nom} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-4">
          {data.map((entry, index) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={entry.nom} className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                />
                <span className="text-text-secondary truncate flex-1">{entry.nom}</span>
                <span className="font-mono text-text-muted text-xs">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
