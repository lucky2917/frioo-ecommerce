const GRAMS_PER_UNIT = {
  kg: 1000,
  g: 1,
};

export const getStockState = (product) => {
  const stock = product?.stock;
  if (stock === null || stock === undefined) return null;
  if (stock === 0) return { code: 'out', label: 'Out of stock', available: false };
  return { code: 'in', label: 'In stock', available: true };
};

export const getUnitPrice = (product) => {
  const grams = GRAMS_PER_UNIT[product?.unit];
  if (!grams) return null;

  const price = product.price_cents / 100;
  if (!Number.isFinite(price) || price <= 0) return null;

  const per100g = (price / grams) * 100;
  return { amount: Math.round(per100g), label: `₹${Math.round(per100g)} / 100g` };
};
