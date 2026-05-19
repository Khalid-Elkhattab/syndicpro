export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DH';
};