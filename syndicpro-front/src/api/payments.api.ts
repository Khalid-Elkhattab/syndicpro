import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/api.types';

export interface AllocationLine {
  due_id: number;
  lot_number: string | null;
  period_start: string;
  period_end: string;
  owed: number;
  open_before: number;
  applied: number;
  open_after: number;
}

export interface PaymentPreview {
  lines: AllocationLine[];
  tendered: number;
  applied: number;
  credit: number;
  remaining_before: number;
  remaining_after: number;
}

export interface RecordedPayment {
  payment: {
    id: number;
    paid_on: string;
    method: string;
    amount: number | string;
    status: string;
    receipt_number: string | null;
    allocation_receipt_number: string | null;
  };
  lines: AllocationLine[];
  credit: number;
  remaining_after: number;
  receipts: {
    encaissement_number: string | null;
    imputation_number: string | null;
    encaissement_url: string;
    imputation_url: string;
  };
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'transfer', label: 'Virement' },
  { value: 'deposit', label: 'Versement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'effet', label: 'Effet' },
] as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  validated: 'Validé',
  rejected: 'Rejeté',
  cancelled: 'Annulé',
};

export const paymentsApi = {
  preview: (data: { residence_id: number; owner_id: number; amount: number }) =>
    axiosInstance.post<ApiResponse<PaymentPreview>>('/api/syndic/payments/preview', data),

  record: (data: {
    residence_id: number;
    owner_id: number;
    lot_id?: number;
    amount: number;
    paid_on: string;
    method: string;
    document_number?: string;
    notes?: string;
  }) => axiosInstance.post<ApiResponse<RecordedPayment>>('/api/syndic/payments', data),

  cancel: (id: number, cancellation_reason: string) =>
    axiosInstance.post<ApiResponse<RecordedPayment['payment']>>(`/api/syndic/payments/${id}/cancel`, { cancellation_reason }),

  receiptBlob: async (url: string): Promise<string> => {
    const response = await axiosInstance.get(url, { responseType: 'blob' as const });
    return window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  },
};
