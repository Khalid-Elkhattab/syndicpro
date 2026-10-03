import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileCheck, TriangleAlert, CircleCheck, Download, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useResidenceStore } from '@/store/residenceStore';
import { lotsImportApi, type LotsImportPreview, type LotsImportResult } from '@/api/lotsImport.api';
import type { Residence } from '@/types/entities.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  residences: Residence[];
  defaultResidenceId?: number | null;
}

/**
 * Assistant d'import CSV : résidence → fichier → prévisualisation (dry-run) → import.
 * Tous les types de lots acceptés : appartement, studio, duplex, magasin, bureau, villa, grande surface, autre.
 */
export function LotsImportWizard({ isOpen, onClose, residences, defaultResidenceId }: Props) {
  const qc = useQueryClient();
  const { activeResidence, setActiveResidence } = useResidenceStore();
  const [residenceId, setResidenceId] = useState<number | null>(
    defaultResidenceId ?? activeResidence?.id ?? residences[0]?.id ?? null
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<LotsImportPreview | null>(null);
  const [result, setResult] = useState<LotsImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (!residenceId || !file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await lotsImportApi.preview(residenceId, file);
      setPreview(data.data);
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      const details = resp?.errors ? Object.values(resp.errors).flat().join(' ') : '';
      setError(details || resp?.message || "Échec de l'analyse du fichier.");
    } finally {
      setLoading(false);
    }
  };

  const targetResidence = residences.find((r) => r.id === residenceId) ?? null;

  const handleViewResidence = () => {
    if (targetResidence) {
      // Aligne le sélecteur latéral sur la résidence importée : toutes les
      // pages (Immeubles, Lots, ...) afficheront ces données.
      setActiveResidence(targetResidence);
    }
    reset();
    onClose();
  };

  const handleCommit = async () => {
    if (!residenceId || !file) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await lotsImportApi.commit(residenceId, file);
      setResult(data.data);
      qc.invalidateQueries({ queryKey: ['residences'] });
      qc.invalidateQueries({ queryKey: ['immeubles'] });
      qc.invalidateQueries({ queryKey: ['appartements'] });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? "Échec de l'import.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([lotsImportApi.template()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele_lots.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { reset(); onClose(); }}
      title="Importer bâtiments + lots (CSV)"
      size="lg"
      footer={
        <>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Modèle CSV
          </button>
          {result ? (
            <>
              <button
                onClick={() => { reset(); onClose(); }}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={handleViewResidence}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                Voir la résidence
              </button>
            </>
          ) : preview && !preview.errors.length ? (
            <button
              onClick={handleCommit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Import...' : `Importer ${preview.rows_total} lot${preview.rows_total !== 1 ? 's' : ''}`}
            </button>
          ) : (
            <button
              onClick={handlePreview}
              disabled={loading || !file || !residenceId}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Analyse...' : 'Prévisualiser'}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Résidence</label>
          <select
            value={residenceId ?? ''}
            onChange={(e) => { setResidenceId(Number(e.target.value)); setPreview(null); setResult(null); }}
            className="w-full px-4 py-2.5 border border-surface-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
          >
            {residences.map((r) => (
              <option key={r.id} value={r.id}>{r.nom} — {r.ville}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Fichier CSV</label>
          <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-surface-300 rounded-lg cursor-pointer hover:border-brand-400 transition-colors">
            <Upload className="w-5 h-5 text-text-muted" />
            <span className="text-sm text-text-secondary">
              {file ? file.name : 'Choisir un fichier .csv (séparateur ; ou , détecté)'}
            </span>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setResult(null); setError(null); }}
            />
          </label>
          <p className="text-xs text-text-muted mt-1">
            Colonnes : building, lot_number, type (appartement, studio, duplex, magasin, bureau, villa, grande surface, autre + alias FR), surface, tantieme, land_title_no, parking, parking_numbers (P1|P2), box, box_numbers, floor, notes.
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-danger bg-danger-light border border-danger-border rounded-lg">{error}</div>
        )}

        {preview && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                { label: 'Lignes', value: preview.rows_total },
                { label: 'Bâtiments à créer', value: preview.to_create_buildings },
                { label: 'Lots à créer', value: preview.to_create_lots },
                { label: 'Lots à mettre à jour', value: preview.to_update_lots },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-surface-50 rounded-lg">
                  <div className="text-xl font-bold text-text-primary">{s.value}</div>
                  <div className="text-xs text-text-muted">{s.label}</div>
                </div>
              ))}
            </div>

            {preview.errors.length > 0 && (
              <div className="p-3 bg-danger-light border border-danger-border rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-danger mb-1">
                  <TriangleAlert className="w-4 h-4" /> {preview.errors.length} erreur{preview.errors.length !== 1 ? 's' : ''} — corrigez avant d'importer
                </div>
                <ul className="text-xs text-danger space-y-0.5 max-h-32 overflow-y-auto">
                  {preview.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            )}

            {preview.warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-sm font-medium text-amber-700 mb-1">Avertissements ({preview.warnings.length})</div>
                <ul className="text-xs text-amber-700 space-y-0.5 max-h-24 overflow-y-auto">
                  {preview.warnings.slice(0, 10).map((w, i) => <li key={i}>• {w}</li>)}
                </ul>
              </div>
            )}

            {preview.preview_rows.length > 0 && (
              <div className="overflow-x-auto border border-surface-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-surface-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Bât.</th>
                      <th className="px-3 py-2 text-left font-medium">Lot</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-right font-medium">Surface</th>
                      <th className="px-3 py-2 text-right font-medium">Tantièmes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((r, i) => (
                      <tr key={i} className="border-t border-surface-100">
                        <td className="px-3 py-1.5">{r.building}</td>
                        <td className="px-3 py-1.5 font-medium">{r.lot_number}</td>
                        <td className="px-3 py-1.5">{r.type_label}</td>
                        <td className="px-3 py-1.5 text-right">{r.surface ?? '—'}</td>
                        <td className="px-3 py-1.5 text-right">{r.tantieme}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!preview.errors.length && (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <FileCheck className="w-4 h-4" /> Fichier valide — vérifié sans rien créer. Cliquez « Importer » pour enregistrer.
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 mb-1">
              <CircleCheck className="w-4 h-4" /> Import terminé
              {targetResidence && (
                <span className="font-normal">— {targetResidence.nom} ({targetResidence.ville})</span>
              )}
            </div>
            <p className="text-sm text-emerald-700">
              {result.created_buildings} bâtiment{result.created_buildings !== 1 ? 's' : ''} créé{result.created_buildings !== 1 ? 's' : ''}, {result.created_lots} lot{result.created_lots !== 1 ? 's' : ''} créé{result.created_lots !== 1 ? 's' : ''}, {result.updated_lots} mis à jour.
            </p>
            {result.warnings.length > 0 && (
              <ul className="text-xs text-emerald-700 mt-1 space-y-0.5">
                {result.warnings.slice(0, 5).map((w, i) => <li key={i}>• {w}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
