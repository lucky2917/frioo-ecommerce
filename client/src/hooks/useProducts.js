import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, getCachedProducts } from '../lib/productsCache';
import { logger } from '../utils/logger';

export const useProducts = () => {
  const [products, setProducts] = useState(() => getCachedProducts() || []);
  const [loading, setLoading] = useState(() => !getCachedProducts());
  const [error, setError] = useState(false);

  const load = useCallback(async (force = false) => {
    setError(false);
    if (force || !getCachedProducts()) setLoading(true);
    try {
      const items = await fetchProducts({ force });
      setProducts(items);
    } catch (err) {
      logger.error('Failed to fetch products:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => load(true), [load]);

  return { products, loading, error, refetch };
};
