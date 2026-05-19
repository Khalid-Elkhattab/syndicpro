import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore, type ToastType } from '@/store/uiStore';

const toastConfig: Record<ToastType, { icon: React.ReactNode; bg: string; border: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-success" />,
    bg: 'bg-success-light',
    border: 'border-success',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-danger" />,
    bg: 'bg-danger-light',
    border: 'border-danger',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-warning" />,
    bg: 'bg-warning-light',
    border: 'border-warning',
  },
  info: {
    icon: <Info className="w-5 h-5 text-info" />,
    bg: 'bg-info-light',
    border: 'border-info',
  },
};

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  id,
  type,
  message,
  onClose,
}: {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);
  const shouldReduceMotion = useReducedMotion();

  const handleClose = useCallback(() => onClose(id), [id, onClose]);

  useEffect(() => {
    const duration = 4000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(100 - (currentStep / steps) * 100);
      if (currentStep >= steps) {
        clearInterval(timer);
        handleClose();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [handleClose]);

  const config = toastConfig[type];

  return (
    <motion.div
      layout={!shouldReduceMotion}
      initial={shouldReduceMotion ? {} : { x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={shouldReduceMotion ? {} : { x: 100, opacity: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
      className={`pointer-events-auto relative w-80 ${config.bg} border ${config.border} rounded-xl shadow-toast overflow-hidden`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <p className="flex-1 text-sm text-text-primary">{message}</p>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-0.5 rounded text-text-muted hover:text-text-primary transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <motion.div
        className={`h-1 ${type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-info'}`}
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.05, ease: 'linear' }}
      />
    </motion.div>
  );
}
