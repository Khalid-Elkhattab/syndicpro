import { motion } from 'framer-motion';
import type { Periode } from '@/api/periode.api';

interface PeriodeTabsProps {
  periodes: Periode[];
  selectedPeriodeId: number | null;
  onSelect: (periodeId: number) => void;
  onAddNew?: () => void;
}

export function PeriodeTabs({ periodes, selectedPeriodeId, onSelect, onAddNew }: PeriodeTabsProps) {
  if (periodes.length === 0) {
    return (
      <div className="flex items-center justify-between mb-6">
        <p className="text-text-muted">Aucune période définie.</p>
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            + Nouvelle période
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      {periodes.map((periode) => (
        <button
          key={periode.id}
          onClick={() => onSelect(periode.id)}
          className={`relative px-4 py-2 rounded-full font-medium transition-all ${
            selectedPeriodeId === periode.id
              ? 'bg-brand-600 text-white'
              : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
          }`}
        >
          {periode.annee}
          {periode.is_active && (
            <span className="ml-1 text-xs bg-success text-white px-1.5 py-0.5 rounded-full">
              Actif
            </span>
          )}
          {selectedPeriodeId === periode.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-brand-600 rounded-full -z-10"
              transition={{ type: 'spring', duration: 0.3 }}
            />
          )}
        </button>
      ))}
      {onAddNew && (
        <button
          onClick={onAddNew}
          className="px-4 py-2 border-2 border-dashed border-surface-300 text-text-muted rounded-full hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          + Nouvelle
        </button>
      )}
    </div>
  );
}