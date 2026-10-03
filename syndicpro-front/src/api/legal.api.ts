import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface LegalUnpaidRow {
  owner: { id: number; display_name: string; phone: string | null };
  lots: { lot_id: number; due: number; paid: number; remaining: number }[];
  amount_due: number;
  overdue: number;
  oldest_unpaid: string | null;
  months_late: number;
  motif: string;
  case_kind: 'unpaid_dues';
  escalate: boolean;
  lawyer_case: { id: number; status: string; motif: string | null } | null;
}

export interface NoQuitusRow {
  id: number;
  lot: string;
  lot_id: number;
  from_owner: string | null;
  to_owner: string | null;
  effective_on: string;
  reason: string;
  balance_at_transfer: number | string;
  case_kind: 'no_quitus_transfer';
  motif: string;
  lawyer_case: { id: number; status: string } | null;
}

export interface LawyerCaseItem {
  id: number;
  owner: { id: number; display_name?: string } | { id: number };
  lot: string | null;
  transfer_id: number | null;
  case_kind: string;
  case_kind_label: string;
  motif: string | null;
  amount_claimed: number | string;
  status: string;
  notes: string | null;
  exported_at: string | null;
  created_at: string;
}

export const legalApi = {
  overview: (residence_id: number) =>
    axiosInstance.get<ApiResponse<{
      rows: LegalUnpaidRow[];
      total: number;
      total_amount: number;
      thresholds: { formal_notice_after_months: number; lawyer_after_months: number };
    }>>('/api/syndic/legal/overview', { params: { residence_id } }),

  transfersWithoutQuitus: (params: { residence_id: number; per_page?: number; page?: number }) =>
    axiosInstance.get<PaginatedResponse<NoQuitusRow>>('/api/syndic/legal/transfers-without-quitus', { params }),

  lawyerCases: (params: { residence_id: number; status?: string; case_kind?: string; per_page?: number; page?: number }) =>
    axiosInstance.get<PaginatedResponse<LawyerCaseItem>>('/api/syndic/legal/lawyer-cases', { params }),

  storeLawyerCase: (data: {
    residence_id: number;
    owner_id: number;
    lot_id?: number | null;
    case_kind: string;
    motif: string;
    amount_claimed: number;
    notes?: string;
  }) =>
    axiosInstance.post<ApiResponse<LawyerCaseItem>>('/api/syndic/legal/lawyer-cases', data),

  updateLawyerCaseStatus: (id: number, data: { status: string; notes?: string }) =>
    axiosInstance.put<ApiResponse<LawyerCaseItem>>(`/api/syndic/legal/lawyer-cases/${id}/status`, data),
};
