const NEW_ARRIVAL_WINDOW_DAYS = 14;

export const isNewArrival = (product) => {
  const createdAt = product?.created_at;
  if (!createdAt) return false;

  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;

  const ageDays = (Date.now() - created) / 86400000;
  return ageDays >= 0 && ageDays <= NEW_ARRIVAL_WINDOW_DAYS;
};

export const getProductSignal = (product) => {
  if (product?.discount > 0) return { code: 'save', label: `${product.discount}% off` };
  if (isNewArrival(product)) return { code: 'new', label: 'New in' };
  if (product?.featured) return { code: 'pick', label: "Today's pick" };
  return null;
};

export const hasNutritionFacts = (product) => {
  const nutrition = product?.nutrition;
  if (!nutrition) return false;
  return ['calories', 'protein', 'carbs', 'fat'].some((key) => Number(nutrition[key]) > 0);
};
