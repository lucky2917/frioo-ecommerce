/**
 * Server-side Logger Utility
 * Simple console wrapper with log levels for better debugging
 */

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

/**
 * Format log message with timestamp and level
 */
function formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data && Object.keys(data).length > 0) {
        return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    return `${prefix} ${message}`;
}

/**
 * Logger object with level methods
 */
const logger = {
    error: (message, data) => {
        if (currentLevel >= LOG_LEVELS.error) {
            console.error(formatMessage('error', message, data));
        }
    },

    warn: (message, data) => {
        if (currentLevel >= LOG_LEVELS.warn) {
            console.warn(formatMessage('warn', message, data));
        }
    },

    info: (message, data) => {
        if (currentLevel >= LOG_LEVELS.info) {
            console.log(formatMessage('info', message, data));
        }
    },

    debug: (message, data) => {
        if (currentLevel >= LOG_LEVELS.debug) {
            console.log(formatMessage('debug', message, data));
        }
    }
};

module.exports = logger;
