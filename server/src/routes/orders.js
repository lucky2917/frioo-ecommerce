const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { supabaseAdmin } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { orderValidators } = require('../utils/validators');
const { sendError, sendValidationError, sendSuccess } = require('../utils/responses');
const logger = require('../utils/logger');

const SHOP_LAT = 17.721086639920603;
const SHOP_LNG = 83.29694119604164;
const MAX_DELIVERY_KM = 6;
const MIN_DELIVERY_ORDER_VALUE = 349;

const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const sanitizeAddress = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    return raw.replace(/<[^>]*>/g, '').replace(/['"`;]/g, '').trim().substring(0, 500) || null;
};

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many orders, please try again later.'
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place an order
 *     description: |
 *       Creates a new order for the authenticated user.
 *
 *       **Authentication:** Supabase JWT required in `Authorization: Bearer <token>` header.
 *
 *       **CSRF protection:** A valid `X-CSRF-Token` header is required for this endpoint.
 *       Obtain the token first by calling `GET /api/csrf-token`.
 *
 *       **Server-side validations performed:**
 *       - Product prices re-fetched from DB; client total must match within ₹0.01
 *       - Delivery distance re-calculated server-side using Haversine formula; max 6 km
 *       - Stock verified at time of insert; concurrent low-stock orders are rejected (409)
 *       - Coupon validity, expiry, usage limit, and per-user reuse enforced
 *
 *       **Rate limit:** 10 requests per 15 minutes per IP.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-CSRF-Token
 *         required: true
 *         schema:
 *           type: string
 *         description: CSRF token obtained from `GET /api/csrf-token`. Required for all mutating API calls.
 *         example: a3f8d2c1e9b74a6f85230d1c7e4a9f2b3c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderBody'
 *           examples:
 *             delivery:
 *               summary: Delivery order with coupon
 *               value:
 *                 items:
 *                   - id: prod_001
 *                     title: Organic Cherry Tomatoes
 *                     price: 149.0
 *                     qty: 2
 *                     variant: 500g
 *                     image: https://storage.example.com/tomato.jpg
 *                 total_amount: 268.2
 *                 order_type: delivery
 *                 delivery_address: Flat 4B, Gajuwaka, Visakhapatnam 530026
 *                 distance_km: 2.5
 *                 customer_lat: 17.6868
 *                 customer_lng: 83.2185
 *                 coupon_code: FRESH10
 *             takeaway:
 *               summary: Takeaway order without coupon
 *               value:
 *                 items:
 *                   - id: prod_002
 *                     title: Fresh Mango Juice
 *                     price: 89.0
 *                     qty: 3
 *                     variant: 1L
 *                 total_amount: 267.0
 *                 order_type: takeaway
 *                 distance_km: 1.2
 *                 customer_lat: 17.7211
 *                 customer_lng: 83.2969
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         order:
 *                           $ref: '#/components/schemas/Order'
 *                         message:
 *                           type: string
 *                           example: Order placed successfully
 *       400:
 *         description: |
 *           Validation failure or business rule violation. Common causes:
 *           - Price mismatch between client and server calculation
 *           - Customer outside delivery range
 *           - Insufficient stock
 *           - Invalid/expired coupon
 *           - Missing delivery address for delivery orders
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Invalid or missing CSRF token
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Stock went out while placing the order — order auto-cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               data: null
 *               error:
 *                 message: One or more items went out of stock. Please refresh and try again.
 *                 code: 409
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/',
    strictLimiter,
    requireAuth,
    orderValidators(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors);
        }

        try {
            const {
                items,
                total_amount,
                order_type,
                delivery_address,
                distance_km,
                customer_lat,
                customer_lng,
                coupon_code
            } = req.body;

            const user_id = req.user.id;

            if (order_type === 'delivery') {
                if (!delivery_address) {
                    return sendError(res, 'Delivery address is required for delivery orders', 400);
                }
                if (customer_lat == null || customer_lng == null) {
                    return sendError(res, 'Location verification is required for delivery orders', 400);
                }
                const serverDistance = haversineKm(customer_lat, customer_lng, SHOP_LAT, SHOP_LNG);
                if (serverDistance > MAX_DELIVERY_KM) {
                    return sendError(res, `We only deliver within ${MAX_DELIVERY_KM}km. Your location is ${serverDistance.toFixed(1)}km away.`, 400);
                }
            }

            const productIds = items.map(item => item.id);
            const { data: products, error: productsError } = await supabaseAdmin
                .from('products')
                .select('id, price_cents, stock')
                .in('id', productIds);

            if (productsError) {
                logger.error('Failed to verify product prices:', productsError);
                return sendError(res, 'Failed to verify product prices', 500);
            }

            let serverCalculatedSubtotal = 0;
            for (const item of items) {
                const product = products.find(p => p.id === item.id);
                if (!product) {
                    return sendError(res, `Product ${item.id} not found or unavailable`, 400);
                }
                if (product.stock !== null && product.stock < item.qty) {
                    return sendError(res, `"${item.title}" only has ${product.stock} in stock`, 400);
                }
                serverCalculatedSubtotal += (product.price_cents / 100) * item.qty;
            }

            let serverCalculatedDiscount = 0;
            let appliedCoupon = null;

            if (coupon_code) {
                const { data: coupon, error: couponError } = await supabaseAdmin
                    .from('coupons')
                    .select('*')
                    .eq('code', coupon_code)
                    .eq('is_active', true)
                    .single();

                if (couponError || !coupon) {
                    return sendError(res, 'Invalid or expired coupon code', 400);
                }

                if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
                    return sendError(res, 'This coupon has expired', 400);
                }

                if (coupon.usage_limit !== null && coupon.usage_limit !== undefined &&
                    (coupon.used_count || 0) >= coupon.usage_limit) {
                    return sendError(res, 'This coupon has reached its usage limit', 400);
                }

                const { count: userUseCount, error: useCountError } = await supabaseAdmin
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user_id)
                    .eq('coupon_code', coupon_code);

                if (!useCountError && userUseCount > 0) {
                    return sendError(res, 'You have already used this coupon', 400);
                }

                if (serverCalculatedSubtotal < coupon.min_order_value) {
                    return sendError(res,
                        `Minimum order value of ₹${coupon.min_order_value} required for this coupon`,
                        400
                    );
                }

                if (coupon.discount_type === 'percentage') {
                    serverCalculatedDiscount = (serverCalculatedSubtotal * coupon.value) / 100;
                } else {
                    serverCalculatedDiscount = coupon.value;
                }

                appliedCoupon = coupon;
            }

            const serverCalculatedTotal = serverCalculatedSubtotal - serverCalculatedDiscount;
            const priceDifference = Math.abs(serverCalculatedTotal - total_amount);

            if (priceDifference > 0.01) {
                return sendError(res, 'Price verification failed. Please refresh and try again.', 400);
            }

            if (order_type === 'delivery' && serverCalculatedTotal < MIN_DELIVERY_ORDER_VALUE) {
                return sendError(res, `Minimum delivery order is ₹${MIN_DELIVERY_ORDER_VALUE}`, 400);
            }

            const safeAddress = sanitizeAddress(delivery_address);

            const { data, error } = await supabaseAdmin
                .from('orders')
                .insert([{
                    user_id,
                    items: JSON.stringify(items),
                    total_amount: serverCalculatedTotal,
                    order_type,
                    address: safeAddress,
                    distance: distance_km || 0,
                    customer_lat: customer_lat || null,
                    customer_lng: customer_lng || null,
                    coupon_code: coupon_code || null,
                    discount: serverCalculatedDiscount,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            const stockUpdateResults = await Promise.all(items.map(async ({ id, qty }) => {
                const { data: decremented, error: stockErr } = await supabaseAdmin
                    .rpc('decrement_product_stock', { p_id: id, p_qty: qty });
                if (stockErr || decremented !== true) {
                    logger.error(`Stock update failed for product ${id} on order ${data.id}`);
                    return false;
                }
                return true;
            }));

            const stockFailed = stockUpdateResults.some(r => r === false);
            if (stockFailed) {
                await supabaseAdmin
                    .from('orders')
                    .update({ status: 'cancelled' })
                    .eq('id', data.id);
                logger.error(`Order ${data.id} cancelled due to stock update failure`);
                return sendError(res, 'One or more items went out of stock. Please refresh and try again.', 409);
            }

            if (appliedCoupon) {
                if (appliedCoupon.usage_limit === null || appliedCoupon.usage_limit === undefined) {
                    await supabaseAdmin
                        .from('coupons')
                        .update({ used_count: (appliedCoupon.used_count || 0) + 1 })
                        .eq('id', appliedCoupon.id);
                } else {
                    const { data: updated } = await supabaseAdmin
                        .from('coupons')
                        .update({ used_count: (appliedCoupon.used_count || 0) + 1 })
                        .eq('id', appliedCoupon.id)
                        .eq('used_count', appliedCoupon.used_count || 0)
                        .select('id');

                    if (!updated || updated.length === 0) {
                        logger.warn(`Coupon ${appliedCoupon.id} usage count changed during order placement for order ${data.id}`);
                    }
                }
            }

            return sendSuccess(res, { order: data, message: 'Order placed successfully' }, 201);
        } catch (err) {
            logger.error('Order placement error:', err);
            return sendError(res, 'Failed to place order. Please try again.', 500);
        }
    }
);

module.exports = router;
