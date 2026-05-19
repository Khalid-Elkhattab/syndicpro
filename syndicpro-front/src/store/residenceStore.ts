import { create } from 'zustand';
import type { Residence } from '@/types/entities.types';

interface ResidenceState {
  activeResidence: Residence | null;
  setActiveResidence: (residence: Residence | null) => void;
}

export const useResidenceStore = create<ResidenceState>()((set) => ({
  activeResidence: null,
  setActiveResidence: (residence) => set({ activeResidence: residence }),
}));