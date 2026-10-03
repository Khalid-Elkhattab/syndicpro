import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings.api';

export const useSettings = () =>
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await settingsApi.index();
      return data.data ?? [];
    },
  });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, number>) => settingsApi.update(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
};
