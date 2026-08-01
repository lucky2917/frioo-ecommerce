import { useEffect, useState, useCallback, useRef } from 'react';
import { useDialog } from '../../hooks/useDialog';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { DELIVERY_STATUS_DURATION_MS } from '../../config/constants';
import {
  ORDER_STATUS_FLOW,
  getStatusPresentation,
  getStatusStepIndex,
  getStatusProgress,
  formatOrderAmount,
} from '../../utils/orderStatus';

const buildItemLabel = (item) => {
  const variant = item.variant && item.variant !== 'Standard' ? ` (${item.variant})` : '';
  return `${item.qty}x ${item.title}${variant}`;
};

export default function OrderTracker() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousStatusRef = useRef(null);

  const resolveOrder = useCallback((order) => {
    let next = order || null;
    if (next && next.status === 'delivered') {
      const elapsed = Date.now() - new Date(next.updated_at || next.created_at).getTime();
      if (elapsed >= DELIVERY_STATUS_DURATION_MS) next = null;
    }
    if (next) {
      if (previousStatusRef.current && previousStatusRef.current !== next.status) {
        setAnnouncement(`Order ${next.id} is now ${getStatusPresentation(next.status).label}.`);
      }
      previousStatusRef.current = next.status;
    } else {
      previousStatusRef.current = null;
    }
    setActiveOrder(next);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchLatest = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      resolveOrder(data ?? null);
    };

    fetchLatest();

    const channel = supabase
      .channel(`order-tracker-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => resolveOrder(payload.new)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, resolveOrder]);

  useDialog({ open: showDetails, onClose: () => setShowDetails(false), dialogRef, initialFocusRef: closeButtonRef });

  if (!activeOrder) return null;

  let items = activeOrder.items;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  if (!Array.isArray(items)) items = [];

  const currentStep = getStatusStepIndex(activeOrder.status);
  const progress = getStatusProgress(activeOrder.status);
  const { label: statusLabel, tone: statusTone } = getStatusPresentation(activeOrder.status);
  const titleId = 'fr-ot-title';

  return (
    <>
      <div className="fr-ot-live" aria-live="polite">{announcement}</div>

      <div className="fr-ot-bar">
        <div className="fr-ot-bar-left">
          <span className="fr-ot-pulse" aria-hidden="true" />
          <span className="fr-ot-bar-text">
            Order #{activeOrder.id} &middot; <strong>{statusLabel}</strong>
          </span>
        </div>
        <button className="fr-ot-track-btn" onClick={() => setShowDetails(true)}>Track</button>
      </div>

      {showDetails && (
        <div className="fr-ot-overlay" onClick={() => setShowDetails(false)}>
          <div
            className="fr-ot-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fr-ot-modal-header">
              <h3 className="fr-ot-modal-title" id={titleId}>Order #{activeOrder.id}</h3>
              <button
                className="fr-ot-close-btn"
                onClick={() => setShowDetails(false)}
                aria-label="Close order tracker"
                ref={closeButtonRef}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className={`fr-ot-status-chip fr-status--${statusTone}`}>{statusLabel}</div>

            <div className="fr-ot-progress-wrap">
              <div className="fr-ot-progress-track">
                <div className="fr-ot-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <ol className="fr-ot-steps">
                {ORDER_STATUS_FLOW.map((stepKey, index) => (
                  <li key={stepKey} className={`fr-ot-step${index <= currentStep ? ' done' : ''}`}>
                    <span className="fr-ot-dot" aria-hidden="true" />
                    <span className="fr-ot-step-label">{getStatusPresentation(stepKey).label}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="fr-ot-items-box">
              <p className="fr-ot-items-heading">Items</p>
              {items.map((item, i) => (
                <div key={i} className="fr-ot-item-row">
                  <span>{buildItemLabel(item)}</span>
                  <span>&#8377;{formatOrderAmount(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="fr-ot-total-row">
                <span>Total paid</span>
                <span>&#8377;{formatOrderAmount(activeOrder.total_amount)}</span>
              </div>
            </div>

            <a
              href={`https://wa.me/919010900688?text=Help with Order #${activeOrder.id}`}
              target="_blank"
              rel="noreferrer"
              className="fr-ot-help-link"
            >
              Message the shop on WhatsApp
            </a>
          </div>
        </div>
      )}

      <style>{`
        .fr-ot-live {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .fr-ot-bar {
          position: fixed;
          top: calc(var(--navbar-height-mobile) + var(--fr-s2));
          left: 50%;
          transform: translateX(-50%);
          width: min(92%, 560px);
          background: var(--fr-brand);
          color: var(--fr-on-brand);
          padding: var(--fr-s2) var(--fr-s4);
          border-radius: var(--fr-r-pill);
          z-index: var(--fr-z-cta);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--fr-s3);
          box-shadow: var(--fr-elev-2);
        }

        @media (min-width: 900px) {
          .fr-ot-bar { top: calc(var(--navbar-height-desktop) + var(--fr-s2)); }
        }

        .fr-ot-bar-left {
          display: flex;
          align-items: center;
          gap: var(--fr-s2);
          min-width: 0;
        }

        .fr-ot-pulse {
          width: 9px;
          height: 9px;
          background: var(--fr-on-brand);
          border-radius: 50%;
          flex-shrink: 0;
        }

        @media (prefers-reduced-motion: no-preference) {
          .fr-ot-pulse { animation: fr-ot-pulse 2s var(--fr-ease-standard) infinite; }
        }

        @keyframes fr-ot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
        }

        .fr-ot-bar-text {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fr-ot-track-btn {
          background: var(--fr-on-brand);
          color: var(--fr-brand);
          border: none;
          padding: var(--fr-s1) var(--fr-s4);
          border-radius: var(--fr-r-pill);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-control);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-control);
          cursor: pointer;
          flex-shrink: 0;
          transition: opacity var(--fr-dur-quick) var(--fr-ease-standard);
        }

        .fr-ot-track-btn:hover { opacity: 0.9; }

        .fr-ot-overlay {
          position: fixed;
          inset: 0;
          background: var(--fr-scrim);
          z-index: var(--fr-z-modal);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--fr-s5);
        }

        .fr-ot-modal {
          background: var(--fr-surface);
          width: 100%;
          max-width: 480px;
          border-radius: var(--fr-r-surface);
          padding: var(--fr-s6);
          max-height: 88vh;
          overflow-y: auto;
          box-shadow: var(--fr-elev-3);
        }

        @media (prefers-reduced-motion: no-preference) {
          .fr-ot-modal { animation: fr-ot-rise var(--fr-dur-base) var(--fr-ease-settle); }
        }

        @keyframes fr-ot-rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fr-ot-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--fr-s4);
        }

        .fr-ot-modal-title {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          letter-spacing: var(--fr-track-headline);
          line-height: var(--fr-lh-snug);
          color: var(--fr-text);
          margin: 0;
        }

        .fr-ot-close-btn {
          background: none;
          border: none;
          line-height: 0;
          cursor: pointer;
          color: var(--fr-text-2);
          padding: var(--fr-s2);
          border-radius: var(--fr-r-control);
          transition: background var(--fr-dur-quick) var(--fr-ease-standard);
        }

        .fr-ot-close-btn:hover { background: var(--fr-surface-2); }

        .fr-ot-status-chip {
          display: inline-block;
          padding: var(--fr-s1) var(--fr-s3);
          border-radius: var(--fr-r-pill);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-snug);
          margin-bottom: var(--fr-s5);
        }

        .fr-status--info { background: var(--fr-info-tint); color: var(--fr-info); }
        .fr-status--brand { background: var(--fr-brand-tint); color: var(--fr-brand); }
        .fr-status--success { background: var(--fr-brand-tint); color: var(--fr-success); }
        .fr-status--danger { background: var(--fr-warm-tint); color: var(--fr-danger); }

        .fr-ot-progress-wrap { margin-bottom: var(--fr-s6); }

        .fr-ot-progress-track {
          height: 4px;
          background: var(--fr-line);
          border-radius: var(--fr-r-pill);
          margin-bottom: var(--fr-s3);
          position: relative;
        }

        .fr-ot-progress-fill {
          position: absolute;
          inset: 0;
          height: 4px;
          background: var(--fr-brand);
          border-radius: var(--fr-r-pill);
          transition: width var(--fr-dur-expressive) var(--fr-ease-settle);
        }

        @media (prefers-reduced-motion: reduce) {
          .fr-ot-progress-fill { transition: none; }
        }

        .fr-ot-steps {
          display: flex;
          justify-content: space-between;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .fr-ot-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 16.66%;
        }

        .fr-ot-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--fr-line-strong);
          margin-bottom: var(--fr-s2);
          transition: background var(--fr-dur-base) var(--fr-ease-standard);
        }

        .fr-ot-step.done .fr-ot-dot {
          background: var(--fr-brand);
          box-shadow: 0 0 0 2px var(--fr-surface), 0 0 0 3px var(--fr-brand);
        }

        .fr-ot-step-label {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-label);
          font-weight: var(--fr-fw-regular);
          color: var(--fr-text-3);
          text-align: center;
          line-height: var(--fr-lh-snug);
        }

        .fr-ot-step.done .fr-ot-step-label {
          color: var(--fr-text-2);
          font-weight: var(--fr-fw-medium);
        }

        .fr-ot-items-box {
          background: var(--fr-surface-2);
          border: 1px solid var(--fr-line);
          border-radius: var(--fr-r-card);
          padding: var(--fr-s4);
          margin-bottom: var(--fr-s4);
        }

        .fr-ot-items-heading {
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-caption);
          color: var(--fr-text-2);
          margin: 0 0 var(--fr-s3);
          line-height: var(--fr-lh-normal);
        }

        .fr-ot-item-row {
          display: flex;
          justify-content: space-between;
          gap: var(--fr-s3);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-body);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text);
          margin-bottom: var(--fr-s2);
        }

        .fr-ot-total-row {
          display: flex;
          justify-content: space-between;
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-body);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-normal);
          font-variant-numeric: tabular-nums;
          color: var(--fr-text);
          border-top: 1px solid var(--fr-line);
          padding-top: var(--fr-s3);
          margin-top: var(--fr-s2);
        }

        .fr-ot-help-link {
          display: block;
          width: 100%;
          padding: var(--fr-s4);
          background: var(--fr-brand);
          color: var(--fr-on-brand);
          border-radius: var(--fr-r-control);
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          text-align: center;
          text-decoration: none;
          box-sizing: border-box;
          transition: background var(--fr-dur-quick) var(--fr-ease-standard);
        }

        .fr-ot-help-link:hover { background: var(--fr-brand-press); }
      `}</style>
    </>
  );
}
