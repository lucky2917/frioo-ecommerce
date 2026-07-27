import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

import SEO from '../components/SEO';

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        logger.error('Failed to fetch orders:', err);
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
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const getStatusColor = (status) => {
    const statusMap = {
      'pending': 'status-orange',
      'confirmed': 'status-blue',
      'preparing': 'status-blue',
      'ready': 'status-blue',
      'out-for-delivery': 'status-purple',
      'delivered': 'status-green',
      'cancelled': 'status-red'
    };
    return statusMap[status] || 'status-blue';
  };

  const handleReorder = (rawItems) => {
    let items = rawItems;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (!Array.isArray(items) || items.length === 0) return;

    items.forEach(item => {
      const product = {
        id: item.id,
        title: item.title,
        images: [item.image]
      };
      addToCart(product, item.variant, item.price, item.preferences);
    });
  };

  if (authLoading) return <LoadingSpinner fullScreen />;

  return (
    <div className="orders-page">
      <SEO title="My Orders" description="Track your order history." />
      <Navbar />

      <div className="orders-container">
        <div className="page-header">
          <h1 className="page-title">Order History</h1>
          <p className="page-subtitle">Track your past purchases and reorder favorites.</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <LoadingSpinner size="medium" />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <h3>No Orders Yet</h3>
            <p>Looks like you haven't placed an order yet.</p>
            <Link to="/shop" className="btn-shop">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card fade-in">

                <div className="card-header">
                  <div className="ch-left">
                    <span className="order-id">Order #{order.id}</span>
                    <span className="order-date">{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="ch-right">
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="order-total">₹{order.total_amount}</span>
                  </div>
                </div>

                <div className="card-body">
                  {(() => {
                    let items = order.items;
                    if (typeof items === 'string') {
                      try { items = JSON.parse(items); } catch (e) { items = []; }
                    }
                    if (!Array.isArray(items)) items = [];

                    return items.map((item, i) => (
                      <div key={i} className="order-item">
                        <div className="item-qty">{item.qty}x</div>
                        <div className="item-details">
                          <span className="item-name">{item.title}</span>
                          {item.variant && <span className="item-variant">Variant: {item.variant}</span>}
                          {item.preferences && (
                            <div className="item-prefs">
                              {item.preferences.exclusions?.length > 0 && (
                                <div className="pref-row">No {item.preferences.exclusions.join(', ')}</div>
                              )}
                              {item.preferences.removedIngredients?.length > 0 && (
                                <div className="pref-row">No {item.preferences.removedIngredients.join(', ')}</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="item-price">₹{item.price * item.qty}</div>
                      </div>
                    ));
                  })()}
                  {order.notes && (
                    <div className="order-note-block">
                      <strong>Note:</strong> {order.notes}
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button className="btn-reorder" onClick={() => handleReorder(order.items)}>
                    Reorder All Items
                  </button>
                  <Link to="/contact" className="link-help">Need Help?</Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .orders-page {
            background-color: #FAFAFA;
            min-height: 100vh;
            padding-bottom: 80px;
        }
        .orders-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 120px 20px 20px;
        }

        .page-header {
            text-align: center;
            margin-bottom: 50px;
        }
        .page-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            color: #3E2723;
            margin-bottom: 10px;
        }
        .page-subtitle {
            font-family: 'Manrope', sans-serif;
            color: #888;
            font-size: 1.1rem;
        }

        .orders-list {
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        .order-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.03);
            border: 1px solid #f0f0f0;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .order-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.06);
        }

        .card-header {
            padding: 20px 25px;
            background: #fffdf9;
            border-bottom: 1px solid #f5f5f5;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .ch-left, .ch-right {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .order-id {
            font-family: 'Manrope', sans-serif;
            font-weight: 700;
            color: #333;
            background: #eee;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.85rem;
            text-transform: uppercase;
        }
        .order-date {
            color: #888;
            font-size: 0.9rem;
        }
        .order-total {
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 1.2rem;
            color: #3E2723;
        }

        .status-badge {
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-green { background: #e8f5e9; color: #2e7d32; }
        .status-blue { background: #e3f2fd; color: #1565c0; }
        .status-orange { background: #fff3e0; color: #ef6c00; }
        .status-red { background: #ffebee; color: #c62828; }
        .status-purple { background: #f3e8ff; color: #7e22ce; }

        .card-body {
            padding: 20px 25px;
      }
        .order-item {
            display: flex;
            align-items: flex-start;
            padding: 15px 0;
            border-bottom: 1px solid #f9f9f9;
        }
        .order-item:last-child { border-bottom: none; }

        .item-qty {
            font-weight: 700;
            color: #D4AF7A;
            width: 40px;
        }
        .item-details { flex: 1; }
        .item-name {
            display: block;
            font-weight: 600;
            color: #333;
            margin-bottom: 2px;
        }
        .item-variant {
            display: block;
            font-size: 0.85rem;
            color: #888;
        }
        .item-price {
            font-weight: 600;
            color: #555;
        }

        .item-prefs { margin-top: 4px; font-size: 0.8rem; }
        .pref-row { color: #d32f2f; font-weight: 500; }

        .order-note-block {
            background: #fffbeb; padding: 10px; border-radius: 8px;
            margin-top: 15px; border: 1px solid #fcd34d;
            color: #b45309; font-size: 0.9rem;
        }

        .card-footer {
            padding: 15px 25px;
            background: white;
            border-top: 1px solid #fbfbfb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .btn-reorder {
            background: white;
            border: 1px solid #D4AF7A;
            color: #D4AF7A;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
        }
        .btn-reorder:hover {
            background: #D4AF7A;
            color: white;
        }
        .link-help {
            color: #999;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .link-help:hover { color: #555; }

        .empty-state {
            text-align: center;
            padding: 80px 20px;
        }
        .empty-icon { margin-bottom: 20px; display: flex; justify-content: center; color: #bbb; }
        .empty-state h3 { font-family: 'Playfair Display'; margin-bottom: 10px; }
        .empty-state p { margin-bottom: 30px; color: #888; }
        .btn-shop {
            background: #3E2723;
            color: white;
            padding: 12px 30px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: 600;
        }

        .loading-state {
            display: flex;
            justify-content: center;
            padding: 50px;
        }

        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 600px) {
            .card-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }
            .ch-left, .ch-right {
                width: 100%;
                justify-content: space-between;
            }
        }
      `}</style>
    </div>
  );
}
