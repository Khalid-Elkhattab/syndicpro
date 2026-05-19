import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  reclamationApi,
  type ReclamationFilters,
  type StoreReclamationParams,
  type UpdateReclamationStatutParams,
} from '@/api/reclamation.api';
import type { Reclamation } from '@/types/entities.types';

export const useReclamationsResidence = (
  residenceId: number,
  filters?: ReclamationFilters
) =>
  useQuery({
    queryKey: ['reclamations', residenceId, filters],
    queryFn: async () => {
      const { data } = await reclamationApi.getByResidence(residenceId, filters);
      return {
        data: data.data as Reclamation[],
        meta: data.meta,
      };
    },
    enabled: !!residenceId,
  });

export const useReclamation = (id: number) =>
  useQuery({
    queryKey: ['reclamations', id],
    queryFn: async () => {
      const { data } = await reclamationApi.show(id);
      return data.data as Reclamation;
    },
    enabled: !!id,
  });

export const useUpdateStatut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, params }: { id: number; params: UpdateReclamationStatutParams }) =>
      reclamationApi.updateStatut(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reclamations'] });
    },
  });
};

export const useMesReclamations = () =>
  useQuery({
    queryKey: ['reclamations', 'mine'],
    queryFn: async () => {
      const { data } = await reclamationApi.getMine();
      return data.data as Reclamation[];
    },
  });

export const useReclamationMine = (id: number) =>
  useQuery({
    queryKey: ['reclamations', 'mine', id],
    queryFn: async () => {
      const { data } = await reclamationApi.showMine(id);
      return data.data as Reclamation;
    },
    enabled: !!id,
  });

export const useCreateReclamation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: StoreReclamationParams) => reclamationApi.store(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reclamations'] });
    },
  });
};