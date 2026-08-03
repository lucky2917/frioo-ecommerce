import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationInbox } from '../../hooks/useNotificationInbox';
import { relativeTime } from '../../utils/relativeTime';

const describe = (entry) => {
  const payload = entry.payload || {};

  if (entry.notification_type === 'NEW_ORDER') {
    const parts = [
      `Order #${payload.orderId}`,
      payload.total !== undefined ? `₹${Number(payload.total).toFixed(0)}` : null,
      payload.itemCount ? `${payload.itemCount} ${payload.itemCount === 1 ? 'item' : 'items'}` : null,
      payload.orderType ? payload.orderType.charAt(0).toUpperCase() + payload.orderType.slice(1) : null
    ].filter(Boolean);
    return { title: 'New order received', detail: parts.join(' · ') };
  }

  return { title: entry.notification_type.replace(/_/g, ' ').toLowerCase(), detail: '' };
};

export default function NotificationInbox() {
  const { entries, unreadCount, loading, markRead, markAllRead } = useNotificationInbox();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const closeOutside = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const closeEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [open]);

  const openEntry = (entry) => {
    markRead(entry.id);
    setOpen(false);
    if (entry.notification_type === 'NEW_ORDER') navigate('/admin/orders');
  };

  return (
    <div className="adm-inbox" ref={wrapRef}>
      <button
        type="button"
        className="adm-inbox-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="adm-inbox-dot" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="adm-inbox-panel" role="dialog" aria-label="Notifications">
          <div className="adm-inbox-head">
            <h2 className="adm-inbox-title">Notifications</h2>
            {unreadCount > 0 && (
              <button type="button" className="adm-inbox-clear" onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          <div className="adm-inbox-list">
            {loading && <p className="adm-inbox-empty">Loading…</p>}
            {!loading && entries.length === 0 && <p className="adm-inbox-empty">No notifications yet.</p>}

            {entries.map((entry) => {
              const { title, detail } = describe(entry);
              return (
                <button
                  type="button"
                  key={entry.id}
                  className={`adm-inbox-item${entry.read ? '' : ' adm-inbox-item-unread'}`}
                  onClick={() => openEntry(entry)}
                >
                  <span className="adm-inbox-item-top">
                    <span className="adm-inbox-item-title">{title}</span>
                    <span className="adm-inbox-item-time">{relativeTime(entry.created_at)}</span>
                  </span>
                  {detail && <span className="adm-inbox-item-detail">{detail}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .adm-inbox { position: relative; }
        .adm-inbox-trigger { position: relative; width: 42px; height: 42px; display: inline-flex; align-items: center; justify-content: center; background: none; border: 1px solid var(--adm-line, #e2e8e5); border-radius: 999px; color: var(--adm-text, #16211b); cursor: pointer; }
        .adm-inbox-trigger:hover { border-color: #1B4D3E; color: #1B4D3E; }
        .adm-inbox-trigger:focus-visible { outline: 2px solid #1B4D3E; outline-offset: 3px; }
        .adm-inbox-dot { position: absolute; top: -2px; right: -2px; min-width: 18px; height: 18px; padding: 0 5px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #B23A2E; color: #fff; font-family: var(--fr-font-sans); font-size: 0.6875rem; font-weight: 700; }
        .adm-inbox-panel { position: absolute; top: calc(100% + 8px); right: 0; width: min(360px, calc(100vw - 32px)); max-height: 420px; display: flex; flex-direction: column; background: var(--adm-surface, #fff); border: 1px solid var(--adm-line, #e2e8e5); border-radius: 12px; box-shadow: 0 18px 40px -18px rgba(18,32,26,0.32); z-index: 200; overflow: hidden; }
        .adm-inbox-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--adm-line, #eef2f0); }
        .adm-inbox-title { font-family: var(--fr-font-sans); font-size: 0.9375rem; font-weight: 700; margin: 0; color: var(--adm-text, #16211b); }
        .adm-inbox-clear { background: none; border: none; padding: 4px; font-family: var(--fr-font-sans); font-size: 0.75rem; font-weight: 600; color: #1B4D3E; cursor: pointer; }
        .adm-inbox-clear:hover { text-decoration: underline; }
        .adm-inbox-clear:focus-visible { outline: 2px solid #1B4D3E; outline-offset: 2px; border-radius: 4px; }
        .adm-inbox-list { overflow-y: auto; }
        .adm-inbox-empty { font-family: var(--fr-font-sans); font-size: 0.8125rem; font-weight: 500; color: var(--adm-text-2, #55635c); margin: 0; padding: 24px 16px; text-align: center; }
        .adm-inbox-item { display: flex; flex-direction: column; gap: 3px; width: 100%; padding: 12px 16px; background: none; border: none; border-bottom: 1px solid var(--adm-line, #f1f5f3); text-align: left; cursor: pointer; }
        .adm-inbox-item:hover { background: var(--adm-surface-2, #f4f8f5); }
        .adm-inbox-item:focus-visible { outline: 2px solid #1B4D3E; outline-offset: -2px; }
        .adm-inbox-item-unread { background: #F2F8F4; }
        .adm-inbox-item-unread .adm-inbox-item-title::before { content: ''; display: inline-block; width: 6px; height: 6px; margin-right: 7px; border-radius: 50%; background: #1B4D3E; vertical-align: middle; }
        .adm-inbox-item-top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
        .adm-inbox-item-title { font-family: var(--fr-font-sans); font-size: 0.875rem; font-weight: 600; color: var(--adm-text, #16211b); }
        .adm-inbox-item-time { font-family: var(--fr-font-sans); font-size: 0.6875rem; font-weight: 500; color: var(--adm-text-2, #7b8a83); white-space: nowrap; }
        .adm-inbox-item-detail { font-family: var(--fr-font-sans); font-size: 0.8125rem; font-weight: 500; color: var(--adm-text-2, #55635c); }
      `}</style>
    </div>
  );
}
