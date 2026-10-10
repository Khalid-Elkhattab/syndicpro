import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Building2, Check } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useResidences } from '@/hooks/useResidences';

interface ResidenceSelectorProps {
  collapsed: boolean;
}

export function ResidenceSelector({ collapsed }: ResidenceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeResidence, setActiveResidence, setPrimaryResidence, selectedIds, toggleResidence, selectAllResidences, multiSelect, setMultiSelect } = useResidenceStore();
  const { data: residences } = useResidences();

  // Défaut : sélection simple sur la première résidence (comportement historique).
  useEffect(() => {
    if (residences && residences.length > 0 && selectedIds.length === 0) {
      if (multiSelect) {
        selectAllResidences(residences.map((r) => r.id));
        if (!activeResidence) setPrimaryResidence(residences[0]);
      } else if (!activeResidence) {
        setActiveResidence(residences[0]);
      }
    }
  }, [residences, selectedIds, activeResidence, multiSelect, selectAllResidences, setActiveResidence, setPrimaryResidence]);

  // Le primaire suit toujours la sélection (première résidence sélectionnée).
  useEffect(() => {
    if (residences && selectedIds.length > 0 && !selectedIds.includes(activeResidence?.id ?? -1)) {
      const first = residences.find((r) => selectedIds.includes(r.id));
      if (first) setPrimaryResidence(first);
    }
  }, [residences, selectedIds, activeResidence, setPrimaryResidence]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (collapsed) {
    return (
      <div className="px-4 py-3 border-b border-brand-800 flex justify-center" title={`${selectedIds.length} résidence(s)`}>
        <Building2 className="w-5 h-5 text-brand-300" />
      </div>
    );
  }

  const total = residences?.length ?? 0;
  const allSelected = total > 0 && selectedIds.length >= total;
  const visible = (residences ?? []).filter((r) => r.nom.toLowerCase().includes(filter.toLowerCase()));
  const label = allSelected
    ? 'Toutes les résidences'
    : selectedIds.length <= 1
      ? (activeResidence?.nom ?? 'Sélectionner...')
      : `${selectedIds.length} résidences`;

  return (
    <div ref={dropdownRef} className="relative px-4 py-3 border-b border-brand-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 text-sm text-brand-200 hover:text-white transition-colors"
      >
        <Building2 className="w-4 h-4 flex-shrink-0" />
        <span className="truncate flex-1 text-left">{label}</span>
        {!allSelected && selectedIds.length > 1 && (
          <span className="text-[10px] font-bold bg-brand-600 text-white rounded-full px-1.5 py-0.5">{selectedIds.length}</span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && residences && (
        <div className="absolute left-2 right-2 top-full mt-1 bg-white rounded-lg shadow-dropdown border border-surface-200 overflow-hidden z-50">
          <div className="p-2 border-b border-surface-100 space-y-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrer..."
              className="w-full px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted bg-white border border-surface-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex rounded-lg bg-surface-100 p-0.5 text-xs font-medium">
              <button
                onClick={() => setMultiSelect(false)}
                className={`flex-1 px-2 py-1 rounded-md transition-colors ${!multiSelect ? 'bg-white text-brand-700 shadow-sm' : 'text-text-muted'}`}
              >
                Simple
              </button>
              <button
                onClick={() => setMultiSelect(true)}
                className={`flex-1 px-2 py-1 rounded-md transition-colors ${multiSelect ? 'bg-white text-brand-700 shadow-sm' : 'text-text-muted'}`}
              >
                Multiple
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {multiSelect && (
              <button
                onClick={() => selectAllResidences(residences.map((r) => r.id))}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-brand-50 transition-colors border-b border-surface-100"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${allSelected ? 'bg-brand-600 border-brand-600' : 'border-surface-300'}`}>
                  {allSelected && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className={`flex-1 ${allSelected ? 'text-brand-700 font-medium' : 'text-text-primary'}`}>Toutes les résidences</span>
              </button>
            )}
            {visible.map((r) => {
              const checked = selectedIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    if (multiSelect) {
                      toggleResidence(r.id);
                    } else {
                      setActiveResidence(r);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-brand-50 transition-colors ${
                    checked ? 'text-brand-700' : 'text-text-primary'
                  }`}
                >
                  {multiSelect && (
                    <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-brand-600 border-brand-600' : 'border-surface-300'}`}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                  )}
                  <Building2 className="w-4 h-4 flex-shrink-0 text-text-muted" />
                  <span className="truncate flex-1">{r.nom}</span>
                  <span className="text-xs text-text-muted bg-surface-100 px-1.5 py-0.5 rounded">
                    {r.nb_immeubles}
                  </span>
                </button>
              );
            })}
            {!visible.length && <div className="px-3 py-2 text-sm text-text-muted">Aucune résidence.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
