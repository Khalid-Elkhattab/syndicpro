import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coproprietairesApi } from '@/api/coproprietaires.api';
import type { User } from '@/types/entities.types';

export const useCoproprietaires = (params?: {
  search?: string;
  residence_id?: number;
  is_active?: boolean;
  per_page?: number;
  page?: number;
}) =>
  useQuery({
    queryKey: ['coproprietaires', params],
    queryFn: async () => {
      const { data } = await coproprietairesApi.index(params);
      return data;
    },
  });

export const useCoproprietaire = (id: number) =>
  useQuery({
    queryKey: ['coproprietaires', id],
    queryFn: async () => {
      const { data } = await coproprietairesApi.show(id);
      return data.data as User & {
        appartements?: { id: number; numero: string; etage: number; residence?: { nom: string }; immeuble?: { nom: string } }[];
        cotisation_details?: { id: number; montant: number; montant_paye: number; montant_restant: number; statut: string; appartement?: { numero: string } }[];
        paiements?: { id: number; montant: number; date_paiement: string; mode_paiement: string; reference: string | null }[];
        reclamations?: { id: number; titre: string; statut: string; priorite: string; created_at: string; residence?: { nom: string }; appartement?: { numero: string } }[];
      };
    },
    enabled: !!id,
  });

export const useCreateCoproprietaire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      phone?: string;
      username: string;
      password: string;
      password_confirmation: string;
    }) => coproprietairesApi.store(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coproprietaires'] }),
  });
};

export const useUpdateCoproprietaire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; name?: string; email?: string; phone?: string; username?: string }) =>
      coproprietairesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coproprietaires'] }),
  });
};

export const useResetPassword = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password, password_confirmation }: { id: number; password: string; password_confirmation: string }) =>
      coproprietairesApi.resetPassword(id, password, password_confirmation),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coproprietaires'] }),
  });
};

export const useToggleActif = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => coproprietairesApi.toggleActif(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coproprietaires'] }),
  });
};