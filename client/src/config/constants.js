export const SHOP_LOCATION = {
    lat: 17.721086639920603,
    lng: 83.29694119604164
};

export const MAX_DELIVERY_RANGE_KM = 6;
export const MAX_TAKEAWAY_RANGE_KM = 20;
export const MIN_CART_VALUE = 199;

export const DELIVERY_STATUS_DURATION_MS = 30 * 60 * 1000;

export const DEFAULT_ORDER_TYPE = 'delivery';
export const DEFAULT_PRODUCT_UNIT = 'kg';

export const PRODUCT_CATEGORIES = [
    { slug: 'juices',  label: 'Pure Juices',   dbValue: 'Pure Fruit Juice'  },
    { slug: 'shakes',  label: 'Fruit Shakes',  dbValue: 'Fruit Milkshake'   },
    { slug: 'salads',  label: 'Salads',        dbValue: 'Salad'             },
    { slug: 'fruits',  label: 'Fresh Fruits',  dbValue: 'Fresh Fruit'       },
    { slug: 'deals',   label: 'Daily Deals',   dbValue: null                },
];

if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
    throw new Error('VITE_API_URL is not set. Check your Vercel environment variables.');
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const ENDPOINTS = {
    PRODUCTS: '/api/products',
    ORDERS: '/api/orders'
};
