import { Plus, Search, FileX, Building2, CreditCard, AlertCircle } from 'lucide-react';

type EmptyStateType = 'default' | 'create' | 'search' | 'error' | 'payment' | 'residence' | 'door' | 'budget' | 'reclamation';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: EmptyStateType;
}

const icons: Record<string, typeof Building2> = {
  default: FileX,
  create: Plus,
  search: Search,
  error: AlertCircle,
  payment: CreditCard,
  residence: Building2,
  door: FileX,
  budget: Building2,
  reclamation: FileX,
};

function SvgIllustration({ type }: { type: EmptyStateType }) {
  if (type === 'payment') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-4">
        <rect x="10" y="25" width="60" height="35" rx="4" className="fill-brand-100 stroke-brand-300" strokeWidth="2" />
        <rect x="20" y="33" width="25" height="8" rx="2" className="fill-surface-200" />
        <circle cx="55" cy="52" r="8" className="fill-brand-400" />
        <path d="M52 52h6M55 49v6" className="stroke-white" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="12" y="28" width="56" height="4" rx="1" className="fill-brand-200" />
      </svg>
    );
  }
  if (type === 'residence') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-4">
        <rect x="15" y="30" width="50" height="35" rx="3" className="fill-brand-100 stroke-brand-300" strokeWidth="2" />
        <polygon points="10,32 40,10 70,32" className="fill-brand-200 stroke-brand-400" strokeWidth="2" strokeLinejoin="round" />
        <rect x="30" y="45" width="20" height="20" rx="2" className="fill-brand-50 stroke-brand-300" strokeWidth="1.5" />
        <rect x="34" y="49" width="12" height="3" rx="1" className="fill-brand-300" />
        <rect x="34" y="55" width="12" height="3" rx="1" className="fill-brand-300" />
      </svg>
    );
  }
  if (type === 'door') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-4">
        <rect x="20" y="10" width="40" height="60" rx="4" className="fill-brand-100 stroke-brand-300" strokeWidth="2" />
        <rect x="25" y="15" width="30" height="50" rx="2" className="fill-brand-50" />
        <circle cx="47" cy="42" r="3" className="fill-brand-400" />
        <rect x="45" y="30" width="2" height="20" className="fill-brand-300" />
        <rect x="20" y="8" width="40" height="4" rx="2" className="fill-brand-200" />
      </svg>
    );
  }
  if (type === 'budget') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-4">
        <rect x="10" y="30" width="60" height="40" rx="4" className="fill-brand-100 stroke-brand-300" strokeWidth="2" />
        <rect x="15" y="35" width="50" height="6" rx="2" className="fill-brand-200" />
        <rect x="15" y="45" width="12" height="18" rx="2" className="fill-brand-400" />
        <rect x="32" y="50" width="10" height="13" rx="2" className="fill-brand-300" />
        <rect x="47" y="42" width="14" height="21" rx="2" className="fill-brand-200" />
        <rect x="15" y="58" width="50" height="3" rx="1" className="fill-brand-200" />
      </svg>
    );
  }
  if (type === 'reclamation') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-4">
        <rect x="15" y="10" width="50" height="50" rx="4" className="fill-brand-100 stroke-brand-300" strokeWidth="2" />
        <rect x="22" y="18" width="36" height="4" rx="2" className="fill-brand-200" />
        <rect x="22" y="27" width="28" height="3" rx="1.5" className="fill-brand-300" />
        <rect x="22" y="35" width="24" height="3" rx="1.5" className="fill-brand-300" />
        <rect x="22" y="43" width="20" height="3" rx="1.5" className="fill-brand-300" />
        <circle cx="58" cy="58" r="8" className="fill-warning-light stroke-warning" strokeWidth="2" />
        <path d="M58 54v4M58 61v1" className="stroke-warning-dark" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}

export function EmptyState({ title, description, action, type = 'default' }: EmptyStateProps) {
  const svg = SvgIllustration({ type });
  const Icon = icons[type];

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in-up"
      role="status"
      aria-live="polite"
    >
      {svg ?? (
        <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-text-muted" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted text-center max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}
