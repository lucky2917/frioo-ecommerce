const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../utils/responses');
const logger = require('../utils/logger');

router.post('/validate',
    [
        body('code').isString().trim().isLength({ min: 3, max: 20 }),
        body('cartTotal').isFloat({ min: 0 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendValidationError(res, errors);

        try {
            const { code, cartTotal } = req.body;
            const { data, error } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('is_active', true)
                .single();

            if (error || !data) return sendNotFound(res, 'Coupon');

            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                return sendError(res, 'Coupon has expired', 400);
            }

            if (cartTotal < data.min_order_value) {
                return sendError(
                    res,
                    `Add items worth ₹${data.min_order_value - cartTotal} more to apply this coupon!`,
                    400,
                    { minOrderValue: data.min_order_value, required: data.min_order_value - cartTotal }
                );
            }

            return sendSuccess(res, { valid: true, coupon: data });
        } catch (err) {
            logger.error('Coupon validation error:', err);
            return sendError(res, 'Failed to validate coupon', 500);
        }
    }
);

router.use(requireAdmin);

router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return sendSuccess(res, { coupons: data });
    } catch (err) {
        logger.error('Error fetching coupons:', err);
        return sendError(res, 'Failed to fetch coupons', 500);
    }
});

router.post('/',
    [
        body('code').isString().trim().isLength({ min: 3, max: 20 }),
        body('discount_type').isIn(['percentage', 'fixed']),
        body('value').isFloat({ min: 0 }),
        body('min_order_value').isFloat({ min: 0 }),
        body('expires_at').optional().isISO8601()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendValidationError(res, errors);

        try {
            const { code, discount_type, value, min_order_value, expires_at, description } = req.body;

            const { data, error } = await supabaseAdmin
                .from('coupons')
                .insert([{ code: code.toUpperCase(), discount_type, value, min_order_value, expires_at, description, is_active: true }])
                .select()
                .single();

            if (error) throw error;
            return sendSuccess(res, { coupon: data }, 201);
        } catch (err) {
            logger.error('Error creating coupon:', err);
            if (err.code === '23505') return sendError(res, 'Coupon code already exists', 409);
            return sendError(res, 'Failed to create coupon', 500);
        }
    }
);

router.patch('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const { data, error } = await supabaseAdmin
            .from('coupons')
            .update({ is_active })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return sendSuccess(res, { coupon: data });
    } catch (err) {
        logger.error('Error updating coupon:', err);
        return sendError(res, 'Failed to update coupon', 500);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
        if (error) throw error;
        return sendSuccess(res, { message: 'Coupon deleted successfully' });
    } catch (err) {
        logger.error('Error deleting coupon:', err);
        return sendError(res, 'Failed to delete coupon', 500);
    }
});

module.exports = router;
