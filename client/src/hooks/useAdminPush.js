import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL } from '../config/constants';
import { fetchWithTimeout } from '../lib/http';
import { logger } from '../utils/logger';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
};

const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export function useAdminPush() {
  const [supported] = useState(pushSupported);
  const [permission, setPermission] = useState(() => (pushSupported() ? Notification.permission : 'unsupported'));
  const [subscribed, setSubscribed] = useState(false);
  const [devices, setDevices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const authorizedFetch = useCallback(async (path, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sign in again to manage notifications');

    return fetchWithTimeout(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...options.headers
      }
    });
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const res = await authorizedFetch('/api/notifications/subscriptions');
      const json = await res.json();
      if (!res.ok || !json.success) return;
      if (mountedRef.current) setDevices(json.data.subscriptions || []);
    } catch (err) {
      logger.warn('Could not load notification devices', err);
    }
  }, [authorizedFetch]);

  const registerSubscription = useCallback(async (subscription) => {
    const res = await authorizedFetch('/api/notifications/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ subscription: subscription.toJSON ? subscription.toJSON() : subscription })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error?.message || 'Could not register this device');
  }, [authorizedFetch]);

  const syncExisting = useCallback(async () => {
    if (!supported || Notification.permission !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (!existing) {
        if (mountedRef.current) setSubscribed(false);
        return;
      }

      await registerSubscription(existing);
      if (mountedRef.current) setSubscribed(true);
    } catch (err) {
      logger.warn('Could not sync push subscription', err);
    }
  }, [supported, registerSubscription]);

  useEffect(() => {
    if (!supported) return;
    void (async () => {
      await syncExisting();
      await loadDevices();
    })();
  }, [supported, syncExisting, loadDevices]);

  useEffect(() => {
    if (!supported) return;

    const onMessage = (event) => {
      if (event.data?.source !== 'frioo-push' || !event.data.resubscribed) return;
      void registerSubscription(event.data.resubscribed).catch((err) =>
        logger.warn('Could not re-register renewed subscription', err)
      );
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [supported, registerSubscription]);

  const enable = useCallback(async () => {
    if (!supported || busy) return;

    setBusy(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      if (mountedRef.current) setPermission(result);

      if (result !== 'granted') {
        if (mountedRef.current) {
          setError(result === 'denied'
            ? 'Notifications are blocked for this site. Allow them in your browser settings, then try again.'
            : 'Notification permission was not granted.');
        }
        return;
      }

      const keyRes = await fetchWithTimeout(`${API_BASE_URL}/api/notifications/public-key`);
      const keyJson = await keyRes.json();
      if (!keyRes.ok || !keyJson.success) throw new Error('Push is not configured on the server yet');

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyJson.data.publicKey)
      });

      await registerSubscription(subscription);

      if (mountedRef.current) setSubscribed(true);
      await loadDevices();
    } catch (err) {
      logger.error('Could not enable notifications', err);
      if (mountedRef.current) setError(err.message || 'Could not turn on notifications');
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [supported, busy, registerSubscription, loadDevices]);

  const disable = useCallback(async () => {
    if (!supported || busy) return;

    setBusy(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      if (existing) {
        const endpoint = existing.endpoint;
        await existing.unsubscribe();
        await authorizedFetch('/api/notifications/subscriptions', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint })
        });
      }

      if (mountedRef.current) setSubscribed(false);
      await loadDevices();
    } catch (err) {
      logger.error('Could not turn off notifications', err);
      if (mountedRef.current) setError(err.message || 'Could not turn off notifications');
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [supported, busy, authorizedFetch, loadDevices]);

  const removeDevice = useCallback(async (endpoint) => {
    setBusy(true);
    try {
      await authorizedFetch('/api/notifications/subscriptions', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint })
      });
      await loadDevices();
    } catch (err) {
      logger.error('Could not remove device', err);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [authorizedFetch, loadDevices]);

  return { supported, permission, subscribed, devices, busy, error, enable, disable, removeDevice, refreshDevices: loadDevices };
}
