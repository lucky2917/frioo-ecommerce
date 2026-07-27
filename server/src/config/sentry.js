const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

let sentryInitialized = false;

function initSentry() {
    if (!process.env.SENTRY_DSN) {
        console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.npm_package_version || '1.0.0',
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
        console.log('✅ Sentry error tracking initialized');
    }
}

const setupSentryErrorHandler = (app) => {
    if (!sentryInitialized) return;
    Sentry.setupExpressErrorHandler(app, {
        shouldHandleError(error) {
            return error.status >= 400;
        },
    });
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
    captureError,
    Sentry,
};
