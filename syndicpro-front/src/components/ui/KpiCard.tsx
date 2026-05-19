import { motion, useMotionValue, useSpring, useTransform, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { SkeletonLine } from './Skeleton';

interface KpiCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  color?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  format?: 'currency' | 'number' | 'custom';
  customFormat?: (value: number) => string;
}

const colorMap = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  danger: 'bg-danger-light text-danger-dark',
  info: 'bg-info-light text-info-dark',
};

const iconBgMap = {
  brand: 'bg-brand-100 text-brand-600',
  success: 'bg-success text-white',
  warning: 'bg-warning text-white',
  danger: 'bg-danger text-white',
  info: 'bg-info text-white',
};

export function KpiCard({
  label,
  value,
  prefix = '',
  suffix = '',
  icon,
  color = 'brand',
  trend,
  isLoading = false,
  format = 'currency',
  customFormat,
}: KpiCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 60, damping: 15 });
  const rounded = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    if (isInView && !isLoading) {
      motionValue.set(value);
    }
  }, [isInView, value, isLoading, motionValue]);

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  const displayValue = (v: number) => {
    if (format === 'currency') return formatCurrency(v);
    if (customFormat) return customFormat(v);
    return v.toLocaleString('fr-MA');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-surface-100 rounded-lg animate-pulse" />
          <div className="flex-1">
            <SkeletonLine width="60%" className="mb-1" />
            <SkeletonLine width="40%" />
          </div>
        </div>
        <SkeletonLine width="80%" />
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      whileHover={shouldReduceMotion ? {} : { y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)' }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      className="bg-white rounded-xl shadow-card p-6"
    >
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${iconBgMap[color]}`}>
            {icon}
          </div>
        )}
        {trend && (
          <span className={`text-sm font-medium ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-text-muted'}`}>
            {trendIcon}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-text-secondary mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${colorMap[color].split(' ')[1] || 'text-text-primary'}`}>
        {prefix}
        {shouldReduceMotion ? displayValue(value) : isInView ? displayValue(rounded.get()) : displayValue(0)}
        {suffix}
      </p>
    </motion.div>
  );
}
