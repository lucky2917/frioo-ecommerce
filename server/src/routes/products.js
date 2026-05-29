const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../db');
const { sendSuccess, sendError } = require('../utils/responses');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List all products
 *     description: |
 *       Returns the full product catalogue, ordered by newest first.
 *       Supports offset-based pagination. No authentication required.
 *       Omit `limit` to receive all products in one response.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         required: false
 *         description: Number of products to return. Omit for all products (up to DB limit).
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         required: false
 *         description: Number of products to skip for pagination.
 *         example: 0
 *     responses:
 *       200:
 *         description: Products fetched successfully
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
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Product'
 *                         pagination:
 *                           $ref: '#/components/schemas/OffsetPagination'
 *             example:
 *               success: true
 *               data:
 *                 items:
 *                   - id: prod_001
 *                     title: Organic Cherry Tomatoes
 *                     slug: organic-cherry-tomatoes
 *                     price_cents: 14900
 *                     category: Vegetables
 *                     images: ['https://storage.supabase.co/...']
 *                     featured: true
 *                     stock: 50
 *                     discount: 10
 *                 pagination:
 *                   total: 80
 *                   limit: 20
 *                   offset: 0
 *                   hasMore: true
 *               error: null
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || null;
        const offset = parseInt(req.query.offset) || 0;

        if (limit !== null && (limit < 1 || limit > 100)) {
            return sendError(res, 'Invalid limit. Must be between 1 and 100.', 400);
        }

        if (offset < 0) {
            return sendError(res, 'Invalid offset. Must be 0 or greater.', 400);
        }

        let query = supabaseAdmin
            .from('products')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (limit !== null) {
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return sendSuccess(res, {
            items: data,
            pagination: {
                total: count,
                limit: limit || count,
                offset: offset,
                hasMore: limit !== null ? (offset + limit < count) : false
            }
        });
    } catch (err) {
        console.error('Products fetch error:', err);
        return sendError(res, 'Failed to fetch products', 500);
    }
});

module.exports = router;
