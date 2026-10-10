import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contributionsApi, type ContributionPayload } from '@/api/contributions.api';

export const useContributions = (residenceId?: number) =>
  useQuery({
    queryKey: ['contributions', residenceId],
    queryFn: async () => {
      const { data } = await contributionsApi.index(residenceId as number);
      return data.data ?? [];
    },
    enabled: !!residenceId,
  });

export const useContribution = (id?: number) =>
  useQuery({
    queryKey: ['contributions', 'detail', id],
    queryFn: async () => {
      const { data } = await contributionsApi.show(id as number);
      return data.data;
    },
    enabled: !!id,
  });

export const useContributionPreview = (id?: number) =>
  useQuery({
    queryKey: ['contributions', 'preview', id],
    queryFn: async () => {
      const { data } = await contributionsApi.preview(id as number);
      return data.data;
    },
    enabled: !!id,
  });

function invalidateAll(qc: ReturnType<typeof useQueryClient>, residenceId?: number) {
  qc.invalidateQueries({ queryKey: ['contributions'] });
  if (residenceId) {
    qc.invalidateQueries({ queryKey: ['residences', residenceId, 'finance'] });
  }
}

export const useCreateContribution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residenceId, ...payload }: ContributionPayload & { residenceId: number }) =>
      contributionsApi.store(residenceId, payload),
    onSuccess: (_data, variables) => invalidateAll(qc, variables.residenceId),
  });
};

export const useUpdateContribution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<ContributionPayload> & { id: number }) =>
      contributionsApi.update(id, payload),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteContribution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contributionsApi.destroy(id),
    onSuccess: () => invalidateAll(qc),
  });
};

export const usePublishContribution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contributionsApi.publish(id),
    onSuccess: () => invalidateAll(qc),
  });
};
