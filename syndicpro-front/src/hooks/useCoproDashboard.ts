import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type CoproDashboardData } from '@/api/dashboard.api';

export const useCoproDashboard = () =>
  useQuery({
    queryKey: ['copro', 'dashboard'],
    queryFn: async () => {
      const { data } = await dashboardApi.getCoproDashboard();
      return data.data as CoproDashboardData;
    },
  });
