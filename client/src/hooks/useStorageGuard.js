import { useEffect } from 'react';
import { logger } from '../utils/logger';

const IMAGE_CACHE = 'frioo-images';
const PRESSURE_RATIO = 0.8;
const EVICT_FRACTION = 0.3;
const CHECK_DELAY_MS = 10000;

const readEstimate = async () => {
  if (!navigator.storage?.estimate) return null;

  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    if (!quota) return null;
    return { usage, quota, ratio: usage / quota };
  } catch {
    return null;
  }
};

const evictOldestImages = async () => {
  if (!window.caches) return 0;

  try {
    const hasCache = await caches.has(IMAGE_CACHE);
    if (!hasCache) return 0;

    const cache = await caches.open(IMAGE_CACHE);
    const keys = await cache.keys();
    if (keys.length === 0) return 0;

    const removeCount = Math.max(1, Math.floor(keys.length * EVICT_FRACTION));
    const doomed = keys.slice(0, removeCount);

    await Promise.all(doomed.map((request) => cache.delete(request)));
    return doomed.length;
  } catch (err) {
    logger.warn('Image cache eviction failed', err);
    return 0;
  }
};

export function useStorageGuard() {
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      const estimate = await readEstimate();
      if (cancelled || !estimate) return;

      if (estimate.ratio < PRESSURE_RATIO) {
        logger.debug('Storage healthy', {
          usedMb: Math.round(estimate.usage / 1048576),
          quotaMb: Math.round(estimate.quota / 1048576)
        });
        return;
      }

      const evicted = await evictOldestImages();
      if (cancelled) return;

      logger.warn('Storage under pressure, trimmed image cache', {
        usedMb: Math.round(estimate.usage / 1048576),
        quotaMb: Math.round(estimate.quota / 1048576),
        evicted
      });
    }, CHECK_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
}
