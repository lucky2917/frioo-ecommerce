import { useProducts } from './useProducts';

export const useProduct = (id) => {
  const { products, loading, error, refetch } = useProducts();
  const numericId = Number(id);
  const product = products.find((p) => p.id === numericId) || null;

  return { product, products, loading, error, refetch };
};
