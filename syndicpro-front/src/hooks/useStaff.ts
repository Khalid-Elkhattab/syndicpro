import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '@/api/staff.api';

export const useStaffPermissions = () =>
  useQuery({
    queryKey: ['staff-permissions'],
    queryFn: async () => {
      const { data } = await staffApi.permissions();
      return data.data ?? {};
    },
  });

export const useStaff = (params?: { per_page?: number; page?: number }) =>
  useQuery({
    queryKey: ['staff', params],
    queryFn: async () => {
      const { data } = await staffApi.index(params);
      return data;
    },
  });

export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      username: string;
      phone?: string;
      password: string;
      password_confirmation: string;
      role: string;
      residences?: number[];
      permissions?: string[];
    }) => staffApi.store(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
};

export const useUpdateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: {
      id: number;
      name?: string;
      phone?: string;
      is_active?: boolean;
      residences?: number[];
      permissions?: string[];
    }) => staffApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
};

export const useToggleStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => staffApi.toggleActif(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
};

export const useDeleteStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => staffApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
};
