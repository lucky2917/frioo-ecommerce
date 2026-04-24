const { body, param } = require('express-validator');

const phoneValidator = () =>
    body('phone_number')
        .trim()
        .matches(/^(\+91|91)?[6-9]\d{9}$/)
        .withMessage('Invalid phone number. Must be a valid Indian mobile number starting with 6-9');

const emailValidator = (fieldName = 'email') =>
    body(fieldName)
        .trim()
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email too long');

const addressValidator = (fieldName = 'delivery_address', required = true) => {
    const validator = body(fieldName)
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Address must be between 10 and 500 characters')
        .matches(/[a-zA-Z]/)
        .withMessage('Address must contain letters');

    return required ? validator : validator.optional();
};

const nameValidator = (fieldName = 'full_name') =>
    body(fieldName)
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'.,-]+$/)
        .withMessage('Name can only contain letters, spaces, and common punctuation');

const uuidValidator = (fieldName) =>
    body(fieldName)
        .isUUID(4)
        .withMessage(`${fieldName} must be a valid UUID`);

const priceValidator = (fieldName = 'price_cents', min = 0, max = 100000000) =>
    body(fieldName)
        .isInt({ min, max })
        .withMessage(`${fieldName} must be an integer between ${min} and ${max}`);

const arrayValidator = (fieldName, minItems = 1, maxItems = 100) =>
    body(fieldName)
        .isArray({ min: minItems, max: maxItems })
        .withMessage(`${fieldName} must be an array with ${minItems}-${maxItems} items`);

const orderTypeValidator = () =>
    body('order_type')
        .isIn(['delivery', 'takeaway'])
        .withMessage('Order type must be either "delivery" or "takeaway"');

const distanceValidator = (fieldName = 'distance_km', max = 100) =>
    body(fieldName)
        .optional()
        .isFloat({ min: 0, max })
        .withMessage(`Distance must be between 0 and ${max} km`);

const couponCodeValidator = () =>
    body('code')
        .trim()
        .toUpperCase()
        .isLength({ min: 3, max: 20 })
        .withMessage('Coupon code must be 3-20 characters')
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('Coupon code can only contain uppercase letters, numbers, hyphens, and underscores');

const discountTypeValidator = () =>
    body('discount_type')
        .isIn(['percentage', 'fixed'])
        .withMessage('Discount type must be either "percentage" or "fixed"');

const discountValueValidator = () =>
    body('value')
        .isFloat({ min: 0 })
        .withMessage('Discount value must be a positive number')
        .custom((value, { req }) => {
            if (req.body.discount_type === 'percentage' && value > 100) {
                throw new Error('Percentage discount cannot exceed 100%');
            }
            if (req.body.discount_type === 'fixed' && value > 100000) {
                throw new Error('Fixed discount cannot exceed ₹100,000');
            }
            return true;
        });

const orderItemsValidator = () =>
    body('items')
        .isArray({ min: 1, max: 50 })
        .withMessage('Order must contain between 1 and 50 items')
        .custom((items) => {
            for (const item of items) {
                if (!item.id || !item.title || typeof item.price !== 'number' || typeof item.qty !== 'number') {
                    throw new Error('Each item must have id, title, price, and qty');
                }
                if (item.qty < 1 || item.qty > 100) {
                    throw new Error('Item quantity must be between 1 and 100');
                }
                if (item.price < 0) {
                    throw new Error('Item price cannot be negative');
                }
            }
            return true;
        });

const orderStatusValidator = () =>
    body('status')
        .isIn(['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'])
        .withMessage('Invalid order status');

const idParamValidator = (paramName = 'id') =>
    param(paramName)
        .trim()
        .notEmpty()
        .withMessage(`${paramName} parameter is required`);

const sanitizeHtml = (value) => {
    if (typeof value !== 'string') return value;
    return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
};

const orderValidators = () => [
    body('user_id').optional().isUUID(4).withMessage('user_id must be a valid UUID'),
    body('profile_id').optional().isUUID(4).withMessage('profile_id must be a valid UUID'),
    orderItemsValidator(),
    body('total_amount').isFloat({ min: 0, max: 1000000 }).withMessage('total_amount must be a number between 0 and 1000000'),
    orderTypeValidator(),
    addressValidator('delivery_address', false),
    body('phone_number').optional().trim(), // Make phone optional for orders
    distanceValidator(),
    body('coupon_code').optional().trim().toUpperCase(),
    body('discount_amount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be non-negative')
];

const productValidators = () => [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Product title must be 3-200 characters'),
    priceValidator('price_cents', 1, 100000000),
    body('category').trim().isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long (max 2000 characters)'),
    body('images').optional().isArray({ max: 10 }).withMessage('Maximum 10 images allowed'),
    body('featured').optional().isBoolean().withMessage('Featured must be true or false')
];

const couponValidators = () => [
    couponCodeValidator(),
    discountTypeValidator(),
    discountValueValidator(),
    body('min_order_value').isFloat({ min: 0 }).withMessage('Minimum order value must be non-negative'),
    body('expires_at').optional().isISO8601().withMessage('Invalid expiry date format'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long')
];

module.exports = {
    phoneValidator,
    emailValidator,
    addressValidator,
    nameValidator,
    uuidValidator,
    priceValidator,
    arrayValidator,
    orderTypeValidator,
    distanceValidator,
    couponCodeValidator,
    discountTypeValidator,
    discountValueValidator,
    orderItemsValidator,
    orderStatusValidator,
    idParamValidator,

    orderValidators,
    productValidators,
    couponValidators,

    sanitizeHtml
};
