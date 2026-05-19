import { motion } from 'framer-motion';

interface StatusBadgeProps {
  isActive: boolean;
  label?: string;
}

export function StatusBadge({ isActive, label }: StatusBadgeProps) {
  const displayLabel = label ?? (isActive ? 'Actif' : 'Désactivé');

  const bgColor = isActive ? '#dcfce7' : '#e2e8f0';

  return (
    <motion.span
      animate={{ backgroundColor: bgColor }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? 'text-success-dark'
          : 'text-text-secondary'
      }`}
    >
      {isActive ? '●' : '○'} {displayLabel}
    </motion.span>
  );
}