import { axiosInstance } from '@/api/axiosInstance';

export interface LotsImportPreview {
  columns: string[];
  delimiter: string;
  rows_total: number;
  to_create_buildings: number;
  to_create_lots: number;
  to_update_lots: number;
  warnings: string[];
  errors: string[];
  preview_rows: Array<{
    building: string;
    lot_number: string;
    type: string;
    type_label: string;
    surface: number | null;
    tantieme: number;
  }>;
}

export interface LotsImportResult {
  created_buildings: number;
  created_lots: number;
  updated_lots: number;
  warnings: string[];
}

export const lotsImportApi = {
  preview: (residenceId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post<{ data: LotsImportPreview }>(
      `/api/syndic/residences/${residenceId}/lots/import/preview`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  commit: (residenceId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post<{ data: LotsImportResult }>(
      `/api/syndic/residences/${residenceId}/lots/import/commit`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  template: () =>
    'building;lot_number;type;surface;tantieme;land_title_no;parking;parking_numbers;box;box_numbers;floor;notes\n' +
    'B;A12;appartement;85.5;120;;yes;P1|P2;no;;2;\n' +
    'B;M3;magasin;42;60;;no;;;no;;0;Commerce RDC\n' +
    'A;B12;bureau;30;40;;common;;;yes;B3;1;\n' +
    'A;D1;duplex;150;200;;no;;;no;;3;\n',
};
