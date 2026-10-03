import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface DocumentTypeItem {
  id: number;
  code: string;
  label_fr: string;
  label_ar: string | null;
  is_system: boolean;
  is_active: boolean;
}

export interface ResidenceDocument {
  id: number;
  residence_id: number;
  type: string;
  title: string;
  number: string | null;
  locale: string;
  visibility: string;
  mime: string;
  size: number | null;
  is_locked: boolean;
  creator?: { id: number; name: string } | null;
  created_at: string;
}

export const documentTypesApi = {
  index: () =>
    axiosInstance.get<ApiResponse<DocumentTypeItem[]>>('/api/syndic/document-types'),

  store: (data: { label_fr: string; label_ar?: string }) =>
    axiosInstance.post<ApiResponse<DocumentTypeItem>>('/api/syndic/document-types', data),

  update: (id: number, data: { label_fr?: string; label_ar?: string; is_active?: boolean }) =>
    axiosInstance.put<ApiResponse<DocumentTypeItem>>(`/api/syndic/document-types/${id}`, data),

  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/api/syndic/document-types/${id}`),
};

export const documentsApi = {
  index: (params: { residence_id: number; type?: string; search?: string; per_page?: number; page?: number }) =>
    axiosInstance.get<PaginatedResponse<ResidenceDocument>>('/api/syndic/documents', { params }),

  store: (form: FormData) =>
    axiosInstance.post<ApiResponse<ResidenceDocument>>('/api/syndic/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  download: async (id: number, filename: string) => {
    const response = await axiosInstance.get(`/api/syndic/documents/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  destroy: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/api/syndic/documents/${id}`),
};
