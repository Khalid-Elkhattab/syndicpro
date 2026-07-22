import { motion } from '@/lib/motion';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isCompleted ? '#16a34a' : isActive ? '#4f46e5' : '#e2e8f0',
                }}
                transition={{ duration: 0.3 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCompleted || isActive ? 'text-white' : 'text-text-muted'
                } ${isActive ? 'ring-2 ring-brand-200 ring-offset-2' : ''}`}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                ) : (
                  index + 1
                )}
              </motion.div>
              <span
                className={`text-xs mt-2 font-medium ${
                  isActive ? 'text-brand-600' : isCompleted ? 'text-success' : 'text-text-muted'
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <motion.div
                initial={false}
                animate={{ backgroundColor: isCompleted ? '#4f46e5' : '#e2e8f0' }}
                transition={{ duration: 0.3 }}
                className="w-16 h-0.5 mx-3 mb-6"
                style={{ backgroundColor: isCompleted ? '#4f46e5' : '#e2e8f0' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
