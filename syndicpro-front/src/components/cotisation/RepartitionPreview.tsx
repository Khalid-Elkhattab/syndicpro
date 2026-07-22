import { motion } from '@/lib/motion';
import { formatCurrency } from '@/utils/formatCurrency';

interface PreviewItem {
  appartement_id: number;
  numero: string;
  coproprietaire_nom: string;
  tantieme?: number;
  total_tantiemes?: number;
  montant_calcule: number;
}

interface RepartitionPreviewProps {
  items: PreviewItem[];
  mode: 'egale' | 'par_appartement' | 'par_tantieme' | string;
  montantTotal: number;
  editable?: boolean;
  onMontantChange?: (appartementId: number, value: number) => void;
  montantsMap?: Record<number, number>;
}

export function RepartitionPreview({
  items,
  mode,
  montantTotal,
  editable = false,
  onMontantChange,
  montantsMap = {},
}: RepartitionPreviewProps) {
  const sumMontants = items.reduce((s, i) => s + (montantsMap[i.appartement_id] ?? i.montant_calcule), 0);
  const isBalanced = Math.abs(sumMontants - montantTotal) < 0.01;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-surface-200">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-100 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Appartement</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Copropriétaire</th>
              {mode === 'par_tantieme' && (
                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Tantième</th>
              )}
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Montant calculé</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <motion.tr
                key={item.appartement_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-t border-surface-100 hover:bg-surface-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-text-primary">{item.numero}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{item.coproprietaire_nom}</td>
                {mode === 'par_tantieme' && (
                  <td className="px-4 py-3 text-sm text-text-muted font-mono">
                    {item.tantieme}/{item.total_tantiemes}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  {editable && onMontantChange ? (
                    <input
                      type="text"
                      value={(montantsMap[item.appartement_id] ?? item.montant_calcule).toFixed(2)}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
                        onMontantChange(item.appartement_id, v);
                      }}
                      className="w-28 px-2 py-1 text-right font-mono text-sm border border-surface-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  ) : (
                    <span className="font-mono font-semibold text-text-primary text-sm">
                      {formatCurrency(item.montant_calcule)}
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-surface-200 bg-surface-50">
              <td colSpan={mode === 'par_tantieme' ? 3 : 2} className="px-4 py-3 text-sm font-semibold text-text-primary">
                Total
              </td>
              <td className={`px-4 py-3 text-right font-mono font-bold text-sm ${isBalanced ? 'text-success-dark' : 'text-danger-dark'}`}>
                {formatCurrency(sumMontants)}
                <span className="text-xs ml-1 text-text-muted">
                  / {formatCurrency(montantTotal)}
                </span>
                {!isBalanced && <span className="text-xs ml-1 text-danger">✗</span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {mode === 'par_tantieme' && items.length > 0 && items[0].tantieme !== undefined && (
        <div className="mt-4 p-4 bg-surface-50 rounded-lg text-sm text-text-secondary">
          <p className="font-medium text-text-primary mb-1">Formule appliquée :</p>
          <p className="font-mono text-xs">
            (tantième ÷ total_tantièmes) × montant_total = montant par appartement
          </p>
          {items.slice(0, 1).map((item) => (
            <p key={item.appartement_id} className="font-mono text-xs mt-1 text-text-muted">
              Ex. : {item.tantieme} ÷ {item.total_tantiemes} × {formatCurrency(montantTotal)} ={' '}
              {formatCurrency(item.montant_calcule)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
