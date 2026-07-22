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
      const result = await reclamationApi.getByResidence(residenceId, filters);
      return {
        data: result.data as Reclamation[],
        meta: result.meta,
      };
    },
    enabled: !!residenceId,
  });

export const useReclamation = (id: number) =>
  useQuery({
    queryKey: ['reclamations', id],
    queryFn: async () => {
      const result = await reclamationApi.show(id);
      return result.data as Reclamation;
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
      const result = await reclamationApi.getMine();
      return result.data as Reclamation[];
    },
  });

export const useReclamationMine = (id: number) =>
  useQuery({
    queryKey: ['reclamations', 'mine', id],
    queryFn: async () => {
      const result = await reclamationApi.showMine(id);
      return result.data as Reclamation;
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