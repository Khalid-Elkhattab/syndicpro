import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depenseApi, type DepenseFilters } from '@/api/depense.api';
import type { Depense } from '@/types/entities.types';


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
    onSuccess: (_, { residenceId }) => {
      qc.invalidateQueries({ queryKey: ['depenses', residenceId], exact: false });
      qc.invalidateQueries({ queryKey: ['budget', 'summary'], exact: false });
    },
  });
};

export const useUpdateDepense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      residenceId: _residenceId,
      id,
      data,
    }: {
      residenceId: number;
      id: number;
      data: { date?: string; montant?: number; description?: string };
    }) => depenseApi.update(id, data),
    onSuccess: (_, { residenceId }) => {
      qc.invalidateQueries({ queryKey: ['depenses', residenceId], exact: false });
      qc.invalidateQueries({ queryKey: ['budget', 'summary'], exact: false });
    },
  });
};

export const useDeleteDepense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residenceId: _residenceId, id }: { residenceId: number; id: number }) =>
      depenseApi.destroy(id),
    onSuccess: (_, { residenceId }) => {
      qc.invalidateQueries({ queryKey: ['depenses', residenceId], exact: false });
      qc.invalidateQueries({ queryKey: ['budget', 'summary'], exact: false });
    },
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