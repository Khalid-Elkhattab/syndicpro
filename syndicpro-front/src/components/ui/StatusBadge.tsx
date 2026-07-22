interface StatusBadgeProps {
  isActive: boolean;
  label?: string;
}

export function StatusBadge({ isActive, label }: StatusBadgeProps) {
  const displayLabel = label ?? (isActive ? 'Actif' : 'Désactivé');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
        isActive
          ? 'bg-green-100 text-success-dark'
          : 'bg-surface-200 text-text-secondary'
      }`}
    >
      {isActive ? '●' : '○'} {displayLabel}
    </span>
  );
}
