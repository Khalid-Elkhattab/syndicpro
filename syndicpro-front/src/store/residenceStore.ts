import { create } from 'zustand';
import type { Residence } from '@/types/entities.types';

interface ResidenceState {
  /** Primaire (compatibilité : toutes les pages mono-résidence l'utilisent). */
  activeResidence: Residence | null;
  /** Choix explicite d'une seule résidence : replie aussi la sélection. */
  setActiveResidence: (residence: Residence | null) => void;
  /** Change le primaire sans toucher à la sélection (sync interne). */
  setPrimaryResidence: (residence: Residence | null) => void;
  /** Multi-sélection réelle (cases à cocher du sélecteur). */
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  toggleResidence: (id: number) => void;
  selectAllResidences: (ids: number[]) => void;
  /** Mode du sélecteur : simple (un clic = choix + ferme) ou multiple (cases). */
  multiSelect: boolean;
  setMultiSelect: (multi: boolean) => void;
}

export const useResidenceStore = create<ResidenceState>()((set) => ({
  activeResidence: null,
  setActiveResidence: (residence) =>
    set((s) => ({
      activeResidence: residence,
      selectedIds: residence ? [residence.id] : s.selectedIds,
    })),
  setPrimaryResidence: (residence) => set({ activeResidence: residence }),
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  toggleResidence: (id) =>
    set((s) => {
      const has = s.selectedIds.includes(id);
      const next = has ? s.selectedIds.filter((i) => i !== id) : [...s.selectedIds, id];
      // Toujours au moins une résidence sélectionnée.
      if (!next.length) return s;
      return { selectedIds: next };
    }),
  selectAllResidences: (ids) => set({ selectedIds: ids }),
  multiSelect: false,
  setMultiSelect: (multi) =>
    set((s) => ({
      multiSelect: multi,
      // Retour au simple : la sélection se replie sur le primaire.
      selectedIds: !multi && s.activeResidence ? [s.activeResidence.id] : s.selectedIds,
    })),
}));
