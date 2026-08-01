const { supabaseAdmin } = require('../db');
const logger = require('../utils/logger');

const STORE_TIME_ZONE = 'Asia/Kolkata';
const CACHE_TTL_MS = 15 * 1000;

const DEFAULT_SETTINGS = {
    is_open: true,
    closed_message: null,
    unavailable_categories: [],
    opens_at_hour: 8,
    closes_at_hour: 22,
    delivery_fee_cents: 2900,
    free_delivery_threshold_cents: 31900
};

let cached = null;
let cachedAt = 0;

const getStoreHour = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: STORE_TIME_ZONE,
        hourCycle: 'h23',
        hour: '2-digit',
        minute: '2-digit'
    }).formatToParts(date);

    const read = (type) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    return { hour: read('hour'), minute: read('minute') };
};

const isWithinOpeningHours = (settings, date = new Date()) => {
    const { hour } = getStoreHour(date);
    return hour >= settings.opens_at_hour && hour < settings.closes_at_hour;
};

const getStoreAvailability = (settings, date = new Date()) => {
    const withinHours = isWithinOpeningHours(settings, date);
    const accepting = Boolean(settings.is_open) && withinHours;

    let reason = null;
    if (!settings.is_open) reason = 'closed';
    else if (!withinHours) reason = 'outside-hours';

    return { accepting, withinHours, reason };
};

const isCategoryUnavailable = (settings, category) => {
    if (!category) return false;
    return (settings.unavailable_categories || []).includes(category);
};

const calculateDeliveryFee = (settings, orderType, subtotalAfterDiscount) => {
    if (orderType !== 'delivery') return 0;
    if (subtotalAfterDiscount >= settings.free_delivery_threshold_cents / 100) return 0;
    return settings.delivery_fee_cents / 100;
};

const fetchStoreSettings = async ({ force = false } = {}) => {
    if (!force && cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached;

    const { data, error } = await supabaseAdmin
        .from('store_settings')
        .select('*')
        .eq('id', true)
        .single();

    if (error || !data) {
        logger.error('Failed to load store settings, falling back to defaults', error);
        return cached ?? DEFAULT_SETTINGS;
    }

    cached = data;
    cachedAt = Date.now();
    return data;
};

const invalidateStoreSettings = () => {
    cached = null;
    cachedAt = 0;
};

module.exports = {
    STORE_TIME_ZONE,
    DEFAULT_SETTINGS,
    fetchStoreSettings,
    invalidateStoreSettings,
    getStoreAvailability,
    isWithinOpeningHours,
    isCategoryUnavailable,
    calculateDeliveryFee,
    getStoreHour
};
