import { useState, useRef, useEffect } from 'react';
import { useDialog } from '../hooks/useDialog';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabaseClient';
import { logger } from '../utils/logger';
import { sanitizeText } from '../utils/sanitize';
import { notify } from '../lib/feedbackStore';
import { API_BASE_URL } from '../config/constants';
import {
  SHOP_LOCATION,
  MAX_DELIVERY_RANGE_KM,
  MAX_TAKEAWAY_RANGE_KM,
  MIN_CART_VALUE
} from '../config/constants';
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

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

export default function Cart() {
  const { cart, addToCart, removeFromCart, deleteFromCart, updateCartItem, clearCart, appliedCoupon, verifyCoupon, removeCoupon, availableCoupons } = useCart();

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
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const pendingFocusRef = useRef(null);
  const modalTriggerRef = useRef(null);
  const prevModalOpenRef = useRef(false);
  const couponInputRef = useRef(null);
  const removeCouponRef = useRef(null);
  const continueRef = useRef(null);
  const emptyBtnRef = useRef(null);
  const summaryRef = useRef(null);
  const couponActionRef = useRef(null);

  const anyModalOpen = !!editingItem || showCouponModal || warningModal.show;

  useEffect(() => {
    if (pendingFocusRef.current) {
      const fn = pendingFocusRef.current;
      pendingFocusRef.current = null;
      fn();
    }
  });

  useEffect(() => {
    if (prevModalOpenRef.current && !anyModalOpen) {
      const trigger = modalTriggerRef.current;
      if (trigger && document.contains(trigger)) trigger.focus();
      else summaryRef.current?.focus();
    }
    prevModalOpenRef.current = anyModalOpen;
  }, [anyModalOpen]);

  useEffect(() => {
    if (couponActionRef.current === 'apply' && appliedCoupon) {
      couponActionRef.current = null;
      removeCouponRef.current?.focus();
    } else if (couponActionRef.current === 'remove' && !appliedCoupon) {
      couponActionRef.current = null;
      couponInputRef.current?.focus();
    }
  }, [appliedCoupon]);

  const warningDialogRef = useRef(null);
  const couponDialogRef = useRef(null);
  const editDialogRef = useRef(null);

  useDialog({ open: warningModal.show, onClose: () => setWarningModal({ show: false, distance: 0, lat: null, lng: null }), dialogRef: warningDialogRef });
  useDialog({ open: showCouponModal, onClose: () => setShowCouponModal(false), dialogRef: couponDialogRef });
  useDialog({ open: Boolean(editingItem), onClose: () => setEditingItem(null), dialogRef: editDialogRef });

  const focusAfterListChange = () => {
    pendingFocusRef.current = () => (continueRef.current || emptyBtnRef.current || summaryRef.current)?.focus();
  };
  const handleDelete = (key) => { focusAfterListChange(); deleteFromCart(key); };
  const handleDecrease = (item) => { if (item.qty <= 1) focusAfterListChange(); removeFromCart(item.originalKey); };
  const handleRemoveCoupon = () => { couponActionRef.current = 'remove'; removeCoupon(); };
  const openCouponModal = () => { modalTriggerRef.current = document.activeElement; setShowCouponModal(true); };

  if (authLoading) return (
    <div className="cart-page">
      <Navbar />
      <div className="cart-loading">Loading your bag&hellip;</div>
      <style>{cartBaseStyles}</style>
    </div>
  );

  const amountToMin = Math.max(0, MIN_CART_VALUE - finalTotal);
  const isBelowMin = orderType === 'delivery' && finalTotal < MIN_CART_VALUE;

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    couponActionRef.current = 'apply';
    verifyCoupon(couponInput, subTotal);
    setCouponInput('');
    setShowCouponModal(false);
  };

  const handleEditClick = async (item) => {
    modalTriggerRef.current = document.activeElement;
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
      notify.error('Could not load customization options');
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

    updateCartItem(editingItem.originalKey, newPreferences, editingItem.price);

    setEditingItem(null);
    setEditProduct(null);
    notify.success('Customizations updated');
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
        notify.warning(`You already have an active order (#${activeOrder.id}). Please wait for it to be delivered before placing a new order.`);
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
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.requiresAuth || response.status === 401) {
          notify.error('Please login to place an order');
          return;
        }
        const details = result.error?.details;
        const firstDetail = Array.isArray(details) && details[0];
        const errorMessage = firstDetail?.message || result.error?.message || 'Failed to place order';
        throw new Error(errorMessage);
      }

      notify.success("Order placed. Thank you, we're getting it ready.");
      clearCart();
      navigate('/orders');

    } catch (error) {
      logger.error('Order Placement Error:', error);
      if (error.response) {
        logger.error('Error response:', error.response);
      }
      const errorMessage = error.message || 'Failed to place order';
      notify.error(errorMessage);
      console.error('Full error details:', error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePreCheckout = async () => {
    modalTriggerRef.current = document.activeElement;
    if (cartItems.length === 0) return;

    if (!user || !user.id) {
      notify.error('Please login to place an order');
      return;
    }

    if (isBelowMin) {
      notify.error(`Minimum delivery order is ₹${MIN_CART_VALUE}`);
      return;
    }

    if (orderType === 'delivery') {
      const addr = profile?.address?.trim() || '';
      if (!addr) {
        notify.error('No delivery address found. Please set one in your Profile.');
        navigate('/profile');
        return;
      }
      if (addr.length < 10) {
        notify.error('Your delivery address is too short. Please update it in Profile.');
        navigate('/profile');
        return;
      }
    }

    if (orderType === 'delivery' || orderType === 'takeaway') {
      setIsChecking(true);
      if (!navigator.geolocation) {
        notify.error('Geolocation is not supported by your browser');
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
              notify.error(`Sorry, we only deliver within ${MAX_DELIVERY_RANGE_KM}km. You are ${dist.toFixed(1)}km away.`);
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
          notify.error('Unable to retrieve your location. Check permissions.');
          setIsChecking(false);
        }
      );
    }
  };

  const submitting = isChecking || isPlacingOrder;
  const placeOrderLabel = isChecking ? 'Confirming your location…' : isPlacingOrder ? 'Placing order…' : `Place order · ₹${finalTotal.toFixed(0)}`;
  const placeOrderDisabled = isBelowMin || isChecking || isPlacingOrder;
  const placeOrderStatus = isChecking ? 'Confirming your location' : isPlacingOrder ? 'Placing your order' : '';

  return (
    <div className="cart-page">
      <SEO title="Your Cart" description="Review your fresh picks and place your order." />
      <Navbar />

      <main className="cart-container">
        <header className="cart-head">
          <h1 className="cart-title">Your bag</h1>
          {cartItems.length > 0 && <p className="cart-count">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>}
        </header>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <p className="cart-empty-title">Your bag is empty</p>
            <p className="cart-empty-sub">When you add something fresh, it'll show up here.</p>
            <Link to="/shop" className="cart-empty-btn" ref={emptyBtnRef}>Browse the shop</Link>
          </div>
        ) : (
          <div className="cart-split">
            <section className="cart-review" aria-label="Items in your bag">
              {cartItems.map((item) => {
                const itemKey = item.originalKey;
                const prefs = item.preferences;
                const hasPrefs = prefs && (prefs.exclusions?.length > 0 || prefs.removedIngredients?.length > 0 || prefs.note);
                return (
                  <div className="fr-ci" key={itemKey}>
                    <Link to={`/product/${item.id}`} className="fr-ci-media"><img src={item.image} alt={item.title} /></Link>
                    <div className="fr-ci-main">
                      <div className="fr-ci-top">
                        <Link to={`/product/${item.id}`} className="fr-ci-title">{item.title}</Link>
                        <span className="fr-ci-total">&#8377;{(item.price * item.qty).toFixed(0)}</span>
                      </div>
                      <p className="fr-ci-variant">{item.variant && item.variant !== 'Standard' ? `${item.variant} · ` : ''}&#8377;{item.price.toFixed(0)} each</p>
                      {hasPrefs && (
                        <div className="fr-ci-prefs">
                          {prefs.exclusions?.map(e => <span key={e} className="fr-ci-chip">No {e}</span>)}
                          {prefs.removedIngredients?.map(r => <span key={r} className="fr-ci-chip">No {r}</span>)}
                          {prefs.note && <span className="fr-ci-chip">Note added</span>}
                        </div>
                      )}
                      <div className="fr-ci-controls">
                        <div className="fr-ci-qty">
                          <button onClick={(e) => { e.preventDefault(); handleDecrease(item); }} aria-label="Decrease quantity">&minus;</button>
                          <span aria-live="polite">{item.qty}</span>
                          <button onClick={(e) => {
                            e.preventDefault();
                            const productForCart = { id: item.id, title: item.title, images: [item.image] };
                            addToCart(productForCart, item.variant, item.price, item.preferences);
                          }} aria-label="Increase quantity">+</button>
                        </div>
                        <div className="fr-ci-actions">
                          <button onClick={(e) => { e.preventDefault(); handleEditClick(item); }} className="fr-ci-link">Edit</button>
                          <span className="fr-ci-sep">&middot;</span>
                          <button onClick={(e) => { e.preventDefault(); handleDelete(itemKey); }} className="fr-ci-link fr-ci-remove">Remove</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Link to="/shop" className="cart-continue" ref={continueRef}>&larr; Continue shopping</Link>
            </section>

            <aside className="cart-checkout">
              <div className="cart-summary" ref={summaryRef} tabIndex={-1}>
                <h2 className="cart-summary-title">Order summary</h2>

                <div className="cart-seg" role="group" aria-label="Order type">
                  <button className={orderType === 'delivery' ? 'cart-seg-on' : ''} onClick={() => setOrderType('delivery')} aria-pressed={orderType === 'delivery'}>Delivery</button>
                  <button className={orderType === 'takeaway' ? 'cart-seg-on' : ''} onClick={() => setOrderType('takeaway')} aria-pressed={orderType === 'takeaway'}>Pickup</button>
                </div>

                {orderType === 'delivery' && (
                  <div className="cart-address">
                    <span className="cart-address-label">Delivering to</span>
                    {profile?.address ? (
                      <div className="cart-address-row">
                        <span className="cart-address-text">{profile.address}</span>
                        <Link to="/profile" className="cart-address-link">Change</Link>
                      </div>
                    ) : (
                      <Link to="/profile" className="cart-address-link">Set your delivery address in Profile</Link>
                    )}
                  </div>
                )}

                <div className="cart-rows">
                  <div className="cart-row"><span>Subtotal</span><span>&#8377;{subTotal.toFixed(0)}</span></div>
                  {appliedCoupon && <div className="cart-row cart-row-discount"><span>Discount ({appliedCoupon.code})</span><span>&minus;&#8377;{discountAmount.toFixed(0)}</span></div>}
                  {orderType === 'delivery' && <div className="cart-row"><span>Delivery</span><span className="cart-free">Free</span></div>}
                  <div className="cart-row cart-row-total"><span>Total</span><span>&#8377;{finalTotal.toFixed(0)}</span></div>
                </div>

                {!appliedCoupon ? (
                  <div className="cart-coupon">
                    <div className="cart-coupon-input">
                      <input ref={couponInputRef} type="text" placeholder="Discount code" aria-label="Discount code" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} />
                      <button onClick={handleApplyCoupon} disabled={!couponInput}>Apply</button>
                    </div>
                    {availableCoupons && availableCoupons.length > 0 && (
                      <button onClick={openCouponModal} className="cart-offers-link">View available offers</button>
                    )}
                  </div>
                ) : (
                  <button ref={removeCouponRef} onClick={handleRemoveCoupon} className="cart-offers-link">Remove coupon</button>
                )}

                {isBelowMin && <p className="cart-nudge">Add &#8377;{amountToMin.toFixed(0)} more to place a delivery order.</p>}

                <button className="cart-place fr-only-desktop" onClick={handlePreCheckout} disabled={placeOrderDisabled}>
                  {submitting && <span className="cart-spin" aria-hidden="true" />}{placeOrderLabel}
                </button>

                <div className="cart-sr" aria-live="polite">{placeOrderStatus}</div>

                <p className="cart-next">You'll receive an order confirmation. Live tracking begins once your order is accepted.</p>
              </div>
            </aside>
          </div>
        )}
      </main>

      {cartItems.length > 0 && (
        <div className="cart-mobilebar fr-only-mobile">
          <div className="cart-mobilebar-info"><span>Total</span><strong>&#8377;{finalTotal.toFixed(0)}</strong></div>
          <button className="cart-mobilebar-btn" onClick={handlePreCheckout} disabled={placeOrderDisabled}>{submitting && <span className="cart-spin" aria-hidden="true" />}{placeOrderLabel}</button>
        </div>
      )}

      {warningModal.show && (
        <div className="cart-modal-scrim fr-dialog-scrim" onClick={() => setWarningModal({ show: false, distance: 0, lat: null, lng: null })}>
          <div className="cart-modal fr-dialog-panel" ref={warningDialogRef} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Confirm pickup">
            <div className="cart-modal-head"><h3>Confirm pickup</h3><button autoFocus onClick={() => setWarningModal({ show: false, distance: 0, lat: null, lng: null })} className="cart-modal-close" aria-label="Close"><CloseIcon /></button></div>
            <div className="cart-modal-body"><p>You're <strong>{warningModal.distance.toFixed(1)} km</strong> away. Are you sure you'd like to pick up?</p></div>
            <div className="cart-modal-foot">
              <button onClick={() => setWarningModal({ show: false, distance: 0, lat: null, lng: null })} className="cart-modal-secondary">Cancel</button>
              <button onClick={() => placeOrderInDB(warningModal.distance, warningModal.lat, warningModal.lng)} className="cart-modal-primary">Confirm order</button>
            </div>
          </div>
        </div>
      )}

      {showCouponModal && (
        <div className="cart-modal-scrim fr-dialog-scrim" onClick={() => setShowCouponModal(false)}>
          <div className="cart-modal fr-dialog-panel" ref={couponDialogRef} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Available offers">
            <div className="cart-modal-head"><h3>Available offers</h3><button autoFocus onClick={() => setShowCouponModal(false)} className="cart-modal-close" aria-label="Close"><CloseIcon /></button></div>
            <div className="cart-modal-body cart-offers">
              {availableCoupons.map(coupon => {
                const needed = coupon.min_order_value - subTotal;
                const isEligible = needed <= 0;
                return (
                  <div key={coupon.id} className="cart-offer">
                    <div>
                      <div className="cart-offer-code">{coupon.code}</div>
                      <div className="cart-offer-desc">{coupon.discount_type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}<span> · min ₹{coupon.min_order_value}</span></div>
                    </div>
                    {isEligible
                      ? <button className="cart-offer-apply" onClick={() => { couponActionRef.current = 'apply'; verifyCoupon(coupon.code, subTotal); setShowCouponModal(false); }}>Apply</button>
                      : <span className="cart-offer-locked">Add &#8377;{needed.toFixed(0)}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="cart-modal-scrim fr-dialog-scrim" onClick={() => setEditingItem(null)}>
          <div className="cart-modal fr-dialog-panel" ref={editDialogRef} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Edit ${editingItem.title}`}>
            <div className="cart-modal-head"><h3>Edit {editingItem.title}</h3><button autoFocus onClick={() => setEditingItem(null)} className="cart-modal-close" aria-label="Close"><CloseIcon /></button></div>
            <div className="cart-modal-body">
              {editLoading ? <p className="cart-modal-muted">Loading options&hellip;</p> : editProduct ? (
                <div className="cart-edit">
                  {editProduct.nutrition?.ingredients?.length > 0 && (
                    <div className="cart-edit-group">
                      <span className="cart-edit-label">Customize ingredients</span>
                      <div className="cart-edit-pills">
                        {editProduct.nutrition.ingredients.map(ing => (
                          <button key={ing} className={`cart-pill${editRemovedIngredients.includes(ing) ? ' cart-pill-on' : ''}`} onClick={() => toggleEditIngredient(ing)} aria-pressed={editRemovedIngredients.includes(ing)}>No {ing}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {editProduct.nutrition?.exclusions?.length > 0 && (
                    <div className="cart-edit-group">
                      <span className="cart-edit-label">Allergies &amp; exclusions</span>
                      <div className="cart-edit-pills">
                        {editProduct.nutrition.exclusions.map(ex => (
                          <button key={ex} className={`cart-pill${editExclusions.includes(ex) ? ' cart-pill-on' : ''}`} onClick={() => toggleEditExclusion(ex)} aria-pressed={editExclusions.includes(ex)}>{editExclusions.includes(ex) ? 'No ' : ''}{ex}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="cart-edit-group">
                    <span className="cart-edit-label">Special instructions</span>
                    <textarea className="cart-edit-note" placeholder="Add a note, e.g. extra ripe" value={editNote} onChange={e => setEditNote(e.target.value)} rows={3} />
                  </div>
                </div>
              ) : <p className="cart-modal-muted">Product details unavailable.</p>}
            </div>
            <div className="cart-modal-foot">
              <button onClick={() => setEditingItem(null)} className="cart-modal-secondary">Cancel</button>
              <button onClick={handleSaveEdit} className="cart-modal-primary">Save changes</button>
            </div>
          </div>
        </div>
      )}

      <style>{cartBaseStyles}</style>
    </div>
  );
}

const cartBaseStyles = `
  .cart-page { background: var(--fr-canvas); min-height: 100vh; padding-top: var(--navbar-height-mobile); }
  @media (min-width: 901px) { .cart-page { padding-top: var(--navbar-height-desktop); } }
  .cart-loading { text-align: center; padding: var(--fr-s10); color: var(--fr-text-2); font-family: var(--fr-font-sans); }
  .cart-container { max-width: 1160px; margin: 0 auto; padding: var(--fr-s7) var(--fr-s7) var(--fr-s10); }

  .cart-head { margin-bottom: var(--fr-s6); }
  .cart-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-headline); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0 0 var(--fr-s1); }
  .cart-count { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }

  .cart-empty { text-align: center; padding: var(--fr-s10) var(--fr-s5); display: flex; flex-direction: column; align-items: center; gap: var(--fr-s2); }
  .cart-empty-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0; }
  .cart-empty-sub { color: var(--fr-text-2); margin: 0 0 var(--fr-s4); }
  .cart-empty-btn { display: inline-flex; align-items: center; height: 48px; padding: 0 var(--fr-s6); background: var(--fr-brand); color: var(--fr-on-brand); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); text-decoration: none; }
  .cart-empty-btn:hover { background: var(--fr-brand-press); }
  .cart-empty-btn:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

  .cart-split { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: var(--fr-s8); align-items: start; }

  .cart-review { display: flex; flex-direction: column; }
  .fr-ci { display: flex; gap: var(--fr-s4); padding: var(--fr-s5) 0; border-bottom: 1px solid var(--fr-line); }
  .fr-ci-media { flex-shrink: 0; width: 96px; height: 120px; border-radius: var(--fr-r-card); overflow: hidden; background: var(--fr-surface-2); }
  .fr-ci-media:hover { opacity: 0.88; }
  .fr-ci-media img { width: 100%; height: 100%; object-fit: cover; }
  .fr-ci-media:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
  .fr-ci-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--fr-s2); }
  .fr-ci-top { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fr-s3); }
  .fr-ci-title { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); color: var(--fr-text); text-decoration: none; }
  .fr-ci-title:hover { color: var(--fr-brand); }
  .fr-ci-title:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }
  .fr-ci-total { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-normal); color: var(--fr-text); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .fr-ci-variant { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }
  .fr-ci-prefs { display: flex; flex-wrap: wrap; gap: var(--fr-s2); }
  .fr-ci-chip { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); color: var(--fr-text-2); background: var(--fr-surface-2); border-radius: var(--fr-r-pill); padding: 3px 9px; }
  .fr-ci-controls { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s3); margin-top: var(--fr-s1); }
  .fr-ci-qty { display: inline-flex; align-items: center; border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); overflow: hidden; }
  .fr-ci-qty button { width: 44px; height: 44px; background: var(--fr-surface); border: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-title); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; }
  .fr-ci-qty button:hover { background: var(--fr-surface-2); }
  .fr-ci-qty button:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: -2px; }
  .fr-ci-qty span { min-width: 36px; text-align: center; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); font-variant-numeric: tabular-nums; }
  .fr-ci-actions { display: flex; align-items: center; gap: var(--fr-s2); }
  .fr-ci-link { background: none; border: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text-2); cursor: pointer; padding: var(--fr-s1); }
  .fr-ci-link:hover { color: var(--fr-brand); }
  .fr-ci-remove:hover { color: var(--fr-danger); }
  .fr-ci-link:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }
  .fr-ci-sep { color: var(--fr-line-strong); }
  .cart-continue { display: inline-block; margin-top: var(--fr-s5); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-brand); text-decoration: none; }
  .cart-continue:hover { color: var(--fr-brand-press); }
  .cart-continue:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }

  .cart-checkout { position: sticky; top: calc(var(--navbar-height-desktop) + var(--fr-s5)); }
  .cart-summary { background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-surface); box-shadow: var(--fr-elev-1); padding: var(--fr-s5); }
  .cart-summary-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); letter-spacing: var(--fr-track-headline); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0 0 var(--fr-s4); }
  .cart-seg { display: flex; gap: 4px; background: var(--fr-surface-2); border-radius: var(--fr-r-control); padding: 4px; margin-bottom: var(--fr-s4); }
  .cart-seg button { flex: 1; min-height: 44px; background: none; border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text-2); cursor: pointer; }
  .cart-seg-on { background: var(--fr-surface) !important; color: var(--fr-text) !important; box-shadow: var(--fr-elev-1); }
  .cart-seg button:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: -2px; }
  .cart-address { margin-bottom: var(--fr-s4); display: flex; flex-direction: column; gap: var(--fr-s2); }
  .cart-address-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-eyebrow); text-transform: uppercase; color: var(--fr-text-3); }
  .cart-address-row { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--fr-s3); }
  .cart-address-text { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text); }
  .cart-address-link { font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-brand); text-decoration: none; white-space: nowrap; flex-shrink: 0; }
  .cart-address-link:hover { color: var(--fr-brand-press); }
  .cart-address-link:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }
  .cart-rows { display: flex; flex-direction: column; gap: var(--fr-s3); padding: var(--fr-s4) 0; border-top: 1px solid var(--fr-line); }
  .cart-row { display: flex; align-items: baseline; justify-content: space-between; font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); font-variant-numeric: tabular-nums; }
  .cart-row span:last-child { color: var(--fr-text); font-weight: var(--fr-fw-regular); }
  .cart-row-discount span:last-child { color: var(--fr-brand); }
  .cart-free { color: var(--fr-brand) !important; font-weight: var(--fr-fw-medium) !important; }
  .cart-row-total { padding-top: var(--fr-s3); border-top: 1px solid var(--fr-line); }
  .cart-row-total span { font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text) !important; }
  .cart-coupon { margin: var(--fr-s2) 0 var(--fr-s4); }
  .cart-coupon-input { display: flex; gap: var(--fr-s2); }
  .cart-coupon-input input { flex: 1; min-width: 0; height: 44px; padding: 0 var(--fr-s3); background: var(--fr-surface-2); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-control); color: var(--fr-text); outline: none; }
  .cart-coupon-input input:focus { border-color: var(--fr-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fr-brand) 16%, transparent); background: var(--fr-surface); }
  .cart-coupon-input button { flex-shrink: 0; height: 44px; padding: 0 var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; }
  .cart-coupon-input button:disabled { opacity: 0.4; cursor: not-allowed; }
  .cart-coupon-input button:not(:disabled):hover { border-color: var(--fr-brand); color: var(--fr-brand); }
  .cart-coupon-input button:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
  .cart-offers-link { display: inline-block; margin-top: var(--fr-s2); background: none; border: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-brand); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; padding: var(--fr-s1) 0; }
  .cart-offers-link:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }
  .cart-nudge { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0 0 var(--fr-s3); }
  .cart-place { width: 100%; height: 52px; background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; font-variant-numeric: tabular-nums; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
  .cart-place:hover:not(:disabled) { background: var(--fr-brand-press); }
  .cart-place:disabled { opacity: 0.5; cursor: not-allowed; }
  .cart-place:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
  .cart-next { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); text-align: center; margin: var(--fr-s3) 0 0; }
  .cart-spin { width: 16px; height: 16px; margin-right: var(--fr-s2); border: 2px solid color-mix(in srgb, var(--fr-on-brand) 40%, transparent); border-top-color: var(--fr-on-brand); border-radius: var(--fr-r-pill); display: inline-block; vertical-align: middle; }
  @media (prefers-reduced-motion: no-preference) { .cart-spin { animation: cart-spin 0.7s linear infinite; } }
  @keyframes cart-spin { to { transform: rotate(360deg); } }
  .cart-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

  .cart-mobilebar { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: var(--fr-z-cta); align-items: center; gap: var(--fr-s3); background: var(--fr-surface); border-top: 1px solid var(--fr-line); box-shadow: var(--fr-elev-2); padding: var(--fr-s3) var(--fr-s4); padding-bottom: calc(var(--fr-s3) + env(safe-area-inset-bottom)); }
  .cart-mobilebar-info { display: flex; flex-direction: column; }
  .cart-mobilebar-info span { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); color: var(--fr-text-3); }
  .cart-mobilebar-info strong { font-family: var(--fr-font-sans); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); font-variant-numeric: tabular-nums; }
  .cart-mobilebar-btn { flex: 1; height: 48px; background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; font-variant-numeric: tabular-nums; }
  .cart-mobilebar-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .cart-mobilebar-btn:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

  .cart-modal-scrim { position: fixed; inset: 0; z-index: var(--fr-z-modal); background: var(--fr-scrim); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: var(--fr-s5); }
  .cart-modal { width: 100%; max-width: 440px; max-height: 82vh; display: flex; flex-direction: column; background: var(--fr-surface); border-radius: var(--fr-r-surface); box-shadow: var(--fr-elev-3); overflow: hidden; }
  .cart-modal-head { display: flex; align-items: center; justify-content: space-between; padding: var(--fr-s4) var(--fr-s5); border-bottom: 1px solid var(--fr-line); }
  .cart-modal-head h3 { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0; }
  .cart-modal-close { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: var(--fr-text-2); cursor: pointer; border-radius: var(--fr-r-control); }
  .cart-modal-close:hover { background: var(--fr-surface-2); }
  .cart-modal-close:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
  .cart-modal-body { padding: var(--fr-s5); overflow-y: auto; }
  .cart-modal-body p { margin: 0; color: var(--fr-text-2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); }
  .cart-modal-body p strong { color: var(--fr-text); }
  .cart-modal-muted { color: var(--fr-text-3) !important; }
  .cart-modal-foot { display: flex; gap: var(--fr-s3); padding: var(--fr-s4) var(--fr-s5); border-top: 1px solid var(--fr-line); }
  .cart-modal-secondary { flex: 1; height: 48px; background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; }
  .cart-modal-primary { flex: 1; height: 48px; background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; }
  .cart-modal-primary:hover { background: var(--fr-brand-press); }
  .cart-modal-secondary:focus-visible, .cart-modal-primary:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

  .cart-offers { display: flex; flex-direction: column; gap: var(--fr-s3); }
  .cart-offer { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s3); padding: var(--fr-s4); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); }
  .cart-offer-code { font-family: var(--fr-font-mono); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); letter-spacing: var(--fr-track-eyebrow); color: var(--fr-text); }
  .cart-offer-desc { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); }
  .cart-offer-apply { height: 40px; padding: 0 var(--fr-s4); background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; }
  .cart-offer-apply:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
  .cart-offer-locked { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-3); white-space: nowrap; }

  .cart-edit { display: flex; flex-direction: column; gap: var(--fr-s5); }
  .cart-edit-group { display: flex; flex-direction: column; gap: var(--fr-s3); }
  .cart-edit-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); color: var(--fr-text); }
  .cart-edit-pills { display: flex; flex-wrap: wrap; gap: var(--fr-s2); }
  .cart-pill { min-height: 44px; padding: 0 var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-pill); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; }
  .cart-pill:hover { border-color: var(--fr-brand); color: var(--fr-brand); }
  .cart-pill-on { background: var(--fr-brand); border-color: var(--fr-brand); color: var(--fr-on-brand); }
  .cart-pill:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
  .cart-edit-note { width: 100%; box-sizing: border-box; padding: var(--fr-s3); background: var(--fr-surface-2); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-control); color: var(--fr-text); resize: vertical; outline: none; }
  .cart-edit-note:focus { border-color: var(--fr-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fr-brand) 16%, transparent); background: var(--fr-surface); }

  .fr-only-desktop { display: block; }
  .fr-only-mobile { display: none; }

  @media (max-width: 900px) {
    .cart-container { padding: var(--fr-s5) var(--fr-s4) calc(var(--fr-s9) + 80px); }
    .cart-split { grid-template-columns: 1fr; gap: var(--fr-s6); }
    .cart-checkout { position: static; }
    .cart-place.fr-only-desktop { display: none; }
    .cart-mobilebar { display: flex; }
  }

  @media (prefers-reduced-motion: reduce) { .cart-place, .cart-coupon-input button { transition: none; } }
`;
