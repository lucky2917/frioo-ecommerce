const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { phoneValidator } = require('../utils/validators');
const { sendError, sendValidationError, sendSuccess } = require('../utils/responses');
const logger = require('../utils/logger');

router.use(requireAdmin);

const ALLOWED_STATUS_TRANSITIONS = {
    'pending':           ['confirmed', 'cancelled'],
    'confirmed':         ['preparing', 'cancelled'],
    'preparing':         ['ready', 'cancelled'],
    'ready':             ['out-for-delivery', 'cancelled'],
    'out-for-delivery':  ['delivered', 'cancelled'],
    'delivered':         [],
    'cancelled':         []
};

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: List all orders
 *     description: |
 *       Returns a paginated list of all orders with embedded customer profile data.
 *       Ordered newest first. Admin only.
 *     tags: [Admin — Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Records per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated order list with embedded profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Order'
 *                       - type: object
 *                         properties:
 *                           profiles:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               full_name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               phone_number:
 *                                 type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
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

/**
 * @swagger
 * /api/admin/orders/{orderId}:
 *   patch:
 *     summary: Update order status
 *     description: |
 *       Transitions an order to a new status. Only valid state-machine transitions are accepted:
 *
 *       | Current status    | Allowed transitions                    |
 *       |-------------------|----------------------------------------|
 *       | pending           | confirmed, cancelled                   |
 *       | confirmed         | preparing, cancelled                   |
 *       | preparing         | ready, cancelled                       |
 *       | ready             | out-for-delivery, cancelled            |
 *       | out-for-delivery  | delivered, cancelled                   |
 *       | delivered         | (terminal — no further transitions)    |
 *       | cancelled         | (terminal — no further transitions)    |
 *
 *       Admin only.
 *     tags: [Admin — Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: ord_abc123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, preparing, ready, out-for-delivery, delivered, cancelled]
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Order status updated
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         description: Invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               data: null
 *               error:
 *                 message: 'Cannot transition order from "delivered" to "pending"'
 *                 code: 422
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
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
            const { status: newStatus } = req.body;

            const { data: existing, error: fetchError } = await supabaseAdmin
                .from('orders')
                .select('status')
                .eq('id', orderId)
                .single();

            if (fetchError || !existing) {
                return sendError(res, 'Order not found', 404);
            }

            const allowed = ALLOWED_STATUS_TRANSITIONS[existing.status] || [];
            if (!allowed.includes(newStatus)) {
                return sendError(
                    res,
                    `Cannot transition order from "${existing.status}" to "${newStatus}"`,
                    422
                );
            }

            const { data, error } = await supabaseAdmin
                .from('orders')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Admin ${req.user.id} transitioned order ${orderId}: ${existing.status} → ${newStatus}`);
            return sendSuccess(res, { order: data });
        } catch (err) {
            logger.error('Order update error:', err);
            return sendError(res, 'Failed to update order', 500);
        }
    }
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users
 *     description: Returns a paginated list of all user profiles. Admin only.
 *     tags: [Admin — Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Records per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Profile'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
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

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: |
 *       Permanently deletes a user from both Supabase Auth and the profiles table.
 *       Admins cannot delete their own account.
 *       Admin only.
 *     tags: [Admin — Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                           example: User deleted successfully
 *       400:
 *         description: Attempt to delete own account
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return sendError(res, 'Cannot delete your own account', 400);
        }

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authError) throw authError;

        const { error: dbError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
        if (dbError) throw dbError;

        logger.info(`Admin ${req.user.id} deleted user ${id}`);
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

/**
 * @swagger
 * /api/admin/products:
 *   post:
 *     summary: Create a product
 *     description: |
 *       Creates a new product. Slug is auto-generated from title.
 *       If a slug collision occurs, a timestamp suffix is appended automatically.
 *       Admin only.
 *     tags: [Admin — Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductBody'
 *           example:
 *             title: Organic Cherry Tomatoes
 *             description: Vine-ripened, no pesticides. Sourced from local farms.
 *             price_cents: 14900
 *             category: Vegetables
 *             images:
 *               - https://storage.supabase.co/frioo-assets/tomato.jpg
 *             featured: false
 *             unit: 500g
 *             stock: 100
 *             discount: 0
 *             perfect_for: Salads, pasta, cooking
 *     responses:
 *       201:
 *         description: Product created
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
 *                         product:
 *                           $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/products',
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('price_cents').isInt({ min: 1 }).withMessage('Price must be a positive integer'),
        body('category').notEmpty().withMessage('Category is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendValidationError(res, errors);

        try {
            const { title, description, price_cents, category, images, nutrition, featured, unit, stock, discount, perfect_for, video_url } = req.body;
            const slug = generateSlug(title);

            const { data: existing } = await supabaseAdmin
                .from('products')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();

            const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

            const { data, error } = await supabaseAdmin
                .from('products')
                .insert([{ title, slug: finalSlug, description, price_cents, category, images, nutrition, featured, unit, stock: stock ?? null, discount: discount ?? 0, perfect_for: perfect_for || '', video_url: video_url || '' }])
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

/**
 * @swagger
 * /api/admin/products/{id}:
 *   patch:
 *     summary: Update a product
 *     description: |
 *       Partially updates a product. Only provided fields are updated (PATCH semantics).
 *       Slug is regenerated automatically if `title` changes.
 *       Admin only.
 *     tags: [Admin — Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: prod_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductBody'
 *           example:
 *             price_cents: 12900
 *             discount: 15
 *             stock: 80
 *     responses:
 *       200:
 *         description: Product updated
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
 *                         product:
 *                           $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/products/:id',
    [
        body('title').optional().notEmpty().withMessage('Title cannot be empty'),
        body('price_cents').optional().isInt({ min: 1 }).withMessage('Price must be positive'),
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
                const newSlug = generateSlug(updates.title);
                const { data: existing } = await supabaseAdmin
                    .from('products')
                    .select('id')
                    .eq('slug', newSlug)
                    .neq('id', id)
                    .maybeSingle();

                updates.slug = existing ? `${newSlug}-${Date.now()}` : newSlug;
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

/**
 * @swagger
 * /api/admin/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Permanently removes a product from the catalogue. Admin only.
 *     tags: [Admin — Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: prod_001
 *     responses:
 *       200:
 *         description: Product deleted
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
 *                           example: Product deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
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

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Update a user profile
 *     description: |
 *       Updates a user's full name and phone number.
 *       Role changes are intentionally not exposed here to prevent privilege escalation.
 *       Admin only.
 *     tags: [Admin — Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Ravi Kumar
 *               phone_number:
 *                 type: string
 *                 description: Valid Indian mobile number
 *                 example: '+919876543210'
 *     responses:
 *       200:
 *         description: User profile updated
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
 *                         user:
 *                           $ref: '#/components/schemas/Profile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/users/:id',
    phoneValidator(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors);
        }

        try {
            const { id } = req.params;
            const { full_name, phone_number } = req.body;

            const { data, error } = await supabaseAdmin
                .from('profiles')
                .update({ full_name, phone_number })
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
