import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { logger } from '../utils/logger';
import { API_BASE_URL } from '../config/constants';
import { fetchWithTimeout } from '../lib/http';
import { notify } from '../lib/feedbackStore';

const CartContext = createContext();

const CART_STORAGE_KEY = 'frioo_cart';

export const useCart = () => useContext(CartContext);

const isUsableCartEntry = (entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const price = Number(entry.price);
    const qty = Number(entry.qty);
    return (
        entry.id !== undefined &&
        typeof entry.title === 'string' &&
        Number.isFinite(price) && price >= 0 &&
        Number.isFinite(qty) && qty > 0
    );
};

const readStoredCart = () => {
    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (!saved) return {};

        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

        return Object.entries(parsed).reduce((acc, [key, entry]) => {
            if (!isUsableCartEntry(entry)) return acc;
            acc[key] = {
                ...entry,
                price: Number(entry.price),
                qty: Math.floor(Number(entry.qty)),
                preferences: entry.preferences && typeof entry.preferences === 'object' ? entry.preferences : {}
            };
            return acc;
        }, {});
    } catch (err) {
        logger.error('Failed to read saved cart:', err);
        return {};
    }
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(readStoredCart);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [availableCoupons, setAvailableCoupons] = useState([]);

    const storageWarnedRef = useRef(false);
    const couponsAbortRef = useRef(null);

    const fetchCoupons = useCallback(async () => {
        couponsAbortRef.current?.abort();
        const controller = new AbortController();
        couponsAbortRef.current = controller;

        try {
            const res = await fetchWithTimeout(`${API_BASE_URL}/api/coupons/public`, {
                credentials: 'include',
                signal: controller.signal
            });
            if (!res.ok) return;

            const result = await res.json();
            if (controller.signal.aborted) return;
            if (result.data?.coupons) setAvailableCoupons(result.data.coupons);
        } catch (err) {
            if (err?.name === 'AbortError') return;
            logger.error('Error fetching coupons:', err);
        }
    }, []);

    useEffect(() => {
        const abortRef = couponsAbortRef;
        void (async () => { await fetchCoupons(); })();
        return () => abortRef.current?.abort();
    }, [fetchCoupons]);

    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (err) {
            if (!storageWarnedRef.current) {
                storageWarnedRef.current = true;
                logger.error('Could not save cart to storage:', err);
                notify.warning('Your bag will not be saved after you close this tab. Your device storage is full or blocked.');
            }
        }
    }, [cart]);

    const makeCartKey = useCallback((productId, variant, preferences = {}) => {
        const sortedPrefs = {};
        Object.keys(preferences).sort().forEach((key) => {
            const val = preferences[key];
            sortedPrefs[key] = Array.isArray(val) ? [...val].sort() : val;
        });
        return `${productId}-${variant}-${JSON.stringify(sortedPrefs)}`;
    }, []);

    const addToCart = useCallback((product, variant, finalPrice, preferences = {}) => {
        const price = Number(finalPrice);
        if (!product?.id || !Number.isFinite(price)) {
            logger.error('Rejected invalid add to cart', { product, finalPrice });
            return;
        }

        const cartKey = makeCartKey(product.id, variant, preferences);

        setCart((prev) => {
            const existing = prev[cartKey];
            return {
                ...prev,
                [cartKey]: {
                    id: product.id,
                    title: product.title,
                    variant,
                    price,
                    qty: existing ? existing.qty + 1 : 1,
                    image: product.images?.[0],
                    preferences
                }
            };
        });
    }, [makeCartKey]);

    const removeFromCart = useCallback((cartKey) => {
        setCart((prev) => {
            const existing = prev[cartKey];
            if (!existing || existing.qty <= 1) return prev;
            return { ...prev, [cartKey]: { ...existing, qty: existing.qty - 1 } };
        });
    }, []);

    const deleteFromCart = useCallback((cartKey) => {
        setCart((prev) => {
            if (!prev[cartKey]) return prev;
            const newCart = { ...prev };
            delete newCart[cartKey];
            return newCart;
        });
    }, []);

    const updateCartItem = useCallback((cartKey, newPreferences, newPrice) => {
        setCart((prev) => {
            const existing = prev[cartKey];
            if (!existing) return prev;

            const resolvedPrice = Number.isFinite(Number(newPrice)) ? Number(newPrice) : existing.price;
            const newKey = makeCartKey(existing.id, existing.variant, newPreferences);
            const newCart = { ...prev };

            if (newKey === cartKey) {
                newCart[cartKey] = { ...existing, preferences: newPreferences, price: resolvedPrice };
                return newCart;
            }

            delete newCart[cartKey];
            const merged = newCart[newKey];
            newCart[newKey] = {
                ...existing,
                preferences: newPreferences,
                price: resolvedPrice,
                qty: merged ? merged.qty + existing.qty : existing.qty
            };
            return newCart;
        });
    }, [makeCartKey]);

    const clearCart = useCallback(() => {
        setCart({});
        setAppliedCoupon(null);
    }, []);

    const { cartTotal, cartCount } = useMemo(() => {
        const entries = Object.values(cart);
        return {
            cartTotal: entries.reduce((acc, item) => acc + item.price * item.qty, 0),
            cartCount: entries.reduce((acc, item) => acc + item.qty, 0)
        };
    }, [cart]);

    const verifyCoupon = useCallback(async (code) => {
        try {
            const url = `${API_BASE_URL}/api/coupons/validate?code=${encodeURIComponent(code.toUpperCase())}&cartTotal=${cartTotal}`;
            const res = await fetchWithTimeout(url, { credentials: 'include' });
            const result = await res.json();

            if (!res.ok) {
                return { ok: false, error: result.error?.message || 'That code is not valid. Check it and try again.' };
            }

            setAppliedCoupon(result.data?.coupon);
            return { ok: true, code: result.data?.coupon?.code };
        } catch (err) {
            logger.error('Coupon verification failed:', err);
            return { ok: false, error: 'We could not check that code. Check your connection and try again.' };
        }
    }, [cartTotal]);

    const removeCoupon = useCallback(() => {
        setAppliedCoupon(null);
        notify.info('Coupon removed');
    }, []);

    const value = useMemo(() => ({
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        deleteFromCart,
        updateCartItem,
        clearCart,
        appliedCoupon,
        verifyCoupon,
        removeCoupon,
        availableCoupons,
        refreshCoupons: fetchCoupons
    }), [
        cart, cartCount, cartTotal, addToCart, removeFromCart, deleteFromCart,
        updateCartItem, clearCart, appliedCoupon, verifyCoupon, removeCoupon,
        availableCoupons, fetchCoupons
    ]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
