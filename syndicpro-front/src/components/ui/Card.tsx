import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlighted';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, variant = 'default', hover = false, className = '', onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-xl shadow-card p-6';
  const variantClasses = variant === 'highlighted' ? 'border-2 border-brand-200' : '';
  const hoverClasses = hover ? 'cursor-pointer transition-shadow hover:shadow-card-lg' : '';

  const Component = hover ? motion.div : 'div';
  const motionProps = hover
    ? { whileHover: { y: -2 }, transition: { duration: 0.2 } }
    : {};

  return (
    <Component
      className={`${baseClasses} ${variantClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  );
}
