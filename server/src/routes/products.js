const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../db');
const { sendSuccess, sendError } = require('../utils/responses');

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
