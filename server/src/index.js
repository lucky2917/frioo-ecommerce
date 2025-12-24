require('dotenv').config();

// Validate required environment variables
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`❌ CRITICAL: Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('   Please check your .env file or Vercel project settings.');
  process.exit(1);
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { requestLogger, performanceLogger } = require('./middleware/requestLogger');
const { csrfProtection, validateCsrfToken, getCsrfToken } = require('./middleware/csrf');
const { initSentry, requestHandler, tracingHandler, errorHandler } = require('./config/sentry');
const logger = require('./utils/logger');

const app = express();

// ===== SENTRY ERROR TRACKING =====
// MUST BE FIRST - Initialize Sentry before everything else
initSentry(app);
app.use(requestHandler()); // Request context
app.use(tracingHandler()); // Performance monitoring

// Import Routes (after Sentry init)
const productsRouter = require('./routes/products');
const couponsRouter = require('./routes/coupons');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const healthRouter = require('./routes/health');

// ===== SECURITY HEADERS =====
// Enterprise-grade HTTP security headers
app.use(helmet({
  // Content Security Policy - prevents XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Vite dev mode
        process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'", // Dev only
      ].filter(Boolean),
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        process.env.SUPABASE_URL,
        process.env.SENTRY_DSN ? "https://*.ingest.sentry.io" : "",
      ].filter(Boolean),
      frameSrc: ["'none'"], // Prevent embedding
      objectSrc: ["'none'"], // Block plugins
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  // HTTP Strict Transport Security - forces HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Prevent clickjacking
  frameguard: {
    action: 'deny', // Don't allow any framing
  },

  // Disable browser features that could be exploited
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Disable MIME sniffing
  noSniff: true,

  // Disable IE-specific features
  ieNoOpen: true,

  // XSS filter (legacy browsers)
  xssFilter: true,

  // DNS prefetch control
  dnsPrefetchControl: {
    allow: false,
  },

  // Permissions Policy (formerly Feature Policy)
  // Restricts browser features
  crossOriginEmbedderPolicy: false, // Disable for development (enable in production)
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

// Additional custom security headers
app.use((req, res, next) => {
  // Prevent caching of sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Permissions Policy - restrict browser features
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()');

  // Additional protection
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  next();
});

// --- CORS CONFIGURATION ---
// In production, replace with your actual domain
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://frioo.in',           // Custom domain
  'https://www.frioo.in',       // Custom domain with www
  'https://frioo-shop.vercel.app',
  process.env.PRODUCTION_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all origins (for network IP access)
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, enforce whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ===== REQUEST LOGGING =====
// Log all requests with timing and status
app.use(requestLogger);
// Monitor slow requests (>1000ms)
app.use(performanceLogger(1000));

// ===== REQUEST TIMEOUT =====
// Prevent hanging requests from exhausting server resources
app.use((req, res, next) => {
  // Set 30-second timeout for requests
  req.setTimeout(30000, () => {
    res.status(408).json({
      success: false,
      error: {
        message: 'Request timeout - please try again',
        code: 408
      }
    });
  });

  // Set 30-second timeout for responses
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        error: {
          message: 'Gateway timeout - server took too long to respond',
          code: 504
        }
      });
    }
  });

  next();
});

// ===== BODY PARSING =====
app.use(express.json());

// ===== COOKIE PARSING =====
app.use(cookieParser());

// ===== CSRF PROTECTION =====
// Generate CSRF tokens for all requests
app.use(csrfProtection);

// CSRF token endpoint (for frontend to fetch token)
app.get('/api/csrf-token', getCsrfToken);

// --- RATE LIMITING ---
// General limiter for most requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // INCREASED: Limit to 300 to prevent false positives for legitimate users
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: 'draft-7', // Return RateLimit-* headers (newer standard)
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

app.use(limiter);

// ===== AUTH-SPECIFIC RATE LIMITING =====
// Stricter rate limiting for authentication/admin endpoints
// Prevents brute force attacks on login/auth verification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Relaxed: 20 attempts per 15 minutes (was 5)
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again later.',
      code: 429,
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: 'draft-7', // Return RateLimit-* headers
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// ===== HTTPS ENFORCEMENT =====
// Redirect HTTP to HTTPS in production (prevents man-in-the-middle attacks)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is already HTTPS
    const isHttps = req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      req.headers['x-forwarded-ssl'] === 'on';

    if (!isHttps) {
      // Redirect to HTTPS
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    next();
  });
}

// ===== ROUTES =====
// Health checks (no auth, no CSRF - for monitoring systems)
app.use('/', healthRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Frioo API is running' });
});

// Apply CSRF validation to all API routes EXCEPT admin routes and orders (POST/PUT/DELETE/PATCH)
// Admin routes are protected by Bearer token authentication instead
// Orders are protected by user authentication
app.use('/api', (req, res, next) => {
  // Skip CSRF for admin routes, uploads, and orders (they use session/JWT authentication)
  if (req.path.startsWith('/admin/') || req.path.startsWith('/upload') || req.path.startsWith('/orders')) {
    return next();
  }
  // Apply CSRF validation to all other API routes
  validateCsrfToken(req, res, next);
});

app.use('/api/products', productsRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', authLimiter, adminRouter); // AUTH RATE LIMIT: 5 attempts per 15 min
app.use('/api/upload', authLimiter, uploadRoutes); // AUTH RATE LIMIT: Protect file uploads

// ===== SENTRY ERROR HANDLER =====
// MUST BE AFTER ROUTES - Captures all errors from route handlers
app.use(errorHandler());

// ===== GENERIC ERROR HANDLER =====
// Fallback for any errors not caught by Sentry
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      code: err.status || 500
    },
    data: null
  });
});

// --- 404 HANDLER ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


// ===== START SERVER =====
const PORT = process.env.PORT || 4000;

// Store server instance for graceful shutdown
let server = null;

// Only start listening if not in serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server = app.listen(PORT, () => {
    logger.info(`🚀 Frioo Backend running on port ${PORT}`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export for Vercel serverless deployment
module.exports = app;
// ===== GRACEFUL SHUTDOWN =====
// Handle process termination signals for zero-downtime deploys
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;

  console.log(`\n${signal} received. Starting graceful shutdown...`);
  isShuttingDown = true;

  // Stop accepting new requests
  server.close((err) => {
    if (err) {
      console.error('Error during server close:', err);
      process.exit(1);
    }

    console.log('✅ HTTP server closed');
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});