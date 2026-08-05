require('dotenv').config();

const { validateEnvironment, describeEnvironment } = require('./config/env');

const { warnings: envWarnings } = validateEnvironment();

const { initSentry, setupSentryErrorHandler, tagRequest, flushSentry } = require('./config/sentry');
initSentry();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { requestContext, requestLogger } = require('./middleware/requestContext');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

app.set('trust proxy', 1);

const productsRouter = require('./routes/products');
const couponsRouter = require('./routes/coupons');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');
const creditsRouter = require('./routes/credits');
const myCreditsRouter = require('./routes/myCredits');
const uploadRoutes = require('./routes/upload');
const healthRouter = require('./routes/health');
const settingsRouter = require('./routes/settings');
const notificationsRouter = require('./routes/notifications');

app.use(requestContext);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'",
      ].filter(Boolean),
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        process.env.SUPABASE_URL,
        process.env.SENTRY_DSN ? "https://*.ingest.sentry.io" : "",
      ].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  frameguard: {
    action: 'deny',
  },

  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  noSniff: true,

  ieNoOpen: true,

  xssFilter: true,

  dnsPrefetchControl: {
    allow: false,
  },

  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()');

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  next();
});

const PRODUCTION_ORIGINS = [
  'https://frioo.in',
  'https://www.frioo.in',
  'https://admin.frioo.in'
];

const DEVELOPMENT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174'
];

const allowedOrigins = [
  ...PRODUCTION_ORIGINS,
  ...(process.env.NODE_ENV === 'production' ? [] : DEVELOPMENT_ORIGINS),
  process.env.PRODUCTION_URL,
  ...(process.env.EXTRA_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim())
].filter(Boolean);

const isAllowedOrigin = (origin) => allowedOrigins.includes(origin);

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204
}));

const enforceOrigin = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  if (!origin || isAllowedOrigin(origin)) {
    return next();
  }

  logger.warn('Rejected cross-origin write', { requestId: req.id, origin, path: req.originalUrl });

  return res.status(403).json({
    success: false,
    data: null,
    error: { message: 'Origin not allowed', code: 403, requestId: req.id }
  });
};

app.use('/api', enforceOrigin);

app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    const type = res.getHeader('Content-Type');
    if (typeof type === 'string' && /^(image|video|audio)\//.test(type)) return false;
    return compression.filter(req, res);
  }
}));

app.use(tagRequest);
app.use(requestLogger(1000));

const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 9000;

app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS, () => {
    res.status(408).json({
      success: false,
      error: {
        message: 'Request timeout - please try again',
        code: 408
      }
    });
  });

  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
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

app.use(express.json({ limit: '100kb' }));

const swaggerUiOptions = {
    customSiteTitle: 'Frioo API Docs',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        filter: true,
        tryItOutEnabled: false
    }
};

const apiDocsEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true';

if (apiDocsEnabled) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
} else {
  logger.info('API docs disabled in production');
}

app.use('/', healthRouter);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again later.',
      code: 429,
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const isHttps = req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      req.headers['x-forwarded-ssl'] === 'on';

    if (!isHttps) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    next();
  });
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Frioo API is running' });
});

const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: { message: 'Too many coupon checks. Please try again later.', code: 429 }
  }
});

app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/products', productsRouter);
app.use('/api/coupons/validate', couponLimiter);
app.use('/api/coupons', couponsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/credits', myCreditsRouter);
app.use('/api/admin/credits', authLimiter, creditsRouter);
app.use('/api/admin', authLimiter, adminRouter);
app.use('/api/upload', authLimiter, uploadRoutes);

setupSentryErrorHandler(app);

app.use((err, req, res, next) => {
  if (err?.name !== 'MulterError') return next(err);

  const isTooLarge = err.code === 'LIMIT_FILE_SIZE';
  const status = isTooLarge ? 413 : 400;

  logger.warn('Upload rejected', { requestId: req.id, code: err.code, field: err.field });

  return res.status(status).json({
    success: false,
    data: null,
    error: {
      message: isTooLarge ? 'That image is over 5MB. Use a smaller file.' : 'That upload was not accepted.',
      code: status,
      requestId: req.id
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { message: 'Route not found', code: 404, requestId: req.id }
  });
});

app.use(async (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;

  logger.error('Unhandled error', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    status,
    error: err
  });

  if (status >= 500 && process.env.VERCEL) {
    await flushSentry(2000);
  }

  if (res.headersSent) return;

  res.status(status).json({
    success: false,
    data: null,
    error: {
      message: status >= 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      code: status,
      requestId: req.id
    }
  });
});

const PORT = process.env.PORT || 4000;

let server = null;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server = app.listen(PORT, () => {
    logger.info('Frioo API started', { port: PORT, ...describeEnvironment() });
    envWarnings.forEach((key) => logger.warn('Recommended environment variable is not set', { key }));
  });
}

let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;

  logger.info(`${signal} received. Starting graceful shutdown...`);
  isShuttingDown = true;

  if (!server) {
    logger.info('No HTTP server to close (serverless mode). Exiting.');
    process.exit(0);
  }

  server.close((err) => {
    if (err) {
      logger.error('Error during server close:', err);
      process.exit(1);
    }

    logger.info('HTTP server closed. Shutdown complete.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  if (!server) return;
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (!server) return;
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;
