const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const definition = {
    openapi: '3.0.0',
    info: {
        title: 'Frioo API',
        version: '1.0.0',
        description:
            'REST API for Frioo — a fresh produce delivery and takeaway platform serving Visakhapatnam. ' +
            'Protected endpoints require a Supabase JWT passed as a Bearer token. ' +
            'Mutating endpoints (POST /api/orders) additionally require an `X-CSRF-Token` header ' +
            'obtained from `GET /api/csrf-token`.',
        contact: {
            name: 'Frioo',
            email: 'support@frioo.in',
            url: 'https://frioo.in'
        },
        license: {
            name: 'Proprietary'
        }
    },
    servers: [
        {
            url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
            description: process.env.NODE_ENV === 'production' ? 'Production' : 'Local development'
        }
    ],
    tags: [
        { name: 'Health', description: 'Liveness and readiness probes' },
        { name: 'Auth', description: 'CSRF token acquisition' },
        { name: 'Products', description: 'Public product catalogue' },
        { name: 'Orders', description: 'Order placement — requires authentication' },
        { name: 'Coupons', description: 'Public coupon validation and listing' },
        { name: 'Admin — Orders', description: 'Order management — admin only' },
        { name: 'Admin — Products', description: 'Product CRUD — admin only' },
        { name: 'Admin — Users', description: 'User management — admin only' },
        { name: 'Admin — Coupons', description: 'Coupon management — admin only' },
        { name: 'Upload', description: 'Asset upload — admin only' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description:
                    'Supabase-issued JWT. Sign in via Google OAuth on the app, then copy the session ' +
                    'access_token from your browser localStorage (`supabase.auth.session()`) and paste it here.'
            }
        },
        schemas: {
            Profile: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
                    full_name: { type: 'string', example: 'Ravi Kumar' },
                    email: { type: 'string', format: 'email', example: 'ravi@example.com' },
                    phone_number: { type: 'string', example: '+919876543210' },
                    role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
                    address: { type: 'string', nullable: true, example: 'Flat 4B, Gajuwaka, Visakhapatnam 530026' },
                    avatar_url: { type: 'string', format: 'uri', nullable: true },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            Product: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'prod_001' },
                    title: { type: 'string', example: 'Organic Cherry Tomatoes' },
                    slug: { type: 'string', example: 'organic-cherry-tomatoes' },
                    description: { type: 'string', nullable: true },
                    price_cents: { type: 'integer', minimum: 1, example: 14900 },
                    category: { type: 'string', example: 'Vegetables' },
                    images: { type: 'array', items: { type: 'string', format: 'uri' } },
                    nutrition: {
                        type: 'object',
                        nullable: true,
                        description: 'Nutritional data including ingredients and exclusion options',
                        properties: {
                            ingredients: { type: 'array', items: { type: 'string' } },
                            exclusions: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    featured: { type: 'boolean', example: true },
                    unit: { type: 'string', nullable: true, example: '500g' },
                    stock: { type: 'integer', nullable: true, example: 50 },
                    discount: { type: 'integer', minimum: 0, maximum: 100, example: 10 },
                    perfect_for: { type: 'string', example: 'Salads, cooking' },
                    video_url: { type: 'string', format: 'uri', nullable: true },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            OrderItem: {
                type: 'object',
                required: ['id', 'title', 'price', 'qty'],
                properties: {
                    id: { type: 'string', example: 'prod_001' },
                    title: { type: 'string', example: 'Organic Cherry Tomatoes' },
                    price: { type: 'number', example: 149.0 },
                    qty: { type: 'integer', minimum: 1, maximum: 100, example: 2 },
                    variant: { type: 'string', nullable: true, example: '500g' },
                    image: { type: 'string', format: 'uri', nullable: true },
                    preferences: {
                        type: 'object',
                        nullable: true,
                        properties: {
                            exclusions: { type: 'array', items: { type: 'string' } },
                            removedIngredients: { type: 'array', items: { type: 'string' } },
                            note: { type: 'string', nullable: true }
                        }
                    }
                }
            },
            Order: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    user_id: { type: 'string', format: 'uuid' },
                    items: {
                        type: 'string',
                        description: 'JSON-encoded array of OrderItem objects'
                    },
                    total_amount: { type: 'number', example: 298.0 },
                    order_type: { type: 'string', enum: ['delivery', 'takeaway'] },
                    address: { type: 'string', nullable: true, example: 'Flat 4B, Gajuwaka, Visakhapatnam' },
                    distance: { type: 'number', example: 2.5 },
                    customer_lat: { type: 'number', nullable: true, example: 17.6868 },
                    customer_lng: { type: 'number', nullable: true, example: 83.2185 },
                    status: {
                        type: 'string',
                        enum: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled']
                    },
                    coupon_code: { type: 'string', nullable: true, example: 'FRESH10' },
                    discount: { type: 'number', example: 29.8 },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time', nullable: true }
                }
            },
            Coupon: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    code: { type: 'string', example: 'FRESH10' },
                    discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
                    value: { type: 'number', example: 10 },
                    min_order_value: { type: 'number', example: 200 },
                    usage_limit: { type: 'integer', nullable: true, example: 100 },
                    used_count: { type: 'integer', example: 42 },
                    is_active: { type: 'boolean', example: true },
                    expires_at: { type: 'string', format: 'date-time', nullable: true },
                    description: { type: 'string', nullable: true },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            PublicCoupon: {
                type: 'object',
                description: 'Subset of coupon data safe for unauthenticated consumers',
                properties: {
                    id: { type: 'string' },
                    code: { type: 'string', example: 'FRESH10' },
                    discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
                    value: { type: 'number', example: 10 },
                    min_order_value: { type: 'number', example: 200 }
                }
            },
            Pagination: {
                type: 'object',
                properties: {
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 50 },
                    total: { type: 'integer', example: 150 },
                    pages: { type: 'integer', example: 3 },
                    hasNext: { type: 'boolean', example: true },
                    hasPrev: { type: 'boolean', example: false }
                }
            },
            OffsetPagination: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 80 },
                    limit: { type: 'integer', example: 20 },
                    offset: { type: 'integer', example: 0 },
                    hasMore: { type: 'boolean', example: true }
                }
            },
            SuccessResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                    error: { type: 'object', nullable: true, example: null }
                }
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    data: { type: 'object', nullable: true, example: null },
                    error: {
                        type: 'object',
                        properties: {
                            message: { type: 'string', example: 'Something went wrong' },
                            code: { type: 'integer', example: 500 },
                            details: {
                                type: 'array',
                                nullable: true,
                                items: { type: 'object' }
                            }
                        }
                    }
                }
            },
            ValidationErrorResponse: {
                allOf: [
                    { '$ref': '#/components/schemas/ErrorResponse' }
                ],
                example: {
                    success: false,
                    data: null,
                    error: {
                        message: 'Validation failed',
                        code: 400,
                        details: [
                            { field: 'phone_number', message: 'Invalid phone number. Must be a valid Indian mobile number starting with 6-9', value: '12345' }
                        ]
                    }
                }
            },
            CsrfTokenResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                        type: 'object',
                        properties: {
                            csrfToken: { type: 'string', example: 'a3f8d2c1e9b74a6f85230d1c7e4a9f2b3c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f' }
                        }
                    },
                    error: { type: 'object', nullable: true, example: null }
                }
            },
            HealthLive: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 3600.5 },
                    service: { type: 'string', example: 'frioo-api' },
                    version: { type: 'string', example: '1.0.0' }
                }
            },
            HealthReady: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['ready', 'unavailable'], example: 'ready' },
                    checks: {
                        type: 'object',
                        properties: {
                            server: { type: 'string', example: 'ok' },
                            database: { type: 'string', example: 'ok' },
                            timestamp: { type: 'string', format: 'date-time' }
                        }
                    },
                    message: { type: 'string', example: 'All systems operational' }
                }
            },
            HealthStatus: {
                type: 'object',
                properties: {
                    service: { type: 'string', example: 'frioo-api' },
                    version: { type: 'string', example: '1.0.0' },
                    environment: { type: 'string', example: 'production' },
                    uptime: { type: 'number', example: 7200.3 },
                    timestamp: { type: 'string', format: 'date-time' },
                    memory: {
                        type: 'object',
                        properties: {
                            used: { type: 'string', example: '48 MB' },
                            total: { type: 'string', example: '128 MB' },
                            rss: { type: 'string', example: '72 MB' }
                        }
                    },
                    cpu: { type: 'object' }
                }
            },
            CreateProductBody: {
                type: 'object',
                required: ['title', 'price_cents', 'category'],
                properties: {
                    title: { type: 'string', example: 'Organic Cherry Tomatoes' },
                    description: { type: 'string', example: 'Vine-ripened, no pesticides' },
                    price_cents: { type: 'integer', minimum: 1, example: 14900 },
                    category: { type: 'string', example: 'Vegetables' },
                    images: { type: 'array', items: { type: 'string', format: 'uri' }, example: ['https://example.com/tomato.jpg'] },
                    nutrition: { type: 'object', nullable: true },
                    featured: { type: 'boolean', example: false },
                    unit: { type: 'string', example: '500g' },
                    stock: { type: 'integer', nullable: true, example: 100 },
                    discount: { type: 'integer', minimum: 0, maximum: 100, example: 0 },
                    perfect_for: { type: 'string', example: 'Salads, pasta' },
                    video_url: { type: 'string', format: 'uri', nullable: true }
                }
            },
            CreateOrderBody: {
                type: 'object',
                required: ['items', 'total_amount', 'order_type'],
                properties: {
                    items: {
                        type: 'array',
                        minItems: 1,
                        maxItems: 50,
                        items: { '$ref': '#/components/schemas/OrderItem' }
                    },
                    total_amount: { type: 'number', minimum: 0, example: 268.2 },
                    order_type: { type: 'string', enum: ['delivery', 'takeaway'], example: 'delivery' },
                    delivery_address: { type: 'string', nullable: true, example: 'Flat 4B, Gajuwaka, Visakhapatnam 530026' },
                    distance_km: { type: 'number', minimum: 0, example: 2.5 },
                    customer_lat: { type: 'number', minimum: -90, maximum: 90, example: 17.6868 },
                    customer_lng: { type: 'number', minimum: -180, maximum: 180, example: 83.2185 },
                    coupon_code: { type: 'string', nullable: true, example: 'FRESH10' }
                }
            },
            CreateCouponBody: {
                type: 'object',
                required: ['code', 'discount_type', 'value', 'min_order_value'],
                properties: {
                    code: { type: 'string', minLength: 3, maxLength: 20, example: 'SUMMER20' },
                    discount_type: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
                    value: { type: 'number', minimum: 0, example: 20 },
                    min_order_value: { type: 'number', minimum: 0, example: 300 },
                    expires_at: { type: 'string', format: 'date-time', nullable: true },
                    description: { type: 'string', nullable: true, example: 'Summer sale discount' }
                }
            }
        },
        responses: {
            Unauthorized: {
                description: 'Missing or invalid Authorization header',
                content: {
                    'application/json': {
                        schema: { '$ref': '#/components/schemas/ErrorResponse' },
                        example: {
                            success: false,
                            data: null,
                            error: { message: 'No authorization token provided', code: 401 }
                        }
                    }
                }
            },
            Forbidden: {
                description: 'Authenticated but not permitted (admin role required)',
                content: {
                    'application/json': {
                        schema: { '$ref': '#/components/schemas/ErrorResponse' },
                        example: {
                            success: false,
                            data: null,
                            error: { message: 'Admin access required', code: 403 }
                        }
                    }
                }
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { '$ref': '#/components/schemas/ErrorResponse' },
                        example: {
                            success: false,
                            data: null,
                            error: { message: 'Resource not found', code: 404 }
                        }
                    }
                }
            },
            BadRequest: {
                description: 'Invalid query parameters or business rule violation',
                content: {
                    'application/json': {
                        schema: { '$ref': '#/components/schemas/ErrorResponse' }
                    }
                }
            },
            ValidationError: {
                description: 'Request body failed express-validator rules',
                content: {
                    'application/json': {
                        schema: { '$ref': '#/components/schemas/ValidationErrorResponse' }
                    }
                }
            },
            TooManyRequests: {
                description: 'Rate limit exceeded',
                content: {
                    'application/json': {
                        schema: { '$ref': '#/components/schemas/ErrorResponse' },
                        example: {
                            success: false,
                            data: null,
                            error: { message: 'Too many requests from this IP, please try again later.', code: 429 }
                        }
                    }
                }
            },
            Conflict: {
                description: 'Resource conflict (e.g. duplicate coupon code)',
                content: {
                    'application/json': {
                        schema: { '$ref': '#/components/schemas/ErrorResponse' },
                        example: {
                            success: false,
                            data: null,
                            error: { message: 'Coupon code already exists', code: 409 }
                        }
                    }
                }
            },
            InternalError: {
                description: 'Unhandled server error',
                content: {
                    'application/json': {
                        schema: { '$ref': '#/components/schemas/ErrorResponse' },
                        example: {
                            success: false,
                            data: null,
                            error: { message: 'Internal server error', code: 500 }
                        }
                    }
                }
            }
        }
    }
};

const options = {
    definition,
    apis: [
        path.join(__dirname, '../routes/*.js'),
        path.join(__dirname, '../index.js')
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
