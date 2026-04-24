const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

let sentryInitialized = false;

function initSentry(app) {
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
            new Sentry.Integrations.Http({ tracing: true }),

            new Sentry.Integrations.Express({ app }),

            new ProfilingIntegration(),
        ],

        ignoreErrors: [
            'ECONNRESET',
            'EPIPE',
            'ENOENT',
            'NetworkError',
        ],

        beforeSend(event, hint) {
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

const noopMiddleware = (req, res, next) => next();

const requestHandler = () => {
    if (!sentryInitialized) return noopMiddleware;
    return Sentry.Handlers.requestHandler({
        ip: true,
        user: ['id', 'email'],
    });
};

const tracingHandler = () => {
    if (!sentryInitialized) return noopMiddleware;
    return Sentry.Handlers.tracingHandler();
};

const errorHandler = () => {
    if (!sentryInitialized) return noopMiddleware;
    return Sentry.Handlers.errorHandler({
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

const captureMessage = (message, level = 'info', context = {}) => {
    if (!sentryInitialized) return;
    Sentry.captureMessage(message, {
        level,
        tags: context.tags,
        extra: context.extra,
    });
};

const setUser = (user) => {
    if (!sentryInitialized) return;
    Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
    });
};

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
    Sentry,
};
