import { API_BASE_URL } from '../config/constants';
import { fetchWithTimeout } from './http';

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedProducts = null;
let cachedAt = 0;
let inflightRequest = null;

const requestProducts = async () => {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/products`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const payload = await res.json();
  const items = payload.data?.items;
  return Array.isArray(items) ? items : [];
};

export const getCachedProducts = () => {
  if (cachedProducts && Date.now() - cachedAt < CACHE_TTL_MS) return cachedProducts;
  return null;
};

export const fetchProducts = async ({ force = false } = {}) => {
  if (!force) {
    const fresh = getCachedProducts();
    if (fresh) return fresh;
  }
  if (inflightRequest) return inflightRequest;
  inflightRequest = requestProducts()
    .then((items) => {
      cachedProducts = items;
      cachedAt = Date.now();
      return items;
    })
    .finally(() => {
      inflightRequest = null;
    });
  return inflightRequest;
};

export const invalidateProductsCache = () => {
  cachedProducts = null;
  cachedAt = 0;
};
