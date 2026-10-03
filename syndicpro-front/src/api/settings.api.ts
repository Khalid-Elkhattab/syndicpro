import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/api.types';

export interface SettingItem {
  key: string;
  value: number;
  default: number;
}

const SETTING_LABELS: Record<string, { label: string; hint: string; unit: string }> = {
  quitus_validity_days: {
    label: 'Validité du quitus (jours)',
    hint: 'Durée de validité d’un quitus de vente à son émission.',
    unit: 'jours',
  },
  reminder_after_months: {
    label: 'Relance à partir de',
    hint: 'Un impayé déclenche une relance après ce retard.',
    unit: 'mois',
  },
  formal_notice_after_months: {
    label: 'Mise en demeure à partir de',
    hint: 'Un impayé déclenche une mise en demeure après ce retard.',
    unit: 'mois',
  },
  lawyer_after_months: {
    label: 'Passage au juridique à partir de',
    hint: 'Un impayé est proposé au juridique après ce retard.',
    unit: 'mois',
  },
  document_max_mb: {
    label: 'Taille max des documents',
    hint: 'Taille maximale d’un fichier téléversé.',
    unit: 'Mo',
  },
};

export { SETTING_LABELS };

export const settingsApi = {
  index: () =>
    axiosInstance.get<ApiResponse<SettingItem[]>>('/api/syndic/settings'),

  update: (settings: Record<string, number>) =>
    axiosInstance.put<ApiResponse<Record<string, number>>>('/api/syndic/settings', { settings }),
};
