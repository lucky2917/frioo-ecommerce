const Sentry = require('@sentry/node');
const logger = require('../utils/logger');
const { getRelease, getBuildInfo } = require('./version');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

let sentryInitialized = false;

function initSentry() {
    if (!process.env.SENTRY_DSN) {
        logger.warn('Sentry DSN not configured, server error tracking disabled');
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: getRelease(),
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [
            Sentry.httpIntegration(),
            Sentry.expressIntegration(),
            nodeProfilingIntegration(),
        ],
        ignoreErrors: [
            'ECONNRESET',
            'EPIPE',
            'ENOENT',
            'NetworkError',
        ],
        initialScope: { tags: { commit: getBuildInfo().commitShort || 'local' } },
        beforeSend(event) {
            if (event.request && event.request.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
            }
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
        logger.info('Sentry error tracking initialized');
    }
}

const setupSentryErrorHandler = (app) => {
    if (!sentryInitialized) return;
    Sentry.setupExpressErrorHandler(app, {
        shouldHandleError(error) {
            const status = error?.status ?? error?.statusCode ?? 500;
            return status >= 500;
        },
    });
};

const tagRequest = (req, _res, next) => {
    if (sentryInitialized) {
        Sentry.getCurrentScope().setTag('requestId', req.id);
    }
    next();
};

const flushSentry = async (timeoutMs = 2000) => {
    if (!sentryInitialized) return false;
    try {
        return await Sentry.flush(timeoutMs);
    } catch {
        return false;
    }
};

const captureError = (error, context = {}) => {
    if (!sentryInitialized) return;
    Sentry.captureException(error, {
        tags: context.tags,
        extra: context.extra,
        user: context.user,
        level: context.level || 'error',
    });
};

module.exports = {
    initSentry,
    setupSentryErrorHandler,
    tagRequest,
    flushSentry,
    captureError,
    Sentry,
};
