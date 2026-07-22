import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/utils/formatCurrency';

interface BudgetBarChartProps {
  data: Array<{
    nom: string;
    prevu: number;
    consomme: number;
  }>;
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white border border-surface-200 rounded-lg shadow-dropdown p-3">
      <p className="text-sm font-medium text-text-primary mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: entry.fill }} />
          <span className="text-text-secondary">{entry.name === 'prevu' ? 'Prévu' : 'Consommé'}</span>
          <span className="font-mono font-semibold text-text-primary">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function BudgetBarChart({ data, isLoading }: BudgetBarChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="h-4 bg-surface-200 rounded w-48 mb-4 animate-pulse" />
        <div className="h-[300px] bg-surface-100 rounded animate-pulse" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6 text-center">
        <p className="text-text-muted">Aucune donnée disponible pour le graphique.</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label="Graphique du budget par compte de charges" className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-base font-semibold text-text-primary mb-4">Budget par compte de charges</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={4} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="nom"
            tick={{ fontSize: 12, fill: '#475569' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#475569' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm text-text-secondary">
                {value === 'prevu' ? 'Budget prévu' : 'Consommé'}
              </span>
            )}
          />
          <Bar
            dataKey="prevu"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            name="prevu"
          />
          <Bar
            dataKey="consomme"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            name="consomme"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
