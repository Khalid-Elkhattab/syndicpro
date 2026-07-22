/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, type ReactNode, type CSSProperties, type JSX } from 'react';

/* ── useReducedMotion ── */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

/* ── helpers ── */

type AnimateValue = string | number | number[] | boolean;

function toCssProps(obj: Record<string, AnimateValue> | undefined): Record<string, string> {
  if (!obj) return {};
  const out: Record<string, string> = {};
  const transforms: string[] = [];

  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'boolean' || Array.isArray(v)) continue;
    if (k === 'y') transforms.push(`translateY(${v}px)`);
    else if (k === 'x') transforms.push(`translateX(${v}px)`);
    else if (k === 'scale') transforms.push(`scale(${v})`);
    else if (k === 'width' || k === 'height') out[k] = typeof v === 'number' ? `${v}px` : String(v);
    else if (typeof v === 'number' && !['opacity', 'zIndex', 'fontWeight', 'lineHeight'].includes(k)) out[k] = `${v}px`;
    else out[k] = String(v);
  }

  if (transforms.length > 0) out.transform = transforms.join(' ');
  return out;
}

function buildTransitionForProps(props: string[], config?: TransitionConfig): string {
  if (!config) {
    const dur = '300ms';
    const fn = 'cubic-bezier(0.4,0,0.2,1)';
    return props.map(p => `${p} ${dur} ${fn}`).join(', ');
  }
  const { duration = 0.3, delay = 0, ease, type, stiffness, damping } = config;

  let timingFn: string;
  if (type === 'spring' || stiffness != null) {
    const s = stiffness ?? 300;
    const d = damping ?? 30;
    const tension = s / 1000;
    const friction = d / 30;
    timingFn = `cubic-bezier(${(0.25 * tension).toFixed(2)}, ${(1.5 - friction * 0.5).toFixed(2)}, ${(0.5 + friction * 0.25).toFixed(2)}, 1)`;
  } else if (ease === 'easeOut') {
    timingFn = 'cubic-bezier(0,0,0.2,1)';
  } else if (ease === 'easeIn') {
    timingFn = 'cubic-bezier(0.4,0,1,1)';
  } else {
    timingFn = 'cubic-bezier(0.4,0,0.2,1)';
  }

  const dur = `${duration}s`;
  const del = `${delay}s`;
  return props.map(p => `${p} ${dur} ${timingFn} ${del}`).join(', ');
}

interface TransitionConfig {
  duration?: number;
  delay?: number;
  ease?: string;
  type?: string;
  stiffness?: number;
  damping?: number;
}

export interface MotionProps {
  initial?: Record<string, AnimateValue> | false;
  animate: Record<string, AnimateValue>;
  exit?: Record<string, AnimateValue>;
  transition?: TransitionConfig;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  layoutId?: string;
  mode?: string;
  [key: string]: unknown;
}

/* ── AnimatePresence ── */

interface AnimatePresenceProps {
  children?: ReactNode;
  mode?: 'sync' | 'wait';
}

export function AnimatePresence({ children }: AnimatePresenceProps) {
  return <>{children}</>;
}

/* ── motion proxy ── */

function MotionElement({ tag, style, className, children, ...rest }: { tag: keyof JSX.IntrinsicElements; style?: CSSProperties; className?: string; children?: ReactNode; [key: string]: unknown }) {
  const Tag = tag;
  return <Tag style={style} className={className} {...rest}>{children}</Tag>;
}

function createMotionComponent(tag: keyof JSX.IntrinsicElements) {
  function MotionComponent({
    initial,
    animate,
    exit: _exit,
    transition,
    style,
    className,
    children,
    layoutId: _layoutId,
    mode: _mode,
    ...rest
  }: MotionProps) {
    const reduced = useReducedMotion();
    const shouldAnimate = initial !== false && initial !== undefined && !reduced;
    const [ready, setReady] = useState(!shouldAnimate);
    const mountedRef = useRef(true);

    useEffect(() => {
      mountedRef.current = true;
      return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
      if (!ready && mountedRef.current) setReady(true);
    }, [ready]);

    const currentStyles = (!ready && initial && typeof initial === 'object') ? initial : animate;
    const cssProps = toCssProps(currentStyles);

    const animProps = new Set<string>();
    for (const k of Object.keys(animate)) {
      if (typeof animate[k] !== 'boolean' && !Array.isArray(animate[k])) animProps.add(k);
    }
    if (initial && typeof initial === 'object') {
      for (const k of Object.keys(initial)) {
        if (typeof initial[k] !== 'boolean' && !Array.isArray(initial[k])) animProps.add(k);
      }
    }
    const transitionProps = [...animProps].filter(k => k !== 'delay');
    const transitionStr = reduced ? 'none' : buildTransitionForProps(transitionProps, transition);

    const finalStyle: CSSProperties = {
      transition: transitionStr,
      ...style,
      ...cssProps,
    };

    return (
      <MotionElement
        tag={tag}
        style={finalStyle}
        className={className}
        {...rest}
      >
        {children}
      </MotionElement>
    );
  }
  MotionComponent.displayName = `motion.${String(tag)}`;
  return MotionComponent;
}

export const motion = {
  div: createMotionComponent('div'),
  span: createMotionComponent('span'),
  tr: createMotionComponent('tr'),
  td: createMotionComponent('td'),
  li: createMotionComponent('li'),
  p: createMotionComponent('p'),
  section: createMotionComponent('section'),
  button: createMotionComponent('button'),
} as const;
