const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../utils/responses');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/coupons/public:
 *   get:
 *     summary: List active public coupons
 *     description: |
 *       Returns active, non-expired coupons with only the fields needed for the storefront UI.
 *       Sensitive fields (usage_limit, used_count, created_at) are excluded.
 *       No authentication required.
 *     tags: [Coupons]
 *     responses:
 *       200:
 *         description: Active public coupons
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
 *                         coupons:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/PublicCoupon'
 *             example:
 *               success: true
 *               data:
 *                 coupons:
 *                   - id: cpn_001
 *                     code: FRESH10
 *                     discount_type: percentage
 *                     value: 10
 *                     min_order_value: 200
 *               error: null
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/public', async (_req, res) => {
    try {
        const now = new Date().toISOString();
        const { data, error } = await supabaseAdmin
            .from('coupons')
            .select('id, code, discount_type, value, min_order_value')
            .eq('is_active', true)
            .or(`expires_at.is.null,expires_at.gt.${now}`)
            .order('min_order_value', { ascending: true });

        if (error) throw error;
        return sendSuccess(res, { coupons: data });
    } catch (err) {
        logger.error('Error fetching public coupons:', err);
        return sendError(res, 'Failed to fetch coupons', 500);
    }
});

/**
 * @swagger
 * /api/coupons/validate:
 *   get:
 *     summary: Validate a coupon code
 *     description: |
 *       Checks whether a coupon code is valid for the given cart total.
 *       Verifies: active status, expiry, global usage limit, and minimum order value.
 *       Does **not** check per-user reuse (that check happens at order placement).
 *       No authentication required.
 *     tags: [Coupons]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 20
 *         description: Coupon code (case-insensitive; auto-uppercased server-side)
 *         example: FRESH10
 *       - in: query
 *         name: cartTotal
 *         required: true
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Current cart subtotal in INR
 *         example: 298.0
 *     responses:
 *       200:
 *         description: Coupon is valid for this cart
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
 *                         valid:
 *                           type: boolean
 *                           example: true
 *                         coupon:
 *                           $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Coupon is expired, exhausted, or cart total below minimum
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Coupon code not found or inactive
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/validate',
    [
        query('code').isString().trim().isLength({ min: 3, max: 20 }),
        query('cartTotal').isFloat({ min: 0 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors);
        }

        try {
            const { code, cartTotal } = req.query;
            const { data, error } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('is_active', true)
                .single();

            if (error || !data) {
                return sendNotFound(res, 'Coupon');
            }

            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                return sendError(res, 'Coupon has expired', 400);
            }

            if (data.usage_limit !== null && data.usage_limit !== undefined &&
                (data.used_count || 0) >= data.usage_limit) {
                return sendError(res, 'This coupon has reached its usage limit', 400);
            }

            const total = parseFloat(cartTotal);
            if (total < data.min_order_value) {
                return sendError(
                    res,
                    `Add items worth ₹${data.min_order_value - total} more to apply this coupon!`,
                    400,
                    {
                        minOrderValue: data.min_order_value,
                        required: data.min_order_value - total
                    }
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

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: List all coupons
 *     description: Returns all coupons including inactive and expired ones. Admin only.
 *     tags: [Admin — Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All coupons
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
 *                         coupons:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Coupon'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', async (_req, res) => {
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

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create a coupon
 *     description: Creates a new coupon. Code is automatically uppercased. Admin only.
 *     tags: [Admin — Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCouponBody'
 *           examples:
 *             percentage:
 *               summary: 10% discount coupon
 *               value:
 *                 code: FRESH10
 *                 discount_type: percentage
 *                 value: 10
 *                 min_order_value: 200
 *                 expires_at: '2025-12-31T23:59:59.000Z'
 *                 description: 10% off on orders above ₹200
 *             fixed:
 *               summary: Fixed ₹50 discount
 *               value:
 *                 code: FLAT50
 *                 discount_type: fixed
 *                 value: 50
 *                 min_order_value: 400
 *     responses:
 *       201:
 *         description: Coupon created
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
 *                         coupon:
 *                           $ref: '#/components/schemas/Coupon'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
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
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors);
        }

        try {
            const { code, discount_type, value, min_order_value, expires_at, description } = req.body;

            const { data, error } = await supabaseAdmin
                .from('coupons')
                .insert([{
                    code: code.toUpperCase(),
                    discount_type,
                    value,
                    min_order_value,
                    expires_at,
                    description,
                    is_active: true
                }])
                .select()
                .single();

            if (error) throw error;
            return sendSuccess(res, { coupon: data }, 201);
        } catch (err) {
            logger.error('Error creating coupon:', err);
            if (err.code === '23505') {
                return sendError(res, 'Coupon code already exists', 409);
            }
            return sendError(res, 'Failed to create coupon', 500);
        }
    }
);

/**
 * @swagger
 * /api/coupons/{id}/toggle:
 *   patch:
 *     summary: Toggle coupon active status
 *     description: Activates or deactivates a coupon by its ID. Admin only.
 *     tags: [Admin — Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Coupon UUID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_active]
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Coupon status updated
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
 *                         coupon:
 *                           $ref: '#/components/schemas/Coupon'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/:id/toggle',
    [
        param('id').isUUID().withMessage('Invalid coupon ID'),
        body('is_active').isBoolean().withMessage('is_active must be a boolean')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendValidationError(res, errors);

        try {
            const { id } = req.params;
            const is_active = req.body.is_active === true || req.body.is_active === 'true';

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
    }
);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: Delete a coupon
 *     description: Permanently deletes a coupon by ID. Admin only.
 *     tags: [Admin — Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Coupon UUID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Coupon deleted
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
 *                         message:
 *                           type: string
 *                           example: Coupon deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return sendSuccess(res, { message: 'Coupon deleted successfully' });
    } catch (err) {
        logger.error('Error deleting coupon:', err);
        return sendError(res, 'Failed to delete coupon', 500);
    }
});

module.exports = router;
