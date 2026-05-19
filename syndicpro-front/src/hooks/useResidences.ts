import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { residencesApi } from '@/api/residences.api';
import type { ApiResponse } from '@/types/api.types';
import type { Residence } from '@/types/entities.types';

export const useResidences = () =>
  useQuery({
    queryKey: ['residences'],
    queryFn: async () => {
      const { data } = await residencesApi.index();
      return data.data as Residence[];
    },
  });

export const useResidence = (id: number) =>
  useQuery({
    queryKey: ['residences', id],
    queryFn: async () => {
      const { data } = await residencesApi.show(id);
      return data.data as Residence;
    },
    enabled: !!id,
  });

export const useCreateResidence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { nom: string; ville: string; adresse: string }) =>
      residencesApi.store(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['residences'] }),
  });
};

export const useUpdateResidence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; nom?: string; ville?: string; adresse?: string }) =>
      residencesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['residences'] }),
  });
};

export const useDeleteResidence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => residencesApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['residences'] }),
  });
};