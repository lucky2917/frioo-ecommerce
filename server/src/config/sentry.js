/**
 * Sentry Error Tracking Configuration (Server-side)
 * Enterprise-grade error monitoring for production
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// Track initialization state
let sentryInitialized = false;

/**
 * Initialize Sentry for error tracking
 * Call this BEFORE any other app code
 */
function initSentry(app) {
    // Only initialize if DSN is provided
    if (!process.env.SENTRY_DSN) {
        console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,

        // Environment identification
        environment: process.env.NODE_ENV || 'development',

        // Release tracking for better error correlation
        release: process.env.npm_package_version || '1.0.0',

        // Performance monitoring (traces)
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

        // Profiling (CPU/memory usage)
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        integrations: [
            // Enable HTTP instrumentation
            new Sentry.Integrations.Http({ tracing: true }),

            // Express.js integration
            new Sentry.Integrations.Express({ app }),

            // Profiling for performance insights
            new ProfilingIntegration(),
        ],

        // Ignore common non-critical errors
        ignoreErrors: [
            'ECONNRESET',
            'EPIPE',
            'ENOENT',
            'NetworkError',
        ],

        // Scrub sensitive data from error reports
        beforeSend(event, hint) {
            // Remove sensitive headers
            if (event.request && event.request.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
            }

            // Remove sensitive body data
            if (event.request && event.request.data) {
                const sensitiveFields = ['password', 'token', 'secret', 'creditCard'];
                sensitiveFields.forEach(field => {
                    if (event.request.data[field]) {
                        event.request.data[field] = '[REDACTED]';
                    }
                });
            }

            return event;
        },
    });

    sentryInitialized = true;
    if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Sentry error tracking initialized');
    }
}

/**
 * No-op middleware (used when Sentry is disabled)
 */
const noopMiddleware = (req, res, next) => next();

/**
 * Sentry request handler (must be first middleware)
 */
const requestHandler = () => {
    if (!sentryInitialized) return noopMiddleware;
    return Sentry.Handlers.requestHandler({
        ip: true, // Track IP addresses
        user: ['id', 'email'], // Track user context
    });
};

/**
 * Sentry tracing handler (for performance monitoring)
 */
const tracingHandler = () => {
    if (!sentryInitialized) return noopMiddleware;
    return Sentry.Handlers.tracingHandler();
};

/**
 * Sentry error handler (must be after routes, before other error handlers)
 */
const errorHandler = () => {
    if (!sentryInitialized) return noopMiddleware;
    return Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
            // Send all errors with 4xx/5xx status codes
            return error.status >= 400;
        },
    });
};

/**
 * Manually capture errors
 */
const captureError = (error, context = {}) => {
    if (!sentryInitialized) return;
    Sentry.captureException(error, {
        tags: context.tags,
        extra: context.extra,
        user: context.user,
        level: context.level || 'error',
    });
};

/**
 * Manually capture messages/warnings
 */
const captureMessage = (message, level = 'info', context = {}) => {
    if (!sentryInitialized) return;
    Sentry.captureMessage(message, {
        level,
        tags: context.tags,
        extra: context.extra,
    });
};

/**
 * Add user context to error reports
 */
const setUser = (user) => {
    if (!sentryInitialized) return;
    Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
    });
};

/**
 * Clear user context (e.g., on logout)
 */
const clearUser = () => {
    if (!sentryInitialized) return;
    Sentry.setUser(null);
};

module.exports = {
    initSentry,
    requestHandler,
    tracingHandler,
    errorHandler,
    captureError,
    captureMessage,
    setUser,
    clearUser,
    Sentry, // Export for direct access if needed
};
