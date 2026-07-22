import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { immeublesApi } from '@/api/immeubles.api';
import type { Immeuble } from '@/types/entities.types';

export const useImmeubles = (residenceId: number) =>
  useQuery({
    queryKey: ['immeubles', residenceId],
    queryFn: async () => {
      const { data } = await immeublesApi.indexByResidence(residenceId);
      return (data.data ?? []) as Immeuble[];
    },
    enabled: !!residenceId,
  });

export const useCreateImmeuble = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { residence_id: number; nom: string }) =>
      immeublesApi.store(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['immeubles'] }),
  });
};

export const useUpdateImmeuble = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; nom: string }) =>
      immeublesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['immeubles'] }),
  });
};

export const useDeleteImmeuble = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => immeublesApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['immeubles'] }),
  });
};