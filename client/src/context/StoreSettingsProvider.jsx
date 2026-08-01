import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config/constants';
import { fetchWithTimeout } from '../lib/http';
import { logger } from '../utils/logger';
import { getClosedNotice } from '../utils/storeHours';
import { StoreSettingsContext } from './store-settings-context';

const RECHECK_INTERVAL_MS = 60 * 1000;

const FALLBACK_SETTINGS = {
  isOpen: true,
  closedMessage: null,
  unavailableCategories: [],
  opensAtHour: 8,
  closesAtHour: 22,
  deliveryFee: 29,
  freeDeliveryThreshold: 319
};

export const StoreSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);

  const abortRef = useRef(null);

  const loadSettings = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/settings`, { signal: controller.signal });
      if (!res.ok) return;

      const result = await res.json();
      if (controller.signal.aborted) return;

      if (result.data?.settings) setSettings(result.data.settings);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      logger.error('Could not load store settings:', err);
    } finally {
      if (!controller.signal.aborted) setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const abortRefCurrent = abortRef;
    void (async () => { await loadSettings(); })();
    return () => abortRefCurrent.current?.abort();
  }, [loadSettings]);

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), RECHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const value = useMemo(() => {
    void tick;
    const closedNotice = getClosedNotice(settings);
    const unavailableCategories = settings.unavailableCategories || [];

    return {
      settings,
      loaded,
      closedNotice,
      accepting: !closedNotice,
      unavailableCategories,
      isCategoryUnavailable: (category) => Boolean(category) && unavailableCategories.includes(category),
      deliveryFeeFor: (goodsTotal, orderType) => {
        if (orderType !== 'delivery') return 0;
        if (goodsTotal >= settings.freeDeliveryThreshold) return 0;
        return settings.deliveryFee;
      },
      refreshSettings: loadSettings
    };
  }, [settings, loaded, tick, loadSettings]);

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
};
