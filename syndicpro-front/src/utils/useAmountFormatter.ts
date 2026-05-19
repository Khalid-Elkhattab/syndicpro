export const useAmountFormatter = () => {
  const format = (value: string): string => {
    const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const unformat = (formatted: string): number => {
    const cleaned = formatted.replace(/[^0-9.,]/g, '').replace(/\s/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  return { format, unformat };
};
