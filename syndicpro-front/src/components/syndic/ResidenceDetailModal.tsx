import { Building, DoorOpen, MapPin } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useResidence } from '@/hooks/useResidences';

interface Props {
  residenceId: number | null;
  onClose: () => void;
}

/**
 * Détail d'une résidence : immeubles et lots importés.
 * (Cliquer une carte résidence ouvre ceci, pas le formulaire d'édition.)
 */
export function ResidenceDetailModal({ residenceId, onClose }: Props) {
  const { data: residence, isLoading } = useResidence(residenceId ?? 0);
  const immeubles = residence?.immeubles ?? [];
  const totalLots = immeubles.reduce((n, im) => n + (im.appartements?.length ?? 0), 0);
  const totalTantiemes = immeubles.reduce(
    (sum, im) => sum + (im.appartements ?? []).reduce((s, a) => s + Number(a.tantieme ?? 0), 0),
    0
  );

  return (
    <Modal
      isOpen={residenceId !== null}
      onClose={onClose}
      title={residence ? residence.nom : 'Résidence'}
      size="lg"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
        >
          Fermer
        </button>
      }
    >
      {isLoading || !residence ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <MapPin className="w-4 h-4" />
            {residence.adresse} — {residence.ville}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Immeubles', value: immeubles.length },
              { label: 'Lots', value: totalLots },
              { label: 'Tantièmes', value: totalTantiemes },
            ].map((s) => (
              <div key={s.label} className="p-3 bg-surface-50 rounded-lg">
                <div className="text-xl font-bold text-text-primary">{s.value}</div>
                <div className="text-xs text-text-muted">{s.label}</div>
              </div>
            ))}
          </div>

          {immeubles.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              Aucun bâtiment pour le moment — utilisez « Importer CSV » pour ajouter des bâtiments et des lots.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {immeubles.map((im) => (
                <div key={im.id} className="border border-surface-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-surface-50">
                    <Building className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-medium text-text-primary">
                      {im.nom} — {im.appartements?.length ?? 0} lot{(im.appartements?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {(im.appartements?.length ?? 0) > 0 && (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-text-muted">
                          <th className="px-3 py-1.5 text-left font-medium">Lot</th>
                          <th className="px-3 py-1.5 text-right font-medium">Étage</th>
                          <th className="px-3 py-1.5 text-right font-medium">Tantièmes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {im.appartements!.map((a) => (
                          <tr key={a.id} className="border-t border-surface-100">
                            <td className="px-3 py-1.5">
                              <span className="inline-flex items-center gap-1.5 font-medium text-text-primary">
                                <DoorOpen className="w-3.5 h-3.5 text-text-muted" />
                                {a.numero}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-right">{a.etage}</td>
                            <td className="px-3 py-1.5 text-right">{a.tantieme}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
