import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/api/axiosInstance';

export interface SiteConfig {
  name: string;
  tagline: string | null;
  contact: {
    email: string | null;
    phone: string | null;
    whatsapp_number: string | null;
    address: string | null;
    opening_hours: string | null;
  };
  links: {
    portal_login: string | null;
    portal_request_access: string | null;
    portal_forgot_password: string | null;
    staff_login: string | null;
    document_verify: string | null;
  };
  legal: {
    publisher: string | null;
    registration: string | null;
    address: string | null;
    host: string | null;
  };
  features: {
    whatsapp_assistant: boolean;
    ai_connectivity: boolean;
    pricing: boolean;
    key_figures: boolean;
  };
  plans: unknown[];
}

export const useSiteConfig = () =>
  useQuery({
    queryKey: ['site-config'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<SiteConfig>('/api/public/site-config');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
