type BadgeColor = 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const colorClasses: Record<BadgeColor, string> = {
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  danger: 'bg-danger-light text-danger-dark',
  info: 'bg-info-light text-info-dark',
  gray: 'bg-surface-200 text-text-secondary',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({ label, color = 'gray', pulse = false, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colorClasses[color]} ${sizeClasses[size]}`}
    >
      {pulse && (
        <span
          className={`w-2 h-2 rounded-full animate-pulse ${color === 'gray' ? 'bg-text-muted' : color === 'info' ? 'bg-info' : color === 'success' ? 'bg-success' : color === 'warning' ? 'bg-warning' : 'bg-danger'}`}
        />
      )}
      {!pulse && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
      {label}
    </span>
  );
}
