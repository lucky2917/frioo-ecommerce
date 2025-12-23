// Application Configuration Constants
// All magic numbers extracted to a single source of truth

// ===== SHOP LOCATION =====
export const SHOP_LOCATION = {
    lat: 31.25523,
    lng: 75.69744
};

// ===== DELIVERY SETTINGS =====
export const MAX_DELIVERY_RANGE_KM = 6;
export const MAX_TAKEAWAY_RANGE_KM = 20;
export const MIN_CART_VALUE = 349; // Rupees

// ===== ORDER TRACKING =====
// How long to keep showing "Delivered" status on navbar (30 minutes)
export const DELIVERY_STATUS_DURATION_MS = 30 * 60 * 1000;

// ===== DEFAULTS =====
export const DEFAULT_ORDER_TYPE = 'delivery';
export const DEFAULT_PRODUCT_UNIT = 'kg';

// ===== API ENDPOINTS =====
export const API_BASE_URL = import.meta.env.DEV
    ? 'http://localhost:4000'
    : import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const ENDPOINTS = {
    PRODUCTS: '/api/products',
    ORDERS: '/api/orders',
    COUPONS: '/api/coupons/validate'
};
