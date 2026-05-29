import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';
import { API_BASE_URL } from '../config/constants';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('frioo_cart');
            return savedCart ? JSON.parse(savedCart) : {};
        } catch (err) {
            logger.error('Failed to parse saved cart:', err);
            return {};
        }
    });

    const [notification, setNotification] = useState(null);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [availableCoupons, setAvailableCoupons] = useState([]);

    const fetchCoupons = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/coupons/public`, { credentials: 'include' });
            if (!res.ok) return;
            const result = await res.json();
            if (result.data?.coupons) {
                setAvailableCoupons(result.data.coupons);
            }
        } catch (err) {
            logger.error('Error fetching coupons:', err);
        }
    }, []);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    useEffect(() => {
        localStorage.setItem('frioo_cart', JSON.stringify(cart));
    }, [cart]);

    const showToast = (text) => {
        setNotification(text);
        setTimeout(() => setNotification(null), 3000);
    };

    const makeCartKey = (productId, variant, preferences = {}) => {
        const sortedPrefs = {};
        Object.keys(preferences).sort().forEach(key => {
            const val = preferences[key];
            if (Array.isArray(val)) {
                sortedPrefs[key] = [...val].sort();
            } else {
                sortedPrefs[key] = val;
            }
        });
        return `${productId}-${variant}-${JSON.stringify(sortedPrefs)}`;
    };

    const addToCart = (product, variant, finalPrice, preferences = {}) => {
        const cartKey = makeCartKey(product.id, variant, preferences);

        setCart(prev => {
            const existing = prev[cartKey];
            return {
                ...prev,
                [cartKey]: {
                    id: product.id,
                    title: product.title,
                    variant: variant,
                    price: finalPrice,
                    qty: existing ? existing.qty + 1 : 1,
                    image: product.images?.[0],
                    preferences: preferences
                }
            };
        });

        const hasPrefs = Object.keys(preferences).length > 0 &&
            (preferences.exclusions?.length > 0 || preferences.removedIngredients?.length > 0 || preferences.note);

        showToast(`${product.title} ${hasPrefs ? '(Customized)' : ''} added`);
    };

    const removeFromCart = (cartKey) => {
        setCart(prev => {
            if (!prev[cartKey]) return prev;

            const newCart = { ...prev };
            if (newCart[cartKey].qty > 1) {
                newCart[cartKey] = {
                    ...newCart[cartKey],
                    qty: newCart[cartKey].qty - 1
                };
            } else {
                delete newCart[cartKey];
            }
            return newCart;
        });
    };

    const deleteFromCart = (cartKey) => {
        setCart(prev => {
            const newCart = { ...prev };
            delete newCart[cartKey];
            return newCart;
        });
        showToast('Item removed');
    };

    const updateCartItem = (cartKey, newPreferences, newPrice) => {
        setCart(prev => {
            if (!prev[cartKey]) return prev;

            const existing = prev[cartKey];
            const newKey = makeCartKey(existing.id, existing.variant, newPreferences);
            const newCart = { ...prev };

            if (newKey === cartKey) {
                newCart[cartKey] = { ...existing, preferences: newPreferences, price: newPrice ?? existing.price };
                return newCart;
            }

            delete newCart[cartKey];
            newCart[newKey] = {
                ...existing,
                preferences: newPreferences,
                price: newPrice ?? existing.price,
                qty: existing.qty
            };
            return newCart;
        });
    };

    const clearCart = () => {
        setCart({});
        setAppliedCoupon(null);
    };

    const cartTotal = Object.values(cart).reduce((acc, item) => acc + (item.price * item.qty), 0);
    const cartCount = Object.values(cart).reduce((acc, item) => acc + item.qty, 0);

    const verifyCoupon = async (code) => {
        try {
            const currentTotal = Object.values(cart).reduce((acc, item) => acc + item.price * item.qty, 0);
            const url = `${API_BASE_URL}/api/coupons/validate?code=${encodeURIComponent(code.toUpperCase())}&cartTotal=${currentTotal}`;

            const res = await fetch(url, { credentials: 'include' });
            const result = await res.json();

            if (!res.ok) {
                showToast(result.error?.message || 'Invalid coupon');
                return false;
            }

            setAppliedCoupon(result.data?.coupon);
            showToast(`${result.data?.coupon?.code} applied`);
            return true;
        } catch (err) {
            logger.error('Coupon verification failed:', err);
            return false;
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        showToast('Coupon Removed');
    };

    return (
        <CartContext.Provider value={{
            cart,
            cartCount,
            cartTotal,
            addToCart,
            removeFromCart,
            deleteFromCart,
            updateCartItem,
            clearCart,
            notification,
            showToast,
            appliedCoupon,
            verifyCoupon,
            removeCoupon,
            availableCoupons,
            refreshCoupons: fetchCoupons
        }}>
            {children}
        </CartContext.Provider>
    );
};
