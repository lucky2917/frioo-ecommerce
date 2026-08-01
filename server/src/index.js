require('dotenv').config();

const { validateEnvironment, describeEnvironment } = require('./config/env');

const { warnings: envWarnings } = validateEnvironment();

const { initSentry, setupSentryErrorHandler } = require('./config/sentry');
initSentry();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
const uploadRoutes = require('./routes/upload');
const healthRouter = require('./routes/health');
const settingsRouter = require('./routes/settings');

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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://frioo.in',
  'https://www.frioo.in',
  'https://frioo-shop.vercel.app',
  process.env.PRODUCTION_URL
].filter(Boolean);

const enforceOrigin = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }
  if (allowedOrigins.includes(origin)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    data: null,
    error: { message: 'Origin not allowed', code: 403 }
  });
};

app.use('/api', enforceOrigin);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(requestLogger(1000));

app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({
      success: false,
      error: {
        message: 'Request timeout - please try again',
        code: 408
      }
    });
  });

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

app.use(express.json());

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

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

app.use('/api/settings', settingsRouter);
app.use('/api/products', productsRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', authLimiter, adminRouter);
app.use('/api/upload', authLimiter, uploadRoutes);

setupSentryErrorHandler(app);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { message: 'Route not found', code: 404, requestId: req.id }
  });
});

app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;

  logger.error('Unhandled error', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    status,
    error: err
  });

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
