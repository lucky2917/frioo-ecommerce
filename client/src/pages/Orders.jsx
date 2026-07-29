import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import {
  ORDER_STATUS_FLOW,
  getStatusPresentation,
  getStatusStepIndex,
  getStatusProgress,
  isActiveStatus,
  formatOrderAmount,
} from '../utils/orderStatus';

const parseItems = (raw) => {
  let items = raw;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  return Array.isArray(items) ? items : [];
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const formatTime = (value) =>
  new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const SkeletonOrder = () => (
  <div className="fr-ord-skel" aria-hidden="true">
    <div className="fr-ord-skel-head">
      <div className="fr-ord-skel-line fr-ord-skel-sm" />
      <div className="fr-ord-skel-line fr-ord-skel-chip" />
    </div>
    <div className="fr-ord-skel-line" />
    <div className="fr-ord-skel-line fr-ord-skel-short" />
    <div className="fr-ord-skel-line fr-ord-skel-btn" />
  </div>
);

export default function Orders() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [reorderedId, setReorderedId] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const fetchOrders = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setOrders(data || []);
      } catch (err) {
        logger.error('Failed to fetch orders:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const channel = supabase
      .channel(`orders-user-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        setAnnouncement(`Order #${payload.new.id} is now ${getStatusPresentation(payload.new.status).label}.`);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, reloadKey]);

  const handleReorder = (order) => {
    const items = parseItems(order.items);
    if (items.length === 0) return;

    items.forEach(item => {
      const product = {
        id: item.id,
        title: item.title,
        images: [item.image]
      };
      addToCart(product, item.variant, item.price, item.preferences);
    });

    setReorderedId(order.id);
  };

  if (authLoading) return <LoadingSpinner fullScreen />;

  const activeOrder = orders.find(o => isActiveStatus(o.status));
  const historyOrders = activeOrder ? orders.filter(o => o.id !== activeOrder.id) : orders;

  const renderMeta = (order) => {
    const isDelivery = order.order_type === 'delivery';
    return (
      <div className="fr-ord-meta">
        <span className="fr-ord-meta-item">{isDelivery ? 'Delivery' : 'Pickup'}</span>
        <span className="fr-ord-meta-sep" aria-hidden="true">&middot;</span>
        <span className="fr-ord-meta-item">{formatDate(order.created_at)}</span>
        <span className="fr-ord-meta-sep" aria-hidden="true">&middot;</span>
        <span className="fr-ord-meta-item">{formatTime(order.created_at)}</span>
      </div>
    );
  };

  const renderItems = (order) => {
    const items = parseItems(order.items);
    return items.map((item, i) => {
      const showVariant = item.variant && item.variant !== 'Standard';
      const exclusions = item.preferences?.exclusions;
      const removed = item.preferences?.removedIngredients;
      return (
        <div key={i} className="fr-ord-item">
          <div className="fr-ord-item-qty">{item.qty}&times;</div>
          <div className="fr-ord-item-details">
            <span className="fr-ord-item-name">{item.title}</span>
            {showVariant && <span className="fr-ord-item-variant">{item.variant}</span>}
            {(exclusions?.length > 0 || removed?.length > 0) && (
              <div className="fr-ord-item-prefs">
                {exclusions?.length > 0 && <span>No {exclusions.join(', ')}</span>}
                {removed?.length > 0 && <span>No {removed.join(', ')}</span>}
              </div>
            )}
          </div>
          <div className="fr-ord-item-price">&#8377;{formatOrderAmount(item.price * item.qty)}</div>
        </div>
      );
    });
  };

  const renderTimeline = (order) => {
    const currentStep = getStatusStepIndex(order.status);
    const progress = getStatusProgress(order.status);
    const { label } = getStatusPresentation(order.status);
    const total = ORDER_STATUS_FLOW.length;
    const stepNumber = Math.min(currentStep + 1, total);
    return (
      <div className="fr-ord-timeline">
        <div className="fr-ord-timeline-head">
          <span className="fr-ord-timeline-label">{label}</span>
          <span className="fr-ord-timeline-step">Step {stepNumber} of {total}</span>
        </div>
        <div className="fr-ord-timeline-track">
          <div className="fr-ord-timeline-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  };

  const renderOrderCard = (order, active) => {
    const { label: statusLabel, tone } = getStatusPresentation(order.status);
    const isDelivery = order.order_type === 'delivery';
    const hasDiscount = order.discount && Number(order.discount) > 0;
    return (
      <article key={order.id} className={`fr-ord-card${active ? ' fr-ord-card-active' : ''}`}>
        {active && <div className="fr-ord-active-tag">Active order</div>}

        <div className="fr-ord-card-head">
          <div className="fr-ord-head-left">
            <span className="fr-ord-id">Order #{order.id}</span>
            {renderMeta(order)}
          </div>
          <div className="fr-ord-head-right">
            <span className={`fr-ord-status fr-status--${tone}`}>{statusLabel}</span>
            <span className="fr-ord-total">&#8377;{formatOrderAmount(order.total_amount)}</span>
          </div>
        </div>

        {active && renderTimeline(order)}

        <div className="fr-ord-card-body">
          {renderItems(order)}

          {isDelivery && order.address && (
            <div className="fr-ord-detail-row">
              <span className="fr-ord-detail-key">Delivering to</span>
              <span className="fr-ord-detail-val">{order.address}</span>
            </div>
          )}
          {order.coupon_code && (
            <div className="fr-ord-detail-row">
              <span className="fr-ord-detail-key">Coupon</span>
              <span className="fr-ord-detail-val">
                {order.coupon_code}
                {hasDiscount && <span className="fr-ord-discount"> &minus;&#8377;{formatOrderAmount(order.discount)}</span>}
              </span>
            </div>
          )}
          {order.notes && (
            <div className="fr-ord-note">
              <strong>Note</strong> {order.notes}
            </div>
          )}
        </div>

        <div className="fr-ord-card-foot">
          {reorderedId === order.id ? (
            <div className="fr-ord-reordered">
              <span className="fr-ord-reordered-text">Added to your cart.</span>
              <Link to="/cart" className="fr-ord-cart-link">Review cart</Link>
            </div>
          ) : (
            <button className="fr-ord-reorder" onClick={() => handleReorder(order)}>
              Reorder these items
            </button>
          )}
          <Link to="/contact" className="fr-ord-help">Need help?</Link>
        </div>
      </article>
    );
  };

  const renderBody = () => {
    if (!user) {
      return (
        <div className="fr-ord-state">
          <StateIcon />
          <h2 className="fr-ord-state-title">Sign in to view your orders</h2>
          <p className="fr-ord-state-text">Your order history and live tracking live in your account.</p>
          <button className="fr-ord-state-btn" onClick={signInWithGoogle}>Sign in</button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="fr-ord-list">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonOrder key={i} />)}
        </div>
      );
    }

    if (error) {
      return (
        <div className="fr-ord-state">
          <StateIcon />
          <h2 className="fr-ord-state-title">We couldn't load your orders</h2>
          <p className="fr-ord-state-text">Something went wrong on our side. Please try again.</p>
          <button className="fr-ord-state-btn" onClick={() => setReloadKey(k => k + 1)}>Retry</button>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="fr-ord-state">
          <StateIcon />
          <h2 className="fr-ord-state-title">No orders yet</h2>
          <p className="fr-ord-state-text">When you place your first order, it will show up here.</p>
          <Link to="/shop" className="fr-ord-state-btn">Browse the shop</Link>
        </div>
      );
    }

    return (
      <>
        {activeOrder && (
          <section className="fr-ord-section" aria-label="Active order">
            {renderOrderCard(activeOrder, true)}
          </section>
        )}
        {historyOrders.length > 0 && (
          <section className="fr-ord-section" aria-label="Order history">
            {activeOrder && <h2 className="fr-ord-section-title">Earlier orders</h2>}
            <div className="fr-ord-list">
              {historyOrders.map(order => renderOrderCard(order, false))}
            </div>
          </section>
        )}
      </>
    );
  };

  return (
    <div className="fr-ord-page">
      <SEO title="My Orders" description="Track your orders and reorder favourites." />
      <Navbar />

      <div className="fr-ord-live" aria-live="polite">{announcement}</div>

      <div className="fr-ord-container">
        <header className="fr-ord-header">
          <h1 className="fr-ord-title">Your orders</h1>
          <p className="fr-ord-subtitle">Track what's on the way and reorder what you love.</p>
        </header>

        {renderBody()}
      </div>

      <style>{`
        .fr-ord-page {
          background: var(--fr-canvas);
          min-height: 100vh;
          padding-bottom: var(--fr-s10);
        }

        .fr-ord-live {
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

        .fr-ord-container {
          max-width: 760px;
          margin: 0 auto;
          padding: calc(var(--navbar-height-mobile) + var(--fr-s6)) var(--fr-s4) var(--fr-s6);
        }

        @media (min-width: 900px) {
          .fr-ord-container {
            padding-top: calc(var(--navbar-height-desktop) + var(--fr-s7));
          }
        }

        .fr-ord-header { margin-bottom: var(--fr-s7); }

        .fr-ord-title {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-headline);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-tight);
          letter-spacing: var(--fr-track-headline);
          color: var(--fr-text);
          margin: 0 0 var(--fr-s2);
        }

        .fr-ord-subtitle {
          font-family: var(--fr-font-sans);
          color: var(--fr-text-2);
          font-size: var(--fr-fs-body);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          margin: 0;
        }

        .fr-ord-section { margin-bottom: var(--fr-s7); }
        .fr-ord-section:last-child { margin-bottom: 0; }

        .fr-ord-section-title {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          color: var(--fr-text-2);
          line-height: var(--fr-lh-snug);
          margin: 0 0 var(--fr-s4);
        }

        .fr-ord-list {
          display: flex;
          flex-direction: column;
          gap: var(--fr-s5);
        }

        .fr-ord-card {
          background: var(--fr-surface);
          border-radius: var(--fr-r-surface);
          border: 1px solid var(--fr-line);
          box-shadow: var(--fr-elev-1);
          overflow: hidden;
        }

        .fr-ord-card-active {
          border-color: var(--fr-line-strong);
          box-shadow: var(--fr-elev-2);
        }

        .fr-ord-active-tag {
          background: var(--fr-brand);
          color: var(--fr-on-brand);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-label);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-snug);
          text-transform: uppercase;
          padding: var(--fr-s2) var(--fr-s5);
        }

        .fr-ord-card-head {
          padding: var(--fr-s5);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--fr-s4);
          border-bottom: 1px solid var(--fr-line);
        }

        .fr-ord-head-left { display: flex; flex-direction: column; gap: var(--fr-s2); min-width: 0; }

        .fr-ord-id {
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-bold);
          font-size: var(--fr-fs-body);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text);
        }

        .fr-ord-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--fr-s2);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text-2);
        }

        .fr-ord-meta-sep { color: var(--fr-text-3); }

        .fr-ord-head-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--fr-s2);
          flex-shrink: 0;
        }

        .fr-ord-status {
          padding: var(--fr-s1) var(--fr-s3);
          border-radius: var(--fr-r-pill);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-snug);
          white-space: nowrap;
        }

        .fr-status--info { background: #E3EDF3; color: var(--fr-info); }
        .fr-status--brand { background: var(--fr-brand-tint); color: var(--fr-brand); }
        .fr-status--success { background: var(--fr-brand-tint); color: var(--fr-success); }
        .fr-status--danger { background: var(--fr-warm-tint); color: var(--fr-danger); }

        .fr-ord-total {
          font-family: var(--fr-font-display);
          font-weight: var(--fr-fw-bold);
          font-size: var(--fr-fs-lead);
          line-height: var(--fr-lh-snug);
          font-variant-numeric: tabular-nums;
          color: var(--fr-text);
        }

        .fr-ord-timeline {
          padding: var(--fr-s4) var(--fr-s5);
          border-bottom: 1px solid var(--fr-line);
          background: var(--fr-brand-tint);
        }

        .fr-ord-timeline-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: var(--fr-s2);
        }

        .fr-ord-timeline-label {
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-caption);
          line-height: var(--fr-lh-normal);
          color: var(--fr-brand);
        }

        .fr-ord-timeline-step {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-label);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-snug);
          color: var(--fr-text-2);
        }

        .fr-ord-timeline-track {
          height: 4px;
          background: var(--fr-surface);
          border-radius: var(--fr-r-pill);
          position: relative;
          overflow: hidden;
        }

        .fr-ord-timeline-fill {
          position: absolute;
          inset: 0;
          height: 4px;
          background: var(--fr-brand);
          border-radius: var(--fr-r-pill);
          transition: width var(--fr-dur-expressive) var(--fr-ease-settle);
        }

        @media (prefers-reduced-motion: reduce) {
          .fr-ord-timeline-fill { transition: none; }
        }

        .fr-ord-card-body { padding: var(--fr-s5); }

        .fr-ord-item {
          display: flex;
          align-items: flex-start;
          gap: var(--fr-s3);
          padding: var(--fr-s3) 0;
          border-bottom: 1px solid var(--fr-line);
        }

        .fr-ord-item:first-child { padding-top: 0; }

        .fr-ord-item-qty {
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-bold);
          font-size: var(--fr-fs-body);
          font-variant-numeric: tabular-nums;
          color: var(--fr-brand);
          min-width: 32px;
        }

        .fr-ord-item-details { flex: 1; display: flex; flex-direction: column; gap: 2px; }

        .fr-ord-item-name {
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-body);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text);
        }

        .fr-ord-item-variant {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text-2);
        }

        .fr-ord-item-prefs {
          display: flex;
          flex-wrap: wrap;
          gap: var(--fr-s3);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          color: var(--fr-warm);
          margin-top: 2px;
        }

        .fr-ord-item-price {
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-body);
          font-variant-numeric: tabular-nums;
          color: var(--fr-text);
        }

        .fr-ord-detail-row {
          display: flex;
          justify-content: space-between;
          gap: var(--fr-s4);
          padding-top: var(--fr-s3);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-body);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
        }

        .fr-ord-detail-key { color: var(--fr-text-2); flex-shrink: 0; }
        .fr-ord-detail-val { color: var(--fr-text); text-align: right; }
        .fr-ord-discount { color: var(--fr-success); font-weight: var(--fr-fw-medium); }

        .fr-ord-note {
          margin-top: var(--fr-s4);
          padding: var(--fr-s3) var(--fr-s4);
          background: var(--fr-warm-tint);
          border-radius: var(--fr-r-card);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text);
        }

        .fr-ord-note strong { color: var(--fr-warm); margin-right: var(--fr-s2); }

        .fr-ord-card-foot {
          padding: var(--fr-s4) var(--fr-s5);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--fr-s4);
          border-top: 1px solid var(--fr-line);
          background: var(--fr-surface);
        }

        .fr-ord-reorder {
          background: var(--fr-surface);
          border: 1px solid var(--fr-line-strong);
          color: var(--fr-brand);
          padding: var(--fr-s2) var(--fr-s4);
          border-radius: var(--fr-r-control);
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          cursor: pointer;
          transition: background var(--fr-dur-quick) var(--fr-ease-standard), border-color var(--fr-dur-quick) var(--fr-ease-standard);
        }

        .fr-ord-reorder:hover { background: var(--fr-brand-tint); border-color: var(--fr-brand); }

        .fr-ord-reordered { display: flex; align-items: center; gap: var(--fr-s3); flex-wrap: wrap; }

        .fr-ord-reordered-text {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          line-height: var(--fr-lh-normal);
          color: var(--fr-success);
          font-weight: var(--fr-fw-regular);
        }

        .fr-ord-cart-link {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-control);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-control);
          color: var(--fr-brand);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .fr-ord-help {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          color: var(--fr-text-2);
          text-decoration: none;
        }

        .fr-ord-help:hover { color: var(--fr-text); }

        .fr-ord-state {
          text-align: center;
          padding: var(--fr-s9) var(--fr-s4);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .fr-ord-state-icon { color: var(--fr-text-3); margin-bottom: var(--fr-s4); }

        .fr-ord-state-title {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          color: var(--fr-text);
          margin: 0 0 var(--fr-s2);
        }

        .fr-ord-state-text {
          font-family: var(--fr-font-sans);
          color: var(--fr-text-2);
          margin: 0 0 var(--fr-s6);
          max-width: 340px;
        }

        .fr-ord-state-btn {
          display: inline-block;
          background: var(--fr-brand);
          color: var(--fr-on-brand);
          padding: var(--fr-s3) var(--fr-s6);
          border: none;
          border-radius: var(--fr-r-control);
          font-family: var(--fr-font-sans);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          text-decoration: none;
          cursor: pointer;
          transition: background var(--fr-dur-quick) var(--fr-ease-standard);
        }

        .fr-ord-state-btn:hover { background: var(--fr-brand-press); }

        .fr-ord-skel {
          background: var(--fr-surface);
          border: 1px solid var(--fr-line);
          border-radius: var(--fr-r-surface);
          padding: var(--fr-s5);
        }

        .fr-ord-skel-head {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--fr-s5);
        }

        .fr-ord-skel-line {
          height: 14px;
          background: var(--fr-surface-2);
          border-radius: var(--fr-r-control);
          margin-bottom: var(--fr-s3);
        }

        .fr-ord-skel-sm { width: 120px; height: 16px; margin: 0; }
        .fr-ord-skel-chip { width: 90px; height: 22px; border-radius: var(--fr-r-pill); margin: 0; }
        .fr-ord-skel-short { width: 60%; }
        .fr-ord-skel-btn { width: 160px; height: 36px; margin-top: var(--fr-s4); margin-bottom: 0; }

        @media (prefers-reduced-motion: no-preference) {
          .fr-ord-skel-line { animation: fr-ord-shimmer 1.4s var(--fr-ease-standard) infinite; }
        }

        @keyframes fr-ord-shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }

        @media (max-width: 560px) {
          .fr-ord-card-head { flex-direction: column; }
          .fr-ord-head-right { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; }

        }
      `}</style>
    </div>
  );
}

const StateIcon = () => (
  <div className="fr-ord-state-icon">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
  </div>
);
