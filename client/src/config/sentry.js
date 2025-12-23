/**
 * Sentry Error Tracking Configuration (Client-side)
 * Enterprise-grade error monitoring for React application
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for React
 * Call this BEFORE ReactDOM.render
 */
export function initSentry() {
    // Only initialize if DSN is provided
    if (!import.meta.env.VITE_SENTRY_DSN) {
        console.warn('⚠️  Sentry DSN not configured. Client error tracking disabled.');
        return;
    }

    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,

        // Environment identification
        environment: import.meta.env.MODE || 'development',

        // Performance monitoring
        integrations: [
            // React Router integration for route-based error tracking
            Sentry.browserTracingIntegration(),

            // Replay sessions for debugging (records user interactions)
            Sentry.replayIntegration({
                maskAllText: true, // Privacy: mask all text content
                blockAllMedia: true, // Privacy: block all media elements
            }),
        ],

        // Performance traces sample rate
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0, // 10% in prod

        // Session replay sample rate
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

        // Ignore common non-critical errors
        ignoreErrors: [
            // Browser extensions
            /chrome-extension/,
            /moz-extension/,

            // Network errors
            'NetworkError',
            'Failed to fetch',
            'Load failed',

            // User cancellations
            'cancelled',
            'aborted',
        ],

        // Scrub sensitive data
        beforeSend(event, hint) {
            // Remove personally identifiable information
            if (event.request && event.request.headers) {
                delete event.request.headers['Authorization'];
                delete event.request.headers['Cookie'];
            }

            // Remove sensitive form data
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

/**
 * Set user context for error reports
 */
export function setSentryUser(user) {
    Sentry.setUser({
        id: user?.id,
        email: user?.email,
        username: user?.user_metadata?.full_name,
    });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
    Sentry.setUser(null);
}

/**
 * Manually capture errors
 */
export function captureError(error, context = {}) {
    Sentry.captureException(error, {
        tags: context.tags,
        extra: context.extra,
        level: context.level || 'error',
    });
}

/**
 * Manually capture messages
 */
export function captureMessage(message, level = 'info', context = {}) {
    Sentry.captureMessage(message, {
        level,
        tags: context.tags,
        extra: context.extra,
    });
}

// Export Sentry for direct access
export { Sentry };
