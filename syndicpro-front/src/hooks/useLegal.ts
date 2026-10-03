import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { legalApi } from '@/api/legal.api';

export const useLegalOverview = (residence_id?: number) =>
  useQuery({
    queryKey: ['legal-overview', residence_id],
    queryFn: async () => {
      const { data } = await legalApi.overview(residence_id as number);
      return data.data;
    },
    enabled: !!residence_id,
  });

export const useNoQuitusTransfers = (params?: { residence_id?: number; per_page?: number; page?: number }) =>
  useQuery({
    queryKey: ['legal-no-quitus', params],
    queryFn: async () => {
      const { data } = await legalApi.transfersWithoutQuitus(params as { residence_id: number });
      return data;
    },
    enabled: !!params?.residence_id,
  });

export const useLawyerCases = (params?: {
  residence_id?: number;
  status?: string;
  case_kind?: string;
  per_page?: number;
  page?: number;
}) =>
  useQuery({
    queryKey: ['lawyer-cases', params],
    queryFn: async () => {
      const { data } = await legalApi.lawyerCases(params as { residence_id: number });
      return data;
    },
    enabled: !!params?.residence_id,
  });

export const useCreateLawyerCase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      residence_id: number;
      owner_id: number;
      lot_id?: number | null;
      case_kind: string;
      motif: string;
      amount_claimed: number;
      notes?: string;
    }) => legalApi.storeLawyerCase(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-overview'] });
      qc.invalidateQueries({ queryKey: ['lawyer-cases'] });
    },
  });
};

export const useUpdateLawyerCaseStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; status: string; notes?: string }) =>
      legalApi.updateLawyerCaseStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-overview'] });
      qc.invalidateQueries({ queryKey: ['lawyer-cases'] });
      qc.invalidateQueries({ queryKey: ['legal-no-quitus'] });
    },
  });
};
