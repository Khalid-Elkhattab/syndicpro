import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/formatCurrency';
import { BudgetProgressBar } from './BudgetProgressBar';
import type { BudgetCompte } from '@/api/budget.api';

interface BudgetRowProps {
  compte: BudgetCompte;
  onAddExpense?: (compteChargeId: number, sousChargeId?: number) => void;
  onEditBudget?: (budgetId: number, label: string, currentValue: number) => void;
}

export function BudgetRow({ compte, onAddExpense, onEditBudget }: BudgetRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-surface-100 last:border-b-0">
      <div
        className="flex items-center py-4 px-4 hover:bg-surface-50 cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="mr-3 text-text-muted hover:text-brand-600 transition-colors">
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary truncate">{compte.compte_charge.nom}</p>
        </div>

        <div className="w-28 text-right">
          <button
            onClick={(e) => { e.stopPropagation(); onEditBudget?.(compte.id, compte.compte_charge.nom, compte.montant_prevu); }}
            className="font-mono text-sm text-text-primary hover:text-brand-600 transition-colors cursor-pointer"
          >
            {formatCurrency(compte.montant_prevu)}
          </button>
        </div>

        <div className="w-28 text-right">
          <p className="font-mono text-sm text-text-primary">{formatCurrency(compte.montant_consomme)}</p>
        </div>

        <div className="w-28 text-right">
          <p className={`font-mono text-sm ${compte.montant_restant >= 0 ? 'text-success-dark' : 'text-danger-dark'}`}>
            {formatCurrency(compte.montant_restant)}
          </p>
        </div>

        <div className="w-20 px-2">
          <BudgetProgressBar percentage={compte.pourcentage_consomme} showLabel={false} />
        </div>

        <div className="w-12 text-center">
          {compte.est_depasse && (
            <span className="inline-flex items-center justify-center w-6 h-6 bg-danger-light text-danger rounded-full" title="Budget dépassé">
              ⚠️
            </span>
          )}
        </div>

        <div className="w-12 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddExpense?.(compte.compte_charge_id);
            }}
            className="p-1.5 text-brand-600 hover:bg-brand-50 rounded transition-colors"
            title="Ajouter une dépense"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && compte.sous_charges_detail && compte.sous_charges_detail.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-surface-50 border-t border-surface-100 overflow-hidden"
          >
            <div className="py-3 px-4 pl-12 space-y-2">
              {compte.sous_charges_detail.map((sc) => (
                <div key={sc.sous_charge.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{sc.sous_charge.nom}</span>
                  <span className="font-mono text-text-muted">{formatCurrency(sc.consomme)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}