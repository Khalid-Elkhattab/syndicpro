import { Link } from 'react-router-dom';

const KNOWN_ROUTES = new Set([
  '/login',
  '/activate/:token',
  '/syndic/dashboard',
  '/coproprietaires/dashboard',
]);

function isInternalUsable(href: string | null | undefined): href is string {
  if (!href) return false;
  if (href.startsWith('http')) return true;
  if (KNOWN_ROUTES.has(href)) return true;
  // Public landing anchors and pages always exist once shipped.
  if (href.startsWith('/#') || href === '/' || href === '/ar') return true;
  if (href.startsWith('/mentions-legales') || href.startsWith('/confidentialite')) return true;
  if (href.startsWith('/ar/mentions-legales') || href.startsWith('/ar/confidentialite')) return true;
  return false;
}

/**
 * Never render a broken href: unknown internal targets fall back
 * to a disabled "coming soon" style. External URLs pass through.
 */
export function SafeLink({
  href,
  fallback,
  children,
  className = '',
  onClick,
}: {
  href: string | null | undefined;
  fallback: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (!isInternalUsable(href)) {
    return (
      <span
        className={`${className} cursor-not-allowed opacity-50`}
        title={fallback}
        aria-disabled="true"
      >
        {children}
      </span>
    );
  }

  if (href.startsWith('http')) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
