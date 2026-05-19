import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

function safeParse(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [d, m, y] = date.split('/');
    return new Date(+y, +m - 1, +d);
  }
  if (/^\d{2}\/\d{2}\/\d{4} à \d{2}:\d{2}$/.test(date)) {
    const [d, m, y, h, min] = date.split(/[/ :]/);
    return new Date(+y, +m - 1, +d, +h, +min);
  }
  return parseISO(date);
}

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  const parsed = safeParse(date);
  return isNaN(parsed.getTime()) ? '—' : format(parsed, 'dd/MM/yyyy', { locale: fr });
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  const parsed = safeParse(date);
  return isNaN(parsed.getTime()) ? '—' : format(parsed, "dd/MM/yyyy 'à' HH:mm", { locale: fr });
};

export const daysSince = (date: string | Date | null | undefined): number => {
  if (!date) return 0;
  const parsed = safeParse(date);
  return isNaN(parsed.getTime()) ? 0 : Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
};