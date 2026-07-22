interface ReclamationBadgeProps {
  statut: 'nouveau' | 'en_cours' | 'traite' | 'rejete';
  label?: string;
  pulse?: boolean;
}

const statutConfig = {
  nouveau: {
    label: 'Nouveau',
    color: 'bg-info-light text-info-dark',
    dotColor: 'bg-info',
  },
  en_cours: {
    label: 'En cours',
    color: 'bg-warning-light text-warning-dark',
    dotColor: 'bg-warning',
  },
  traite: {
    label: 'Traité',
    color: 'bg-success-light text-success-dark',
    dotColor: 'bg-success',
  },
  rejete: {
    label: 'Rejeté',
    color: 'bg-surface-200 text-text-secondary',
    dotColor: 'bg-surface-300',
  },
};

export function ReclamationBadge({ statut, label, pulse = false }: ReclamationBadgeProps) {
  const config = statutConfig[statut];
  const displayLabel = label ?? config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {displayLabel}
      {pulse && statut === 'nouveau' && (
        <span
          className={`absolute inset-0 rounded-full ${config.dotColor}`}
          style={{
            opacity: 0.5,
            animation: 'reclamation-pulse 2s ease-in-out infinite',
          }}
        />
      )}
    </span>
  );
}

interface PrioriteBadgeProps {
  priorite: 'normale' | 'urgente';
  label?: string;
}

export function PrioriteBadge({ priorite, label }: PrioriteBadgeProps) {
  const config = {
    normale: {
      label: 'Normale',
      color: 'bg-surface-100 text-text-secondary',
    },
    urgente: {
      label: 'Urgente',
      color: 'bg-danger-light text-danger-dark',
    },
  };
  const displayLabel = label ?? config[priorite].label;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config[priorite].color}`}
    >
      {priorite === 'urgente' && '⚠️ '}
      {displayLabel}
    </span>
  );
}
