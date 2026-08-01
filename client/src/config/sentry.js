import * as Sentry from '@sentry/react';

export function initSentry() {
    if (!import.meta.env.VITE_SENTRY_DSN) {
        console.warn('⚠️  Sentry DSN not configured. Client error tracking disabled.');
        return;
    }

    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,

        environment: import.meta.env.MODE || 'development',

        integrations: [
            Sentry.browserTracingIntegration(),

            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],

        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        ignoreErrors: [
            /chrome-extension/,
            /moz-extension/,

            'NetworkError',
            'Failed to fetch',
            'Load failed',

            'cancelled',
            'aborted',
        ],

        beforeSend(event) {
            if (event.request && event.request.headers) {
                delete event.request.headers['Authorization'];
                delete event.request.headers['Cookie'];
            }

            if (event.request && event.request.data) {
                const sensitiveFields = ['password', 'token', 'creditCard', 'ssn'];
                sensitiveFields.forEach(field => {
                    if (event.request.data[field]) {
                        event.request.data[field] = '[REDACTED]';
                    }
                });
            }

            return event;
        },
    });

    if (import.meta.env.DEV) {
        console.log('✅ Sentry client error tracking initialized');
    }
}

export function setSentryUser(user) {
    Sentry.setUser({
        id: user?.id,
        email: user?.email,
        username: user?.user_metadata?.full_name,
    });
}

export function clearSentryUser() {
    Sentry.setUser(null);
}

export function captureError(error, context = {}) {
    Sentry.captureException(error, {
        tags: context.tags,
        extra: context.extra,
        level: context.level || 'error',
    });
}

export function captureMessage(message, level = 'info', context = {}) {
    Sentry.captureMessage(message, {
        level,
        tags: context.tags,
        extra: context.extra,
    });
}

export { Sentry };
