import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { DELIVERY_STATUS_DURATION_MS } from '../../config/constants';

const STEPS = [
  { key: 'pending', label: 'Received' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'out-for-delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderTracker() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const resolveOrder = useCallback((order) => {
    if (!order) return setActiveOrder(null);
    if (order.status !== 'delivered') return setActiveOrder(order);
    const elapsed = Date.now() - new Date(order.updated_at || order.created_at).getTime();
    setActiveOrder(elapsed < DELIVERY_STATUS_DURATION_MS ? order : null);
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

  if (!activeOrder) return null;

  let items = activeOrder.items;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  if (!Array.isArray(items)) items = [];

  const currentStep = STEPS.findIndex(s => s.key === activeOrder.status);
  const progress = Math.max(0, (currentStep / (STEPS.length - 1)) * 100);

  return (
    <>
      <div className="ot-bar">
        <div className="ot-bar-left">
          <span className="ot-pulse" />
          <span className="ot-bar-text">
            Order #{activeOrder.id} — <strong>{activeOrder.status}</strong>
          </span>
        </div>
        <button className="ot-track-btn" onClick={() => setShowDetails(true)}>Track</button>
      </div>

      {showDetails && (
        <div className="ot-overlay" onClick={() => setShowDetails(false)}>
          <div className="ot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ot-modal-header">
              <h3 className="ot-modal-title">Order #{activeOrder.id}</h3>
              <button className="ot-close-btn" onClick={() => setShowDetails(false)}>&times;</button>
            </div>

            <div className="ot-progress-wrap">
              <div className="ot-progress-track">
                <div className="ot-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="ot-steps">
                {STEPS.map((step, i) => (
                  <div key={step.key} className={`ot-step${i <= currentStep ? ' done' : ''}`}>
                    <div className="ot-dot" />
                    <span className="ot-step-label">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ot-items-box">
              <p className="ot-items-heading">Items</p>
              {items.map((item, i) => (
                <div key={i} className="ot-item-row">
                  <span>{item.qty}x {item.title} ({item.variant})</span>
                  <span>&#8377;{item.price * item.qty}</span>
                </div>
              ))}
              <div className="ot-total-row">
                <span>Total</span>
                <span>&#8377;{activeOrder.total_amount}</span>
              </div>
            </div>

            <a
              href={`https://wa.me/919010900688?text=Help with Order #${activeOrder.id}`}
              target="_blank"
              rel="noreferrer"
              className="ot-help-link"
            >
              Contact Shop / Help
            </a>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(76,175,80,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(76,175,80,0); }
        }

        .ot-bar {
          position: fixed;
          top: 76px;
          left: 50%;
          transform: translateX(-50%);
          width: min(92%, 560px);
          background: #1a1a1a;
          color: white;
          padding: 10px 18px;
          border-radius: 50px;
          z-index: 900;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .ot-bar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ot-pulse {
          width: 9px;
          height: 9px;
          background: #4CAF50;
          border-radius: 50%;
          flex-shrink: 0;
          animation: ot-pulse 2s infinite;
        }

        .ot-bar-text {
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ot-track-btn {
          background: white;
          color: #1a1a1a;
          border: none;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }

        .ot-track-btn:hover { opacity: 0.85; }

        .ot-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .ot-modal {
          background: white;
          width: 100%;
          max-width: 480px;
          border-radius: 18px;
          padding: 28px;
          max-height: 88vh;
          overflow-y: auto;
        }

        .ot-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .ot-modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          color: #1a1a1a;
          margin: 0;
        }

        .ot-close-btn {
          background: none;
          border: none;
          font-size: 1.8rem;
          line-height: 1;
          cursor: pointer;
          color: #999;
          padding: 0;
        }

        .ot-progress-wrap {
          margin-bottom: 32px;
        }

        .ot-progress-track {
          height: 4px;
          background: #eee;
          border-radius: 2px;
          margin-bottom: 14px;
          position: relative;
        }

        .ot-progress-fill {
          position: absolute;
          inset: 0;
          height: 4px;
          background: #4CAF50;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .ot-steps {
          display: flex;
          justify-content: space-between;
        }

        .ot-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 20%;
        }

        .ot-dot {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #ddd;
          margin-bottom: 6px;
          transition: background 0.3s;
        }

        .ot-step.done .ot-dot {
          background: #4CAF50;
          box-shadow: 0 0 0 2px white, 0 0 0 3px #4CAF50;
        }

        .ot-step-label {
          font-size: 0.6rem;
          color: #aaa;
          text-align: center;
          line-height: 1.3;
        }

        .ot-step.done .ot-step-label {
          color: #2F4F4F;
          font-weight: 600;
        }

        .ot-items-box {
          background: #fafafa;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .ot-items-heading {
          font-weight: 700;
          font-size: 0.85rem;
          color: #555;
          margin: 0 0 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ot-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: #444;
          margin-bottom: 6px;
        }

        .ot-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.92rem;
          font-weight: 700;
          color: #1a1a1a;
          border-top: 1px solid #eee;
          padding-top: 10px;
          margin-top: 6px;
        }

        .ot-help-link {
          display: block;
          width: 100%;
          padding: 14px;
          background: #25D366;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.2s;
          box-sizing: border-box;
        }

        .ot-help-link:hover { opacity: 0.88; }

        @media (max-width: 480px) {
          .ot-bar { top: 68px; padding: 9px 14px; }
          .ot-bar-text { font-size: 0.8rem; }
          .ot-step-label { font-size: 0.55rem; }
        }
      `}</style>
    </>
  );
}
