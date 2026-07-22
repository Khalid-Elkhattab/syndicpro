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
  const hoverClasses = hover ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
