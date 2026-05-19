import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { useResidenceStore } from '@/store/residenceStore';
import { useResidences } from '@/hooks/useResidences';

interface ResidenceSelectorProps {
  collapsed: boolean;
}

export function ResidenceSelector({ collapsed }: ResidenceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeResidence, setActiveResidence } = useResidenceStore();
  const { data: residences } = useResidences();

  useEffect(() => {
    if (!activeResidence && residences && residences.length > 0) {
      setActiveResidence(residences[0]);
    }
  }, [residences, activeResidence, setActiveResidence]);

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
      <div className="px-4 py-3 border-b border-brand-800 flex justify-center">
        <Building2 className="w-5 h-5 text-brand-300" />
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative px-4 py-3 border-b border-brand-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 text-sm text-brand-200 hover:text-white transition-colors"
      >
        <Building2 className="w-4 h-4 flex-shrink-0" />
        <span className="truncate flex-1 text-left">
          {activeResidence?.nom ?? 'Sélectionner...'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && residences && (
        <div className="absolute left-2 right-2 top-full mt-1 bg-white rounded-lg shadow-dropdown border border-surface-200 overflow-hidden z-50">
          {residences.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setActiveResidence(r);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-brand-50 transition-colors ${
                activeResidence?.id === r.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-text-primary'
              }`}
            >
              <Building2 className="w-4 h-4 flex-shrink-0 text-text-muted" />
              <span className="truncate flex-1">{r.nom}</span>
              <span className="text-xs text-text-muted bg-surface-100 px-1.5 py-0.5 rounded">
                {r.nb_immeubles}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
