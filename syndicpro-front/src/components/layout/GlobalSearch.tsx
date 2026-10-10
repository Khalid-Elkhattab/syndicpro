import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Home, Loader2 } from 'lucide-react';
import { ownersApi, type OwnerListItem } from '@/api/owners.api';
import { useAuthStore } from '@/store/authStore';
import { useResidenceStore } from '@/store/residenceStore';
import { useResidences } from '@/hooks/useResidences';

/** Recherche globale (propriétaires + lots) dans la barre supérieure. `/` pour activer. */
export function GlobalSearch() {
  const user = useAuthStore((s) => s.user);
  const canView =
    user?.role === 'syndic' || (user?.role as string) === 'super_admin' ||
    (user?.permissions ?? []).includes('owners.view');
  const navigate = useNavigate();
  const selectedIds = useResidenceStore((s) => s.selectedIds);
  const { data: residences } = useResidences();
  const scopeIds = residences && selectedIds.length > 0 && selectedIds.length < residences.length
    ? selectedIds
    : undefined;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OwnerListItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!canView) return null;

  const search = (value: string) => {
    setQuery(value);
    setHighlight(0);
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await ownersApi.index({ search: q, per_page: 8, residence_ids: scopeIds });
        setResults(data.data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const go = (id: number) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    inputRef.current?.blur();
    navigate(`/syndic/proprietaires?dossier=${id}`);
  };

  return (
    <div ref={boxRef} className="relative hidden md:block w-64 lg:w-80 print:hidden">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => search(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
          if (e.key === 'Enter' && results[highlight]) go(results[highlight].id);
        }}
        placeholder="Rechercher (CIN, nom, lot…)  —  /"
        className="w-full pl-9 pr-8 py-1.5 bg-surface-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border border-surface-200 rounded-xl shadow-modal overflow-hidden z-50">
          {results.map((r, i) => (
            <button
              key={r.id}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => go(r.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${i === highlight ? 'bg-surface-100' : ''}`}
            >
              <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-text-primary truncate">{r.display_name}</span>
                <span className="block text-xs text-text-muted truncate">
                  {r.identity_number ?? 'sans CIN'}
                  {r.properties?.length ? <> · <Home className="w-3 h-3 inline" /> {r.properties.map((p) => p.lot_number ?? `#${p.lot_id}`).join(', ')}</> : ''}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim().length >= 2 && !loading && !results.length && (
        <div className="absolute top-full mt-1 w-full bg-white border border-surface-200 rounded-xl shadow-modal px-3 py-2 text-sm text-text-muted z-50">
          Aucun résultat.
        </div>
      )}
    </div>
  );
}
