import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transferApi, type TransferRunPayload } from '@/api/transfer.api';

export const useLotsForTransfer = (params?: { residence_id?: number; search?: string }) =>
  useQuery({
    queryKey: ['transfer-lots', params],
    queryFn: async () => {
      const { data } = await transferApi.lots({
        residence_id: params?.residence_id as number,
        search: params?.search || undefined,
        per_page: 50,
      });
      return data.data ?? [];
    },
    enabled: !!params?.residence_id,
  });

export const useTransferWizardData = (lotId?: number) =>
  useQuery({
    queryKey: ['transfer-wizard', lotId],
    queryFn: async () => {
      const { data } = await transferApi.wizardData(lotId as number);
      return data.data;
    },
    enabled: !!lotId,
  });

export const useRunTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lotId, ...payload }: TransferRunPayload & { lotId: number }) =>
      transferApi.run(lotId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfer-wizard'] });
      qc.invalidateQueries({ queryKey: ['legal-no-quitus'] });
      qc.invalidateQueries({ queryKey: ['lawyer-cases'] });
      qc.invalidateQueries({ queryKey: ['legal-overview'] });
    },
  });
};

export const useIssueQuitus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { owner_id: number; lot_id: number; purpose?: string }) =>
      transferApi.issueQuitus(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfer-wizard'] }),
  });
};

export const useOwnerSearch = (search: string) =>
  useQuery({
    queryKey: ['owner-search', search],
    queryFn: async () => {
      const { data } = await transferApi.searchOwners(search);
      return data.data ?? [];
    },
    enabled: search.trim().length >= 2,
  });
