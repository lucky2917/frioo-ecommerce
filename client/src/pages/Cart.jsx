import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';
import { sanitizeText } from '../utils/sanitize';
import { showToast } from '../utils/toast';
import { API_BASE_URL } from '../config/constants';
import {
  SHOP_LOCATION,
  MAX_DELIVERY_RANGE_KM,
  MAX_TAKEAWAY_RANGE_KM,
  MIN_CART_VALUE
} from '../config/constants';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerText from '../components/animations/StaggerText';
import SEO from '../components/SEO';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

export default function Cart() {
  const { cart, addToCart, removeFromCart, deleteFromCart, clearCart, appliedCoupon, verifyCoupon, removeCoupon, availableCoupons } = useCart();

  const cartItems = Object.entries(cart || {}).map(([key, value]) => ({
    ...value,
    originalKey: key
  }));

  const subTotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const discountAmount = appliedCoupon
    ? (appliedCoupon.discount_type === 'percentage'
      ? (subTotal * appliedCoupon.value / 100)
      : appliedCoupon.value)
    : 0;

  const finalTotal = Math.max(0, subTotal - discountAmount);

  const [couponInput, setCouponInput] = useState('');
  const [orderType, setOrderType] = useState('delivery');
  const [showCouponModal, setShowCouponModal] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editExclusions, setEditExclusions] = useState([]);
  const [editRemovedIngredients, setEditRemovedIngredients] = useState([]);
  const [editNote, setEditNote] = useState('');

  const [isChecking, setIsChecking] = useState(false);
  const [warningModal, setWarningModal] = useState({ show: false, distance: 0, lat: null, lng: null });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/csrf-token`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success && data.data?.csrfToken) {
          setCsrfToken(data.data.csrfToken);
        }
      } catch (err) {
        logger.error('Failed to fetch CSRF token:', err);
      }
    };
    fetchCsrfToken();
  }, []);

  if (authLoading) return <div className="cart-page"><Navbar /><div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div></div>;

  const amountToMin = Math.max(0, MIN_CART_VALUE - finalTotal);
  const isBelowMin = orderType === 'delivery' && finalTotal < MIN_CART_VALUE;

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    verifyCoupon(couponInput, subTotal);
    setCouponInput('');
    setShowCouponModal(false);
  };

  const handleEditClick = async (item) => {
    setEditingItem(item);
    setEditLoading(true);
    setEditExclusions(item.preferences?.exclusions || []);
    setEditRemovedIngredients(item.preferences?.removedIngredients || []);
    setEditNote(item.preferences?.note || '');

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.id)
        .single();

      if (error) throw error;
      setEditProduct(data);
    } catch (err) {
      logger.error('Failed to fetch product for editing:', err);
      showToast('Could not load customization options', 'error');
      setEditingItem(null);
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editProduct) return;

    const newPreferences = {
      exclusions: editExclusions,
      removedIngredients: editRemovedIngredients,
      note: editNote.trim() ? sanitizeText(editNote.trim()) : undefined
    };

    deleteFromCart(editingItem.originalKey);

    for (let i = 0; i < editingItem.qty; i++) {
      addToCart(editProduct, editingItem.variant, editingItem.price, newPreferences);
    }

    setEditingItem(null);
    setEditProduct(null);
    showToast('Customizations updated');
  };

  const toggleEditExclusion = (val) => {
    setEditExclusions(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
  };
  const toggleEditIngredient = (val) => {
    setEditRemovedIngredients(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
  };

  const placeOrderInDB = async (distance = 0, userLat = null, userLng = null) => {
    setIsPlacingOrder(true);
    setWarningModal({ show: false, distance: 0 });

    try {
      const { data: activeOrders, error: checkError } = await supabase
        .from('orders')
        .select('id, status, created_at')
        .eq('user_id', user?.id)
        .not('status', 'in', '("delivered", "cancelled")')
        .order('created_at', { ascending: false })
        .limit(1);

      if (checkError) throw checkError;

      if (activeOrders && activeOrders.length > 0) {
        const activeOrder = activeOrders[0];
        showToast(
          `You already have an active order (#${activeOrder.id}). Please wait for it to be delivered before placing a new order.`,
          'error'
        );
        setIsPlacingOrder(false);
        return;
      }

      const cleanedItems = cartItems.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        qty: item.qty,
        variant: item.variant,
        image: item.image,
        preferences: item.preferences
      }));

      const { data: { session } } = await supabase.auth.getSession();

      const orderPayload = {
        items: cleanedItems,
        total_amount: finalTotal,
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? sanitizeText(profile?.address?.trim() || '') : null,
        distance_km: distance,
        customer_lat: userLat,
        customer_lng: userLng,
        coupon_code: appliedCoupon?.code || null,
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.requiresAuth || response.status === 401) {
          showToast('⚠️ Please login to place an order', 'error');
          return;
        }
        throw new Error(result.error?.message || 'Failed to place order');
      }

      showToast('Order placed successfully! 🚀', 'success');
      clearCart();
      navigate('/orders');

    } catch (error) {
      logger.error('Order Placement Error:', error);
      if (error.response) {
        logger.error('Error response:', error.response);
      }
      const errorMessage = error.message || 'Failed to place order';
      showToast(errorMessage, 'error');
      console.error('Full error details:', error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePreCheckout = async () => {
    if (cartItems.length === 0) return;

    if (!user || !user.id) {
      showToast('⚠️ Please login to place an order', 'error');
      return;
    }

    if (isBelowMin) {
      showToast(`Minimum delivery order is ₹${MIN_CART_VALUE}`, 'error');
      return;
    }

    if (orderType === 'delivery' && !profile?.address?.trim()) {
      showToast('No delivery address found. Please set one in your Profile.', 'error');
      navigate('/profile');
      return;
    }

    if (orderType === 'delivery' || orderType === 'takeaway') {
      setIsChecking(true);
      if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'error');
        setIsChecking(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const dist = calculateDistance(userLat, userLon, SHOP_LOCATION.lat, SHOP_LOCATION.lng);
          setIsChecking(false);

          if (orderType === 'delivery') {
            if (dist > MAX_DELIVERY_RANGE_KM) {
              showToast(`Sorry, we only deliver within ${MAX_DELIVERY_RANGE_KM}km. You are ${dist.toFixed(1)}km away.`, 'error');
              return;
            }
            placeOrderInDB(dist, userLat, userLon);
          } else {
            if (dist > MAX_TAKEAWAY_RANGE_KM) {
              setWarningModal({ show: true, distance: dist, lat: userLat, lng: userLon });
            } else {
              placeOrderInDB(dist, userLat, userLon);
            }
          }
        },
        (error) => {
          logger.error('Location Error:', error);
          showToast('Unable to retrieve your location. Check permissions.', 'error');
          setIsChecking(false);
        }
      );
    }
  };

  return (
    <div className="cart-page">
      <SEO title="Your Cart" description="Review your fresh picks and checkout." />
      <Navbar />
      <div className="cart-container">

        <div className="cart-header-modern">
          <StaggerText text={`Your Bag (${cartItems.length})`} className="cart-title-modern" />
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart-state">
            <h2>Your bag is currently empty.</h2>
            <Link to="/shop" className="start-shopping-btn">Start Shopping</Link>
          </div>
        ) : (
          <div className="cart-layout-split">
            <div className="cart-items-section">
              <div className="cart-table-header">
                <span>Product</span>
                <span>Quantity</span>
                <span className="align-right">Total</span>
              </div>

              {cartItems.map((item, index) => {
                const itemKey = item.originalKey;
                return (
                  <ScrollReveal key={itemKey} delay={0.1 * index} direction="up" className="cart-row-reveal">
                    <div className="cart-row">
                      <div className="cart-row-img-wrapper">
                        <img src={item.image} alt={item.title} className="cart-row-img" />
                      </div>

                      <div className="cart-row-info">
                        <h3 className="row-title">{item.title}</h3>
                        <p className="row-variant">{item.variant}</p>

                        {(item.preferences && (item.preferences.exclusions?.length > 0 || item.preferences.removedIngredients?.length > 0 || item.preferences.note)) && (
                          <div className="row-prefs">
                            {item.preferences.exclusions?.map(e => <span key={e} className="pref-mini red">No {e}</span>)}
                            {item.preferences.removedIngredients?.map(r => <span key={r} className="pref-mini orange">No {r}</span>)}
                            {item.preferences.note && <span className="pref-mini note">Note added</span>}
                          </div>
                        )}

                        <div className="row-actions-group">
                          <button
                            onClick={(e) => { e.preventDefault(); handleEditClick(item); }}
                            className="row-edit-link"
                          >
                            Edit
                          </button>
                          <span className="sep">•</span>
                          <button
                            onClick={(e) => { e.preventDefault(); deleteFromCart(itemKey); }}
                            className="row-remove-link"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="cart-row-qty">
                        <div className="modern-qty-selector">
                          <button onClick={(e) => { e.preventDefault(); removeFromCart(itemKey); }}>−</button>
                          <span>{item.qty}</span>
                          <button onClick={(e) => {
                            e.preventDefault();
                            const productForCart = { id: item.id, title: item.title, images: [item.image] };
                            addToCart(productForCart, item.variant, item.price, item.preferences);
                          }}>+</button>
                        </div>
                      </div>

                      <div className="cart-row-price">
                        <span className="row-total-price">₹{(item.price * item.qty).toFixed(0)}</span>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}

              <Link to="/shop" className="continue-shopping-clean">
                <span className="arrow">←</span> Continue Shopping
              </Link>
            </div>

            <div className="cart-summary-section">
              <div className="order-summary-card">
                <h3 className="os-title">Order Summary</h3>
                <div className="os-toggle">
                  <button className={orderType === 'delivery' ? 'active' : ''} onClick={() => setOrderType('delivery')}>Delivery</button>
                  <button className={orderType === 'takeaway' ? 'active' : ''} onClick={() => setOrderType('takeaway')}>Pickup</button>
                </div>
                {orderType === 'delivery' && (
                  <div className="delivery-address-wrapper">
                    <label className="address-label">Delivering to</label>
                    {profile?.address ? (
                      <div className="address-display">
                        <span className="address-text">{profile.address}</span>
                        <Link to="/profile" className="address-change-link">Change</Link>
                      </div>
                    ) : (
                      <Link to="/profile" className="address-missing-link">Set your delivery address in Profile</Link>
                    )}
                  </div>
                )}

                <div className="os-rows">
                  <div className="os-row"><span>Subtotal</span><span>₹{subTotal.toFixed(2)}</span></div>
                  {appliedCoupon && <div className="os-row discount"><span>Discount ({appliedCoupon.code})</span><span>-₹{discountAmount.toFixed(2)}</span></div>}
                  <div className="os-row grand-total"><span>Total</span><span>₹{finalTotal.toFixed(2)}</span></div>
                </div>

                {!appliedCoupon && (
                  <div className="modern-coupon-input-wrapper">
                    <div className="modern-coupon-input">
                      <input type="text" placeholder="Gift card or discount code" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} />
                      <button onClick={handleApplyCoupon} disabled={!couponInput} className={couponInput ? 'active' : ''}>→</button>
                    </div>
                    {availableCoupons && availableCoupons.length > 0 && (
                      <button onClick={() => setShowCouponModal(true)} className="view-offers-link">View Available Offers</button>
                    )}
                  </div>
                )}
                {appliedCoupon && <button onClick={removeCoupon} className="remove-coupon-link">Remove Coupon</button>}

                <button className={`checkout-btn-modern ${isBelowMin || isChecking || isPlacingOrder ? 'disabled' : ''}`} onClick={handlePreCheckout} disabled={isBelowMin || isChecking || isPlacingOrder}>
                  {isChecking ? 'Checking...' : isPlacingOrder ? 'Processing...' : 'Checkout'}
                </button>
                {isBelowMin && <p className="os-warning">Add ₹{amountToMin.toFixed(0)} more for delivery.</p>}
                <p className="secure-badge">🔒 Secure Checkout</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {warningModal.show && (
        <div className="modal-overlay" onClick={() => setWarningModal({ show: false, distance: 0, lat: null, lng: null })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Confirm Pickup</h3>
            <p>You are <strong>{warningModal.distance.toFixed(1)}km</strong> away. Are you sure you want to pick up?</p>
            <div className="modal-actions">
              <button onClick={() => setWarningModal({ show: false, distance: 0, lat: null, lng: null })} className="cancel-btn">Cancel</button>
              <button onClick={() => placeOrderInDB(warningModal.distance, warningModal.lat, warningModal.lng)} className="confirm-btn">Confirm Order</button>
            </div>
          </div>
        </div>
      )}

      {showCouponModal && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="modal-content coupon-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-header">
              <h3>Available Offers</h3>
              <button onClick={() => setShowCouponModal(false)} className="cm-close">✕</button>
            </div>
            <div className="cm-list">
              {availableCoupons.map(coupon => {
                const needed = coupon.min_order_value - subTotal;
                const isEligible = needed <= 0;
                return (
                  <div key={coupon.id} className={`cm-card ${isEligible ? 'eligible' : ''}`}>
                    <div className="cm-card-left">
                      <div className="cm-code">{coupon.code}</div>
                      <div className="cm-desc">
                        {coupon.discount_type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}<span className="cm-min"> (Min ₹{coupon.min_order_value})</span>
                      </div>
                    </div>
                    {isEligible ? (
                      <button className="cm-apply-btn" onClick={() => { verifyCoupon(coupon.code, subTotal); setShowCouponModal(false); }}>APPLY</button>
                    ) : (
                      <span className="cm-locked">Add ₹{needed.toFixed(0)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-header">
              <h3>Edit {editingItem.title}</h3>
              <button onClick={() => setEditingItem(null)} className="cm-close">✕</button>
            </div>
            <div className="em-body">
              {editLoading ? <p>Loading options...</p> : (
                editProduct ? (
                  <>
                    {editProduct.nutrition?.ingredients?.length > 0 && (
                      <div className="em-section">
                        <label>Customize Ingredients</label>
                        <div className="pd-pill-row">
                          {editProduct.nutrition.ingredients.map(ing => (
                            <button
                              key={ing}
                              className={`pd-pill glass-red ${editRemovedIngredients.includes(ing) ? 'active' : ''}`}
                              onClick={() => toggleEditIngredient(ing)}
                            >
                              {editRemovedIngredients.includes(ing) ? '✕ No ' : ''}{ing}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {editProduct.nutrition?.exclusions?.length > 0 && (
                      <div className="em-section">
                        <label>Allergies & Exclusions</label>
                        <div className="pd-pill-row">
                          {editProduct.nutrition.exclusions.map(ex => (
                            <button
                              key={ex}
                              className={`pd-pill ${editExclusions.includes(ex) ? 'active' : ''}`}
                              onClick={() => toggleEditExclusion(ex)}
                            >
                              {editExclusions.includes(ex) ? '✓ No ' : ''}{ex}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="em-section">
                      <label>Special Instructions</label>
                      <textarea
                        className="em-note-input"
                        placeholder="Add a note... (e.g. Extra spicy)"
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <p>Product details unavailable.</p>
                )
              )}
            </div>
            <div className="em-footer">
              <button onClick={() => setEditingItem(null)} className="cancel-btn">Cancel</button>
              <button onClick={handleSaveEdit} className="confirm-btn">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div className="mobile-bar-modern">
        <div className="mb-info"><span>Total</span><strong>₹{finalTotal.toFixed(0)}</strong></div>
        <button className="mb-btn" onClick={handlePreCheckout} disabled={isBelowMin || isChecking || isPlacingOrder}>Checkout</button>
      </div>

      <style>{`
        .cart-page { background-color: #ffffff; min-height: 100vh; color: #1a1a1a; font-family: 'Manrope', sans-serif; padding-bottom: 80px; }
        .cart-container { max-width: 1200px; margin: 0 auto; padding: 140px 40px 80px; }
        .cart-header-modern { margin-bottom: 60px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .cart-title-modern { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #111; font-weight: 500; }
        .empty-cart-state { text-align: center; padding: 100px 0; }
        .empty-cart-state h2 { font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 30px; color: #333; }
        .start-shopping-btn { background: #111; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-size: 0.9rem; transition: background 0.3s; }
        .start-shopping-btn:hover { background: #333; }
        .cart-layout-split { display: grid; grid-template-columns: 2fr 1fr; gap: 80px; }
        .cart-table-header { display: grid; grid-template-columns: 3fr 1fr 1fr; padding-bottom: 15px; border-bottom: 1px solid #eee; margin-bottom: 30px; color: #888; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .align-right { text-align: right; }
        .cart-row {
          display: grid;
          grid-template-columns: 80px 1fr auto auto;
          gap: 20px;
          align-items: center;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
          transform: translateZ(0);
        }
        .cart-row:hover {
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        .cart-row-img-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .cart-row-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cart-row-info { display: flex; flex-direction: column; gap: 6px; }
        .row-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; margin: 0; color: #111; }
        .row-variant { color: #666; font-size: 0.9rem; margin: 0; }

        .row-actions-group { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
        .sep { color: #ccc; font-size: 0.8rem; }
        .row-remove-link, .row-edit-link { background: none; border: none; padding: 0; color: #999; font-size: 0.8rem; text-decoration: underline; cursor: pointer; transition: color 0.2s; }
        .row-remove-link:hover { color: #d32f2f; }
        .row-edit-link:hover { color: #111; }

        .row-prefs { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 4px; }
        .pref-mini { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: #eee; color: #555; }
        .pref-mini.red { background: #ffebee; color: #c62828; }
        .pref-mini.orange { background: #fff3e0; color: #ef6c00; }
        .modern-qty-selector { display: flex; align-items: center; border: 1px solid #ddd; border-radius: 4px; width: fit-content; }
        .modern-qty-selector button { background: none; border: none; padding: 8px 12px; cursor: pointer; color: #333; transition: background 0.1s; }
        .modern-qty-selector button:hover { background: #f5f5f5; }
        .modern-qty-selector span { padding: 0 10px; font-weight: 600; font-size: 0.95rem; min-width: 20px; text-align: center; }
        .cart-row-price { text-align: right; }
        .row-total-price { font-weight: 600; font-size: 1.1rem; color: #111; }
        .continue-shopping-clean { display: inline-block; margin-top: 40px; color: #111; text-decoration: none; font-weight: 600; font-size: 0.9rem; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
        .continue-shopping-clean:hover { border-bottom-color: #111; }
        .arrow { margin-right: 8px; }
        .cart-summary-section { position: relative; }
        .order-summary-card { background: #ffffff; padding: 40px; border: 1px solid #f0f0f0; border-radius: 4px; position: sticky; top: 100px; }
        .os-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; margin-bottom: 25px; border-bottom: 1px solid #111; padding-bottom: 15px; }
        .os-toggle { display: flex; border: 1px solid #eee; border-radius: 4px; margin-bottom: 30px; overflow: hidden; }
        .os-toggle button { flex: 1; padding: 12px; border: none; background: white; color: #666; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; }
        .os-toggle button.active { background: #f5f5f5; color: #111; }
        .os-rows { margin-bottom: 30px; }
        .os-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 0.95rem; color: #555; }
        .os-row.grand-total { border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; font-size: 1.2rem; color: #111; font-weight: 700; font-family: 'Playfair Display', serif; }
        .os-row.discount { color: #2e7d32; }
        .modern-coupon-input-wrapper { margin-bottom: 20px; }
        .modern-coupon-input { display: flex; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
        .modern-coupon-input input { flex: 1; padding: 12px; border: none; font-family: 'Manrope'; outline: none; font-size: 0.9rem; }
        .modern-coupon-input button { padding: 0 15px; background: #f9f9f9; border: none; color: #ccc; cursor: default; transition: all 0.2s; }
        .modern-coupon-input button.active { background: #111; color: white; cursor: pointer; }
        .view-offers-link { background: none; border: none; padding: 0; color: #15803d; font-size: 0.85rem; font-weight: 600; cursor: pointer; text-decoration: none; display: flex; align-items: center; gap: 5px; }
        .view-offers-link:hover { text-decoration: underline; }
        .remove-coupon-link { background: none; border: none; padding: 0; color: #d32f2f; text-decoration: underline; font-size: 0.85rem; cursor: pointer; display: block; margin-bottom: 20px; }
        .checkout-btn-modern { width: 100%; background: #3E2723; color: white; padding: 18px; border: none; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; cursor: pointer; transition: background 0.3s; margin-bottom: 15px; }
        .checkout-btn-modern:hover:not(.disabled) { background: #2a1a17; }
        .checkout-btn-modern.disabled { background: #ccc; cursor: not-allowed; }
        .os-warning { font-size: 0.8rem; color: #d32f2f; text-align: center; margin-bottom: 10px; }
        .coupons-hint { font-size: 0.8rem; color: #888; margin-bottom: 20px; font-style: italic; }
        .secure-badge { text-align: center; font-size: 0.8rem; color: #999; }
        .delivery-address-wrapper { margin-bottom: 20px; }
        .address-label { display: block; font-size: 0.75rem; font-weight: 700; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.6px; }
        .address-display { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; background: #f9f9f9; border: 1px solid #eee; border-radius: 4px; padding: 10px 12px; }
        .address-text { font-size: 0.9rem; color: #333; line-height: 1.5; flex: 1; }
        .address-change-link { font-size: 0.8rem; font-weight: 600; color: #3E2723; text-decoration: underline; white-space: nowrap; flex-shrink: 0; }
        .address-missing-link { display: block; font-size: 0.85rem; font-weight: 600; color: #c0392b; text-decoration: underline; padding: 8px 0; }
        .mobile-bar-modern { display: none; }
        .coupon-modal { max-width: 450px; width: 90%; padding: 0; overflow: hidden; border-radius: 12px; }
        .cm-header { padding: 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; background: #fff; }
        .cm-header h3 { margin: 0; font-family: 'Playfair Display'; font-size: 1.4rem; }
        .cm-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #888; }
        .cm-list { padding: 20px; max-height: 60vh; overflow-y: auto; background: #fafafa; display: flex; flex-direction: column; gap: 15px; }
        .cm-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .cm-card.eligible { border-left: 4px solid #15803d; border-color: #dcfce7; }
        .cm-code { font-weight: 800; font-size: 1rem; color: #333; letter-spacing: 1px; }
        .cm-desc { font-size: 0.85rem; color: #666; margin-top: 4px; }
        .cm-min { font-size: 0.75rem; color: #999; }
        .cm-apply-btn { background: #111; color: white; border: none; padding: 8px 16px; font-size: 0.75rem; font-weight: 700; cursor: pointer; border-radius: 4px; }
        .cm-locked { font-size: 0.75rem; color: #999; font-weight: 600; background: #eee; padding: 5px 10px; border-radius: 4px; }

        .edit-modal { max-width: 500px; width: 90%; padding: 0; overflow: hidden; border-radius: 12px; }
        .em-body { padding: 20px; max-height: 60vh; overflow-y: auto; }
        .em-section { margin-bottom: 25px; }
        .em-section label { display: block; font-weight: 600; margin-bottom: 10px; color: #333; font-size: 0.95rem; }
        .em-footer { padding: 20px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 10px; background: #f9f9f9; }

        .pd-pill-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .pd-pill { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 50px; font-size: 0.85rem; color: #555; cursor: pointer; transition: all 0.2s; }
        .pd-pill:hover { border-color: #C5A065; }
        .pd-pill.active { border-color: #C5A065; background: #C5A065; color: white; }
        .pd-pill.glass-red:hover { border-color: #e57373; }
        .pd-pill.glass-red.active { border-color: #e57373; background: #e57373; color: white; }

        .em-note-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-family: 'Manrope'; resize: vertical; box-sizing: border-box;}

        .confirm-btn { background: #3E2723; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .cancel-btn { background: #eee; color: #333; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
        .modal-content { background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .modal-actions { margin-top: 25px; display: flex; gap: 15px; justify-content: center; }

        @media (max-width: 968px) {
            .cart-container { padding: 100px 20px 80px; }
            .cart-layout-split { grid-template-columns: 1fr; gap: 40px; }
            .cart-table-header { display: none; }
            .cart-row { grid-template-columns: 80px 1fr; grid-template-rows: auto auto; gap: 15px; align-items: start; display: flex; flex-wrap: wrap; justify-content: space-between; }
            .cart-row-img-wrapper { width: 80px; height: 80px; margin-right: 15px; }
            .cart-row-info { flex: 1; min-width: 150px; }
            .cart-row-qty { margin-top: 15px; width: auto; }
            .cart-row-price { width: 100%; text-align: right; margin-top: -30px; }
            .cart-summary-section { margin-top: 20px; }
            .checkout-btn-modern { display: none; }
            .mobile-bar-modern { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid #eee; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 100; box-shadow: 0 -5px 20px rgba(0,0,0,0.05); }
            .mb-info span { display: block; font-size: 0.8rem; color: #888; }
            .mb-info strong { font-size: 1.2rem; }
            .mb-btn { background: #3E2723; color: white; border: none; padding: 12px 30px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        }
      `}</style>
    </div>
  );
}
