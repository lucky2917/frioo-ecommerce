import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

const DISMISSED_KEY = 'frioo_install_dismissed';
const DISMISS_DAYS = 30;
const READY_DELAY_MS = 3000;

const readDismissedAt = () => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
};

const isRecentlyDismissed = () => {
  const at = readDismissedAt();
  if (!Number.isFinite(at) || at <= 0) return false;
  return Date.now() - at < DISMISS_DAYS * 86400000;
};

const detectStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: minimal-ui)').matches ||
  window.navigator.standalone === true;

const detectIos = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

export function useInstallPrompt() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(() => detectStandalone());
  const [ready, setReady] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const deferredRef = useRef(null);
  const timerRef = useRef(null);

  const isIos = detectIos();

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      deferredRef.current = event;
      setCanPrompt(true);
    };

    const onInstalled = () => {
      deferredRef.current = null;
      setCanPrompt(false);
      setInstalled(true);
      setJustInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const sync = () => setInstalled(detectStandalone());
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(() => setReady(true), READY_DELAY_MS);
    return () => clearTimeout(timerRef.current);
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      logger.warn('Could not record install dismissal');
    }
    setCanPrompt(false);
  }, []);

  const promptInstall = useCallback(async () => {
    const deferred = deferredRef.current;
    if (!deferred) return 'unavailable';

    try {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferredRef.current = null;
      setCanPrompt(false);

      if (outcome === 'dismissed') dismiss();
      return outcome;
    } catch (err) {
      logger.error('Install prompt failed:', err);
      return 'unavailable';
    }
  }, [dismiss]);

  const acknowledgeInstall = useCallback(() => setJustInstalled(false), []);

  const eligible = ready && !installed && !isRecentlyDismissed() && (canPrompt || isIos);

  return {
    eligible,
    installed,
    isIos,
    canPrompt,
    justInstalled,
    promptInstall,
    dismiss,
    acknowledgeInstall
  };
}
