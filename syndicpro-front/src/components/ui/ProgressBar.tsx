import { motion, useReducedMotion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  colorAuto?: boolean;
  color?: 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

const colorMap = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  colorAuto = false,
  color,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  let barColor = color ? colorMap[color] : 'bg-brand-500';
  if (colorAuto) {
    barColor = percentage >= 85 ? 'bg-danger' : percentage >= 60 ? 'bg-warning' : 'bg-success';
  }

  const height = size === 'sm' ? 'h-2' : 'h-3';
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 ${height} bg-surface-200 rounded-full overflow-hidden`}>
        <motion.div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          initial={shouldReduceMotion ? { width: `${percentage}%` } : { width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
          className={`${height} rounded-full ${barColor}`}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-text-secondary font-mono min-w-[3rem] text-right">
          {percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%
        </span>
      )}
    </div>
  );
}
