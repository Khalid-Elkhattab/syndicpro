import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownersApi, type OwnerFormData } from '@/api/owners.api';

export const useOwners = (params?: { search?: string; per_page?: number; page?: number }) =>
  useQuery({
    queryKey: ['owners', params],
    queryFn: async () => {
      const { data } = await ownersApi.index(params);
      return data;
    },
  });

export const useOwnerFile = (id?: number) =>
  useQuery({
    queryKey: ['owners', 'file', id],
    queryFn: async () => {
      const { data } = await ownersApi.show(id as number);
      return data.data;
    },
    enabled: !!id,
  });

export const useCreateOwner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OwnerFormData) => ownersApi.store(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owners'] }),
  });
};

export const useUpdateOwner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: OwnerFormData & { id: number }) =>
      ownersApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owners'] }),
  });
};

export const useDeleteOwner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ownersApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owners'] }),
  });
};
