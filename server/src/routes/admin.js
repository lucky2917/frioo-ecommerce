const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { phoneValidator } = require('../utils/validators');
const { sendError, sendValidationError, sendSuccess } = require('../utils/responses');

// Apply admin auth middleware to all routes in this router
router.use(requireAdmin);

// --- ADMIN: GET ALL ORDERS (with pagination) ---
router.get('/orders', async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // 50 orders per page
        const offset = (page - 1) * limit;

        // Get total count for pagination metadata
        const { count, error: countError } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // Get paginated orders with profile data
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
        console.error('Admin orders fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: UPDATE ORDER STATUS ---
router.patch('/orders/:orderId',
    [
        body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'])
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
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
            res.json({ success: true, order: data });
        } catch (err) {
            console.error('Order update error:', err);
            res.status(500).json({ error: err.message });
        }
    }

);

// --- ADMIN: USER MANAGEMENT ---
router.get('/users', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ users: data });
    } catch (err) {
        console.error('Admin users fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Delete from auth.users (requires service role key with auth.admin)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authError) throw authError;

        // Delete from public.profiles (should cascade ideally, but explicit delete is safe)
        const { error: dbError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
        if (dbError) throw dbError;

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('Admin delete user error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: PRODUCT MANAGEMENT ---
// Helper function to generate slug from title
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
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { title, description, price_cents, category, images, nutrition, featured, unit } = req.body;
            const slug = generateSlug(title);

            const { data, error } = await supabaseAdmin
                .from('products')
                .insert([{ title, slug, description, price_cents, category, images, nutrition, featured, unit }])
                .select()
                .single();

            if (error) throw error;
            res.json({ success: true, product: data });
        } catch (err) {
            console.error('Admin create product error:', err);
            res.status(500).json({ error: err.message });
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
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { id } = req.params;
            const allowedFields = ['title', 'description', 'price_cents', 'category', 'images', 'nutrition', 'featured', 'unit'];
            const updates = {};

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            }

            // If title is being updated, regenerate slug
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
            res.json({ success: true, product: data });
        } catch (err) {
            console.error('Admin update product error:', err);
            res.status(500).json({ error: err.message });
        }
    }
);

router.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        console.error('Admin delete product error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update User (Profile) - with phone validation
router.patch('/users/:id',
    phoneValidator(), // Validate Indian phone number format
    async (req, res) => {
        // Check validation results
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
            console.error('Admin update user error:', err);
            return sendError(res, 'Failed to update user profile', 500);
        }
    }
);

module.exports = router;
