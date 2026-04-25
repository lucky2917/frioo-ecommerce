const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { supabaseAdmin } = require('../db');
const { orderValidators } = require('../utils/validators');
const { sendError, sendValidationError, sendSuccess } = require('../utils/responses');

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many orders, please try again later.'
});

router.post('/',
    strictLimiter,
    orderValidators(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors);
        }

        try {
            const {
                user_id,
                profile_id,
                items,
                total_amount,
                order_type,
                delivery_address,
                distance_km,
                coupon_code,
                notes
            } = req.body;

            const isInvalidUser = !user_id || user_id === 'undefined' || user_id === 'null';
            const isInvalidProfile = !profile_id || profile_id === 'undefined' || profile_id === 'null';

            if (isInvalidUser || isInvalidProfile) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Please login to place an order',
                        code: 401,
                        requiresAuth: true
                    }
                });
            }

            const { data: userProfile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('id', user_id)
                .single();

            if (profileError || !userProfile) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Invalid user session. Please login again.',
                        code: 401,
                        requiresAuth: true
                    }
                });
            }

            if (order_type === 'delivery') {
                if (!delivery_address) {
                    return sendError(res, 'Delivery address is required for delivery orders', 400);
                }
                if (!distance_km) {
                    return sendError(res, 'Distance calculation is required for delivery orders', 400);
                }
            }

            const productIds = items.map(item => item.id);
            const { data: products, error: productsError } = await supabaseAdmin
                .from('products')
                .select('id, price_cents')
                .in('id', productIds);

            if (productsError) {
                console.error('Error fetching products for price verification:');
                console.error('Error details:', JSON.stringify(productsError, null, 2));
                console.error('Product IDs attempted:', productIds);
                return sendError(res, `Failed to verify product prices: ${productsError.message || 'Unknown error'}`, 500);
            }

            let serverCalculatedSubtotal = 0;
            for (const item of items) {
                const product = products.find(p => p.id === item.id);

                if (!product) {
                    return sendError(res, `Product ${item.id} not found or unavailable`, 400);
                }

                const itemTotal = (product.price_cents / 100) * item.qty;
                serverCalculatedSubtotal += itemTotal;
            }

            let serverCalculatedDiscount = 0;
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

            }

            const serverCalculatedTotal = serverCalculatedSubtotal - serverCalculatedDiscount;

            const priceDifference = Math.abs(serverCalculatedTotal - total_amount);
            if (priceDifference > 0.5) {
                console.warn('SECURITY ALERT: Price mismatch detected', {
                    user_id,
                    client_total: total_amount,
                    server_total: serverCalculatedTotal,
                    difference: priceDifference,
                    items: items,
                    coupon_code
                });

                return sendError(res,
                    'Price verification failed. Please refresh and try again.',
                    400
                );
            }

            const { data, error } = await supabaseAdmin
                .from('orders')
                .insert([{
                    user_id,
                    items: JSON.stringify(items),
                    total_amount: serverCalculatedTotal,
                    order_type,
                    address: delivery_address,
                    distance: distance_km || 0,
                    coupon_code: coupon_code || null,
                    discount: serverCalculatedDiscount,
                    notes: notes || null,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            return sendSuccess(res, {
                order: data,
                message: 'Order placed successfully'
            }, 201);
        } catch (err) {
            console.error('Order placement error:', err);
            return sendError(res, 'Failed to place order. Please try again.', 500);
        }
    }
);

module.exports = router;
