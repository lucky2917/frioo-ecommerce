import { Link, Navigate, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import OrderNutrition from '../components/orders/OrderNutrition';
import { getStatusPresentation } from '../utils/orderStatus';

const formatPlacedAt = (value) => {
  if (!value) return null;
  const placed = new Date(value);
  if (Number.isNaN(placed.getTime())) return null;
  return placed.toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
  });
};

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order) return <Navigate to="/orders" replace />;

  const items = Array.isArray(order.items) ? order.items : [];
  const placedAt = formatPlacedAt(order.created_at);
  const isDelivery = order.order_type === 'delivery';
  const { label: statusLabel } = getStatusPresentation(order.status);

  return (
    <div className="oc-page">
      <SEO title="Order confirmed" description="Your Frioo order is confirmed." />

      <div className="oc-container">
        <div className="oc-head">
          <span className="oc-mark" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <h1 className="oc-title">Order confirmed</h1>
          <p className="oc-sub">We have your order and we&apos;re getting it ready.</p>
        </div>

        <dl className="oc-facts">
          <div className="oc-fact">
            <dt>Order</dt>
            <dd className="oc-fact-id">#{order.id}</dd>
          </div>
          {placedAt && (
            <div className="oc-fact">
              <dt>Placed</dt>
              <dd>{placedAt}</dd>
            </div>
          )}
          <div className="oc-fact">
            <dt>Status</dt>
            <dd>{statusLabel}</dd>
          </div>
          <div className="oc-fact">
            <dt>{isDelivery ? 'Delivering to' : 'Collect from'}</dt>
            <dd>{isDelivery ? (order.delivery_address || 'Address on your profile') : 'Our Visakhapatnam store'}</dd>
          </div>
        </dl>

        {items.length > 0 && (
          <div className="oc-items">
            <h2 className="oc-items-title">What you ordered</h2>
            <ul className="oc-item-list">
              {items.map((item, index) => (
                <li key={`${item.id ?? index}-${item.variant ?? ''}`} className="oc-item">
                  <span className="oc-item-qty">{item.qty}&times;</span>
                  <span className="oc-item-name">
                    {item.title}
                    {item.variant && <span className="oc-item-variant"> · {item.variant}</span>}
                  </span>
                  <span className="oc-item-price">&#8377;{Number(item.price * item.qty).toFixed(0)}</span>
                </li>
              ))}
            </ul>
            <div className="oc-total">
              <span>Total paid on {isDelivery ? 'delivery' : 'pickup'}</span>
              <strong>&#8377;{Number(order.total_amount).toFixed(0)}</strong>
            </div>
          </div>
        )}

        {order.nutrition_summary && (
          <div className="oc-nutrition">
            <OrderNutrition summary={order.nutrition_summary} />
          </div>
        )}

        <p className="oc-next">
          We&apos;ll update the status as your order moves. You can follow it from your orders page.
        </p>

        <div className="oc-actions">
          <Link to="/orders" className="oc-primary">Track this order</Link>
          <Link to="/shop" className="oc-secondary">Continue shopping</Link>
        </div>
      </div>

      <style>{`
        .oc-page { background: var(--fr-canvas); min-height: 70vh; padding: var(--fr-s9) var(--fr-s5) var(--fr-s10); }
        .oc-container { max-width: 620px; margin: 0 auto; background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-surface); box-shadow: var(--fr-elev-1); padding: var(--fr-s8) var(--fr-s7); }
        .oc-head { text-align: center; margin-bottom: var(--fr-s7); }
        .oc-mark { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: var(--fr-r-pill); background: var(--fr-brand-tint); color: var(--fr-success); margin-bottom: var(--fr-s4); }
        .oc-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-headline); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0 0 var(--fr-s2); }
        .oc-sub { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }

        .oc-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--fr-s4); margin: 0 0 var(--fr-s7); padding: var(--fr-s5); background: var(--fr-surface-2); border-radius: var(--fr-r-card); }
        .oc-fact { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .oc-fact dt { font-family: var(--fr-font-sans); font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-eyebrow); text-transform: uppercase; color: var(--fr-text-3); }
        .oc-fact dd { margin: 0; font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text); word-break: break-word; }
        .oc-fact-id { font-family: var(--fr-font-mono); font-weight: var(--fr-fw-bold); font-variant-numeric: tabular-nums; }

        .oc-items-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0 0 var(--fr-s4); }
        .oc-item-list { list-style: none; margin: 0 0 var(--fr-s4); padding: 0; display: flex; flex-direction: column; gap: var(--fr-s3); }
        .oc-item { display: flex; align-items: baseline; gap: var(--fr-s3); }
        .oc-item-qty { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-bold); color: var(--fr-brand); font-variant-numeric: tabular-nums; min-width: 28px; }
        .oc-item-name { flex: 1; min-width: 0; font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); color: var(--fr-text); }
        .oc-item-variant { font-weight: var(--fr-fw-regular); color: var(--fr-text-2); }
        .oc-item-price { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); color: var(--fr-text); font-variant-numeric: tabular-nums; white-space: nowrap; }
        .oc-total { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fr-s4); padding-top: var(--fr-s4); border-top: 1px solid var(--fr-line); font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); color: var(--fr-text-2); }
        .oc-total strong { font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); font-variant-numeric: tabular-nums; }

        .oc-nutrition { margin-top: var(--fr-s6); }
        .oc-next { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: var(--fr-s6) 0 var(--fr-s5); }

        .oc-actions { display: flex; gap: var(--fr-s3); flex-wrap: wrap; }
        .oc-primary, .oc-secondary { flex: 1; min-width: 180px; display: inline-flex; align-items: center; justify-content: center; height: 52px; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); }
        .oc-primary { background: var(--fr-brand); color: var(--fr-on-brand); }
        .oc-primary:hover { background: var(--fr-brand-press); }
        .oc-secondary { background: var(--fr-surface); color: var(--fr-text); border: 1px solid var(--fr-line-strong); }
        .oc-secondary:hover { border-color: var(--fr-brand); color: var(--fr-brand); }

        @media (max-width: 600px) {
          .oc-page { padding: var(--fr-s7) var(--fr-s4) var(--fr-s9); }
          .oc-container { padding: var(--fr-s6) var(--fr-s5); }
          .oc-facts { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
