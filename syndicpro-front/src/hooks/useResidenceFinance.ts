import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi, type FinanceUpdatePayload } from '@/api/finance.api';

export const useResidenceFinance = (residenceId?: number) =>
  useQuery({
    queryKey: ['residences', residenceId, 'finance'],
    queryFn: async () => {
      const { data } = await financeApi.show(residenceId as number);
      return data.data;
    },
    enabled: !!residenceId,
  });

export const useUpdateResidenceFinance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residenceId, ...payload }: FinanceUpdatePayload & { residenceId: number }) =>
      financeApi.update(residenceId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['residences', variables.residenceId, 'finance'] });
      qc.invalidateQueries({ queryKey: ['residences'] });
    },
  });
};
