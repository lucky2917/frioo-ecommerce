export const SHOP_LOCATION = {
    lat: 17.721086639920603,
    lng: 83.29694119604164
};

export const MAX_DELIVERY_RANGE_KM = 6;
export const MAX_TAKEAWAY_RANGE_KM = 20;
export const MIN_CART_VALUE = 349;

export const DELIVERY_STATUS_DURATION_MS = 30 * 60 * 1000;

export const DEFAULT_ORDER_TYPE = 'delivery';
export const DEFAULT_PRODUCT_UNIT = 'kg';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const ENDPOINTS = {
    PRODUCTS: '/api/products',
    ORDERS: '/api/orders',
    COUPONS: '/api/coupons/validate'
};
