import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi, documentTypesApi } from '@/api/documents.api';

export const useDocumentTypes = () =>
  useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data } = await documentTypesApi.index();
      return data.data ?? [];
    },
  });

export const useCreateDocumentType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { label_fr: string; label_ar?: string }) =>
      documentTypesApi.store(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-types'] }),
  });
};

export const useUpdateDocumentType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; label_fr?: string; label_ar?: string; is_active?: boolean }) =>
      documentTypesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-types'] }),
  });
};

export const useDeleteDocumentType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentTypesApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-types'] }),
  });
};

export const useResidenceDocuments = (params?: {
  residence_id?: number;
  type?: string;
  search?: string;
  per_page?: number;
  page?: number;
}) =>
  useQuery({
    queryKey: ['documents', params],
    queryFn: async () => {
      if (!params?.residence_id) return null;
      const { data } = await documentsApi.index(params as { residence_id: number });
      return data;
    },
    enabled: !!params?.residence_id,
  });

export const useUploadDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => documentsApi.store(form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentsApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
};
