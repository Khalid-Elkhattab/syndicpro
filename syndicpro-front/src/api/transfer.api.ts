import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/api.types';

export interface WizardData {
  lot: {
    id: number;
    number: string;
    type_label: string;
    surface: number | string | null;
    tantieme: number | string;
    building: string | null;
  };
  outgoing_owner: { id: number; display_name: string; is_promoter: boolean } | null;
  overdue_balance: number;
  valid_quitus: {
    id: number;
    number: string;
    purpose: string;
    status: string;
    issued_on: string;
    valid_until: string | null;
  }[];
  suggested_effective_on: string;
  arrears_on_sale: string;
}

export interface TransferRunPayload {
  to_owner_id?: number;
  new_owner?: {
    type?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    identity_number?: string;
    phones?: { number: string; is_whatsapp?: boolean; is_primary?: boolean }[];
  };
  effective_on: string;
  reason: string;
  quitus_id?: number | null;
  override_reason?: string;
  no_quitus_motif?: string;
  account_request_id?: number | null;
  contract_document_id?: number | null;
  contract_reference?: string;
  notes?: string;
}

export const transferApi = {
  lots: (params: { residence_id: number; search?: string; per_page?: number; page?: number }) =>
    axiosInstance.get<ApiResponse<{
      id: number;
      number: string;
      type: string;
      type_label: string;
      building: string | null;
      current_owner: string | null;
    }[]>>('/api/syndic/lots', { params }),

  wizardData: (lotId: number) =>
    axiosInstance.get<ApiResponse<WizardData>>(`/api/syndic/lots/${lotId}/transfer-data`),

  run: (lotId: number, data: TransferRunPayload) =>
    axiosInstance.post<ApiResponse<unknown>>(`/api/syndic/lots/${lotId}/transfer`, data),

  history: (lotId: number) =>
    axiosInstance.get<ApiResponse<unknown>>(`/api/syndic/lots/${lotId}/history`),

  issueQuitus: (data: { owner_id: number; lot_id: number; purpose?: string }) =>
    axiosInstance.post<ApiResponse<{ id: number; number: string }>>('/api/syndic/quitus', data),

  searchOwners: (search: string) =>
    axiosInstance.get<ApiResponse<{ id: number; display_name: string }[]>>('/api/syndic/owners', {
      params: { search, per_page: 10 },
    }),
};
