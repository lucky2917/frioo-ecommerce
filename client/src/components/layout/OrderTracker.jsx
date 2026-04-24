import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export default function OrderTracker() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const STEPS = ['Received', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];

  const checkOrderValidity = (order) => {
    if (order.status !== 'Delivered') {
      setActiveOrder(order);
    } else {
      const deliveryTime = new Date(order.updated_at || order.created_at).getTime();
      const now = new Date().getTime();
      const diffMins = (now - deliveryTime) / 60000;
      if (diffMins < 30) setActiveOrder(order);
      else setActiveOrder(null);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchActiveOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) checkOrderValidity(data);
    };

    fetchActiveOrder();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
        checkOrderValidity(payload.new);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  if (!activeOrder) return null;

  const currentStepIndex = STEPS.indexOf(activeOrder.status);
  const progressPercent = (currentStepIndex / (STEPS.length - 1)) * 100;

  return (
    <>
      <div style={styles.statusBar}>
        <div style={styles.statusContent}>
          <div style={styles.pulse}></div>
          <span style={styles.statusText}>
            Order #{activeOrder.id}: <strong>{activeOrder.status}</strong>
          </span>
        </div>
        <button onClick={() => setShowDetails(true)} style={styles.viewBtn}>Track</button>
      </div>

      {showDetails && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>Order Tracking #{activeOrder.id}</h3>
              <button onClick={() => setShowDetails(false)} style={styles.closeBtn}>&times;</button>
            </div>

            <div style={styles.progressContainer}>
              <div style={styles.progressBg}></div>
              <div style={{ ...styles.progressBar, width: `${progressPercent}%` }}></div>
              <div style={styles.steps}>
                {STEPS.map((step, i) => (
                  <div key={step} style={i <= currentStepIndex ? styles.stepActive : styles.step}>
                    <div style={i <= currentStepIndex ? styles.dotActive : styles.dot}></div>
                    <span style={styles.stepLabel}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.itemsBox}>
              <h4>Items</h4>
              {Array.isArray(activeOrder.items) && activeOrder.items.map((item, i) => (
                <div key={i} style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.qty}x {item.title} ({item.variant})</span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
              <div style={{ marginTop: '10px', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '5px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total</span>
                <span>₹{activeOrder.total_amount}</span>
              </div>
            </div>

            <button
              onClick={() => window.open(`https://wa.me/919010900688?text=Help with Order #${activeOrder.id}`, '_blank')}
              style={styles.helpBtn}
            >
              💬 Contact Shop / Help
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  statusBar: { position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '600px', background: '#1a1a1a', color: 'white', padding: '10px 20px', borderRadius: '50px', zIndex: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)' },
  statusContent: { display: 'flex', alignItems: 'center', gap: '15px' },
  pulse: { width: '10px', height: '10px', background: '#4CAF50', borderRadius: '50%', boxShadow: '0 0 0 rgba(76, 175, 80, 0.4)', animation: 'pulse 2s infinite' },
  statusText: { fontSize: '0.9rem' },
  viewBtn: { background: 'white', color: 'black', border: 'none', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: 'white', width: '90%', maxWidth: '500px', borderRadius: '16px', padding: '25px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', lineHeight: '1' },
  progressContainer: { position: 'relative', margin: '20px 0 40px 0' },
  progressBg: { position: 'absolute', top: '5px', left: 0, width: '100%', height: '4px', background: '#e0e0e0', zIndex: 1 },
  progressBar: { height: '4px', background: '#4CAF50', position: 'absolute', top: '5px', left: 0, transition: 'width 0.5s ease', zIndex: 2 },
  steps: { display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 3 },
  step: { textAlign: 'center', width: '20%' },
  stepActive: { textAlign: 'center', width: '20%' },
  dot: { width: '14px', height: '14px', background: '#e0e0e0', borderRadius: '50%', margin: '0 auto 5px auto' },
  dotActive: { width: '14px', height: '14px', background: '#4CAF50', borderRadius: '50%', margin: '0 auto 5px auto', border: '2px solid white', boxShadow: '0 0 0 1px #4CAF50' },
  stepLabel: { fontSize: '0.65rem', color: '#888', display: 'block' },
  itemsBox: { background: '#f9f9f9', padding: '15px', borderRadius: '10px', marginBottom: '20px' },
  helpBtn: { width: '100%', padding: '15px', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }
};
