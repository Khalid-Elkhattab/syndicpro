import { axiosInstance } from '@/api/axiosInstance';
import type { ApiResponse } from '@/types/api.types';

export interface FinanceFiscalYear {
  id: number;
  name: string;
  starts_on: string;
  ends_on: string;
  status: string;
  calculation_mode: string | null;
  calculation_mode_label: string | null;
  calculation_mode_decided_at: string | null;
  assembly: {
    id: number;
    title: string;
    scheduled_at: string;
    status: string;
  } | null;
}

export interface FinanceAssembly {
  id: number;
  title: string;
  scheduled_at: string;
  status: string;
}

export interface FinanceSettings {
  residence: {
    id: number;
    nom: string;
    code: string | null;
    calculation_mode: string | null;
    calculation_mode_label: string | null;
    arrears_on_sale: string | null;
    quitus_validity_days: number | null;
  };
  fiscal_years: FinanceFiscalYear[];
  assemblies: FinanceAssembly[];
  modes: { value: string; label: string }[];
}

export interface FinanceUpdatePayload {
  calculation_mode?: string;
  arrears_on_sale?: string;
  quitus_validity_days?: number;
  fiscal_year_id?: number | null;
  year_calculation_mode?: string;
  assembly_id?: number | null;
}

export const financeApi = {
  show: (residenceId: number) =>
    axiosInstance.get<ApiResponse<FinanceSettings>>(`/api/syndic/residences/${residenceId}/finance`),

  update: (residenceId: number, data: FinanceUpdatePayload) =>
    axiosInstance.put<ApiResponse<unknown>>(`/api/syndic/residences/${residenceId}/finance`, data),
};
