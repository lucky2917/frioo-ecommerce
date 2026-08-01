export const getStockState = (product) => {
  const stock = product?.stock;
  if (stock === null || stock === undefined) return null;
  if (stock === 0) return { code: 'out', label: 'Out of stock', available: false };
  return { code: 'in', label: 'In stock', available: true };
};
