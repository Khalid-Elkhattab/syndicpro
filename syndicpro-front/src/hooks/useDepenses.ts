import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depenseApi, type DepenseFilters } from '@/api/depense.api';
import type { Depense } from '@/types/entities.types';
import type { PaginatedResponse } from '@/types/api.types';

export const useDepenses = (residenceId: number, filters?: DepenseFilters) =>
  useQuery({
    queryKey: ['depenses', residenceId, filters],
    queryFn: async () => {
      const { data } = await depenseApi.index(residenceId, filters);
      return {
        data: data.data as Depense[],
        meta: data.meta,
      };
    },
    enabled: !!residenceId,
  });

export const useCreateDepense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      residenceId,
      formData,
    }: {
      residenceId: number;
      formData: FormData;
    }) => depenseApi.store(residenceId, formData),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['depenses', residenceId] }),
  });
};

export const useUpdateDepense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      residenceId,
      id,
      data,
    }: {
      residenceId: number;
      id: number;
      data: { date?: string; montant?: number; description?: string };
    }) => depenseApi.update(residenceId, id, data),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['depenses', residenceId] }),
  });
};

export const useDeleteDepense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residenceId, id }: { residenceId: number; id: number }) =>
      depenseApi.destroy(residenceId, id),
    onSuccess: (_, { residenceId }) =>
      qc.invalidateQueries({ queryKey: ['depenses', residenceId] }),
  });
};

export const useDepenseJustificatifUrl = (depenseId: number | null) =>
  useQuery({
    queryKey: ['depense', 'justificatif', depenseId],
    queryFn: async () => {
      const { data } = await depenseApi.getJustificatifUrl(depenseId!);
      return data.data.url as string;
    },
    enabled: !!depenseId,
  });