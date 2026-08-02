import { useState, useEffect, useRef, useCallback } from 'react';

const ONLINE_NOTICE_MS = 4000;

export function useConnectivity() {
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  const [showRestored, setShowRestored] = useState(false);

  const wasOfflineRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const goOffline = () => {
      wasOfflineRef.current = true;
      clearTimeout(timerRef.current);
      setShowRestored(false);
      setOnline(false);
    };

    const goOnline = () => {
      setOnline(true);
      if (!wasOfflineRef.current) return;

      wasOfflineRef.current = false;
      setShowRestored(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowRestored(false), ONLINE_NOTICE_MS);
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      clearTimeout(timerRef.current);
    };
  }, []);

  const dismissRestored = useCallback(() => {
    clearTimeout(timerRef.current);
    setShowRestored(false);
  }, []);

  return { online, showRestored, dismissRestored };
}
