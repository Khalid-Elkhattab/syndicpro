import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appartementsApi } from '@/api/appartements.api';
import type { Appartement } from '@/types/entities.types';

export const useAppartements = (residenceId?: number, params?: { immeuble_id?: number }) =>
  useQuery({
    queryKey: ['appartements', residenceId, params],
    queryFn: async () => {
      if (!residenceId) return [];
      const { data } = await appartementsApi.index(residenceId, params);
      return data.data as Appartement[];
    },
    enabled: !!residenceId,
  });

export const useMyAppartements = () =>
  useQuery({
    queryKey: ['appartements', 'mine'],
    queryFn: async () => {
      const { data } = await appartementsApi.getMine();
      return data.data as Appartement[];
    },
  });

export const useCreateAppartement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      residence_id: number;
      immeuble_id: number;
      numero: string;
      etage: number;
      tantieme: number;
      coproprietaire_id?: number;
    }) => appartementsApi.store(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appartements'] }),
  });
};

export const useUpdateAppartement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; numero?: string; etage?: number; tantieme?: number }) =>
      appartementsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appartements'] }),
  });
};

export const useAssignerAppartement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, coproprietaireId }: { id: number; coproprietaireId: number | null }) =>
      appartementsApi.assigner(id, coproprietaireId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appartements'] }),
  });
};

export const useDeleteAppartement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => appartementsApi.destroy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appartements'] }),
  });
};