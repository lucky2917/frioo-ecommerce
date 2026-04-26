const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { phoneValidator } = require('../utils/validators');
const { sendError, sendValidationError, sendSuccess } = require('../utils/responses');
const logger = require('../utils/logger');

router.use(requireAdmin);

router.get('/orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = (page - 1) * limit;

        const { count, error: countError } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        const { data, error } = await supabaseAdmin
            .from('orders')
            .select(`
        *,
        profiles (
          full_name,
          email,
          phone_number
        )
      `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            orders: data,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit),
                hasNext: page < Math.ceil(count / limit),
                hasPrev: page > 1
            }
        });
    } catch (err) {
        logger.error('Admin orders fetch error:', err);
        return sendError(res, 'Failed to fetch orders', 500);
    }
});

router.patch('/orders/:orderId',
    [
        body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'])
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors);
        }

        try {
            const { orderId } = req.params;
            const { status } = req.body;

            const { data, error } = await supabaseAdmin
                .from('orders')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            return sendSuccess(res, { order: data });
        } catch (err) {
            logger.error('Order update error:', err);
            return sendError(res, 'Failed to update order', 500);
        }
    }
);

router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        const { count, error: countError } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            users: data,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit),
                hasNext: page < Math.ceil(count / limit),
                hasPrev: page > 1
            }
        });
    } catch (err) {
        logger.error('Admin users fetch error:', err);
        return sendError(res, 'Failed to fetch users', 500);
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authError) throw authError;

        const { error: dbError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
        if (dbError) throw dbError;

        return sendSuccess(res, { message: 'User deleted successfully' });
    } catch (err) {
        logger.error('Admin delete user error:', err);
        return sendError(res, 'Failed to delete user', 500);
    }
});

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

router.post('/products',
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('price_cents').isInt({ min: 0 }).withMessage('Price must be a positive integer'),
        body('category').notEmpty().withMessage('Category is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendValidationError(res, errors);

        try {
            const { title, description, price_cents, category, images, nutrition, featured, unit, stock, discount, perfect_for, video_url } = req.body;
            const slug = generateSlug(title);

            const { data, error } = await supabaseAdmin
                .from('products')
                .insert([{ title, slug, description, price_cents, category, images, nutrition, featured, unit, stock: stock ?? 0, discount: discount ?? 0, perfect_for: perfect_for || '', video_url: video_url || '' }])
                .select()
                .single();

            if (error) throw error;
            return sendSuccess(res, { product: data }, 201);
        } catch (err) {
            logger.error('Admin create product error:', err);
            return sendError(res, 'Failed to create product', 500);
        }
    }
);

router.patch('/products/:id',
    [
        body('title').optional().notEmpty().withMessage('Title cannot be empty'),
        body('price_cents').optional().isInt({ min: 0 }).withMessage('Price must be positive'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendValidationError(res, errors);

        try {
            const { id } = req.params;
            const allowedFields = ['title', 'description', 'price_cents', 'category', 'images', 'nutrition', 'featured', 'unit', 'stock', 'discount', 'perfect_for', 'video_url'];
            const updates = {};

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            }

            if (updates.title) {
                updates.slug = generateSlug(updates.title);
            }

            const { data, error } = await supabaseAdmin
                .from('products')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return sendSuccess(res, { product: data });
        } catch (err) {
            logger.error('Admin update product error:', err);
            return sendError(res, 'Failed to update product', 500);
        }
    }
);

router.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
        if (error) throw error;
        return sendSuccess(res, { message: 'Product deleted' });
    } catch (err) {
        logger.error('Admin delete product error:', err);
        return sendError(res, 'Failed to delete product', 500);
    }
});

router.patch('/users/:id',
    phoneValidator(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors);
        }

        try {
            const { id } = req.params;
            const { full_name, phone_number, role } = req.body;

            const { data, error } = await supabaseAdmin
                .from('profiles')
                .update({ full_name, phone_number, role })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return sendSuccess(res, { user: data });
        } catch (err) {
            logger.error('Admin update user error:', err);
            return sendError(res, 'Failed to update user profile', 500);
        }
    }
);

module.exports = router;
