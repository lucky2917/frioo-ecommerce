import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL } from '../config/constants';
import { fetchWithTimeout } from '../lib/http';
import { logger } from '../utils/logger';

const READ_KEY = 'frioo_notifications_read';
const CHANNEL_NAME = 'frioo-notifications';
const MAX_TRACKED_READ = 200;

const readStoredIds = () => {
  try {
    const raw = localStorage.getItem(READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistReadIds = (ids) => {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-MAX_TRACKED_READ)));
  } catch {
    logger.warn('Could not persist notification read state');
  }
};

export function useNotificationInbox() {
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(readStoredIds);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const channelRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetchWithTimeout(`${API_BASE_URL}/api/admin/notifications?limit=30`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const json = await res.json();
      if (!res.ok || !json.success) return;

      if (mountedRef.current) setItems(json.data.notifications || []);
    } catch (err) {
      logger.warn('Could not load notification inbox', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-notification-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        void load();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [load]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type === 'read-sync' && mountedRef.current) {
        setReadIds(event.data.ids || []);
      }
      if (event.data?.type === 'refresh') void load();
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [load]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const onMessage = (event) => {
      if (event.data?.source !== 'frioo-push' || !event.data.notification) return;
      void load();
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [load]);

  const broadcastRead = useCallback((ids) => {
    persistReadIds(ids);
    channelRef.current?.postMessage({ type: 'read-sync', ids });
  }, []);

  const markRead = useCallback((id) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      broadcastRead(next);
      return next;
    });
  }, [broadcastRead]);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, ...items.map((item) => item.id)]));
      broadcastRead(next);
      return next;
    });
  }, [items, broadcastRead]);

  const unreadCount = useMemo(
    () => items.filter((item) => !readIds.includes(item.id)).length,
    [items, readIds]
  );

  const entries = useMemo(
    () => items.map((item) => ({ ...item, read: readIds.includes(item.id) })),
    [items, readIds]
  );

  return { entries, unreadCount, loading, markRead, markAllRead, refresh: load };
}
