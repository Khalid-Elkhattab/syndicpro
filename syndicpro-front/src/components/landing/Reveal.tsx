import { useEffect, useRef } from 'react';

/** Adds .is-visible when the element scrolls into view. Respects prefers-reduced-motion via CSS. */
export function Reveal({
  children,
  className = '',
  as: Tag = 'div',
  id,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
  id?: string;
  role?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const setRef = (el: HTMLElement | null) => {
    ref.current = el;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={setRef} id={id} role={role} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}
