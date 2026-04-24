
import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;

export const logger = {
    info: (message, ...args) => {
        if (isDev) {
            console.log(message, ...args);
        }
    },

    warn: (message, ...args) => {
        if (isDev) {
            console.warn(message, ...args);
        }
    },

    error: (message, ...args) => {
        if (isDev) {
            console.error(message, ...args);
        }
        if (import.meta.env.PROD) {
            Sentry.captureException(new Error(message), {
                extra: { args }
            });
        }
    },

    debug: (message, ...args) => {
        if (isDev) {
            console.debug(message, ...args);
        }
    }
};
