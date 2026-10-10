import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface OwnerPhone {
  number: string;
  is_whatsapp: boolean;
  is_primary: boolean;
}

export interface OwnerEmail {
  email: string;
  is_primary: boolean;
}

export interface OwnerProperty {
  lot_id: number;
  lot_number: string | null;
  building: string | null;
  residence_id: number | null;
  share_percent: number | string;
  started_on: string;
  ended_on: string | null;
}

export interface OwnerListItem {
  id: number;
  type: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  identity_number: string | null;
  phones?: OwnerPhone[];
  emails?: OwnerEmail[];
  properties?: OwnerProperty[];
}

export interface OwnerSituation {
  per_lot: { lot_id: number; residence_id: number | null; lot_number: string | null; building: string | null; due: number; paid: number; remaining: number }[];
  total_due: number;
  total_paid: number;
  remaining: number;
  overdue: number;
  oldest_unpaid: string | null;
  last_payment_on: string | null;
}

export interface OwnerFile {
  owner: OwnerListItem;
  situation: OwnerSituation;
  payments: {
    id: number;
    paid_on: string;
    method: string;
    amount: number | string;
    status: string;
    receipt_number: string | null;
    allocation_receipt_number: string | null;
  }[];
  reminders: {
    id: number;
    type: string;
    channel: string;
    status: string;
    amount_due: number | string;
    sent_at: string | null;
  }[];
  documents: {
    id: number;
    type: string;
    title: string;
    number: string | null;
    created_at: string;
  }[];
}

export interface OwnerFormData {
  type?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  identity_number?: string;
  preferred_locale?: string;
  internal_notes?: string;
  phones?: { number: string; is_whatsapp?: boolean; is_primary?: boolean }[];
  emails?: { email: string; is_primary?: boolean }[];
}

export const ownersApi = {
  index: (params?: { search?: string; per_page?: number; page?: number; residence_ids?: number[] }) =>
    axiosInstance.get<PaginatedResponse<OwnerListItem>>('/api/syndic/owners', { params }),

  show: (id: number) =>
    axiosInstance.get<ApiResponse<OwnerFile>>(`/api/syndic/owners/${id}`),

  store: (data: OwnerFormData) =>
    axiosInstance.post<ApiResponse<OwnerListItem>>('/api/syndic/owners', data),

  update: (id: number, data: OwnerFormData) =>
    axiosInstance.put<ApiResponse<OwnerListItem>>(`/api/syndic/owners/${id}`, data),

  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/api/syndic/owners/${id}`),
};
