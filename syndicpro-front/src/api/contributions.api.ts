import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/api.types';

export interface ContributionFixedRate {
  id?: number;
  /** null = toutes typologies (tranches de surface pures, mode per_surface). */
  lot_type: string | null;
  min_surface?: number | null;
  max_surface?: number | null;
  monthly_amount: number;
}

export interface ContributionItem {
  id: number;
  type: string;
  type_label: string;
  name: string;
  fiscal_year_id: number | null;
  starts_on: string;
  ends_on: string;
  calculation_mode: string;
  calculation_mode_label: string;
  annual_budget: number | string | null;
  coefficient: number | string | null;
  surface_rate: number | string | null;
  applies_to_all_buildings: boolean;
  status: string;
  status_label: string;
  published_at: string | null;
  contribution_lots_count: number;
  fixed_rates: ContributionFixedRate[] | null;
  buildings: { id: number; number: string }[] | null;
}

export interface ContributionPreviewRow {
  lot_id: number;
  annual: number;
  monthly: number;
  number: string | null;
  building: string | null;
  type: string | null;
  type_label: string | null;
  surface: number | string | null;
  tantieme: number | string | null;
}

export interface ContributionPayload {
  type: string;
  name: string;
  fiscal_year_id?: number | null;
  starts_on: string;
  ends_on: string;
  calculation_mode: string;
  annual_budget?: number | null;
  applies_to_all_buildings?: boolean;
  building_ids?: number[];
  fixed_rates?: ContributionFixedRate[];
}

export const LOT_TYPES = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'shop', label: 'Magasin / Commerce' },
  { value: 'office', label: 'Bureau' },
  { value: 'house', label: 'Villa / Maison' },
  { value: 'large_surface', label: 'Grande surface' },
  { value: 'other', label: 'Autre' },
];

export const contributionsApi = {
  index: (residenceId: number) =>
    axiosInstance.get<ApiResponse<ContributionItem[]>>(
      `/api/syndic/residences/${residenceId}/contributions`
    ),

  show: (id: number) =>
    axiosInstance.get<ApiResponse<ContributionItem>>(`/api/syndic/contributions/${id}`),

  store: (residenceId: number, data: ContributionPayload) =>
    axiosInstance.post<ApiResponse<ContributionItem>>(
      `/api/syndic/residences/${residenceId}/contributions`,
      data
    ),

  update: (id: number, data: Partial<ContributionPayload>) =>
    axiosInstance.put<ApiResponse<ContributionItem>>(`/api/syndic/contributions/${id}`, data),

  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/api/syndic/contributions/${id}`),

  preview: (id: number) =>
    axiosInstance.get<ApiResponse<{
      rows: ContributionPreviewRow[];
      annual_total: number;
      monthly_total: number;
      warnings: string[];
    }>>(`/api/syndic/contributions/${id}/preview`),

  publish: (id: number) =>
    axiosInstance.post<ApiResponse<ContributionItem>>(`/api/syndic/contributions/${id}/publish`),
};
