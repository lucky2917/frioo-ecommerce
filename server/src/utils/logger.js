const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;
const isProduction = process.env.NODE_ENV === 'production';

const serializeError = (value) => ({
    name: value.name,
    message: value.message,
    stack: isProduction ? undefined : value.stack
});

const normalize = (data) => {
    if (data === undefined || data === null) return undefined;
    if (data instanceof Error) return { error: serializeError(data) };
    if (typeof data !== 'object') return { detail: data };

    const normalized = {};
    Object.entries(data).forEach(([key, value]) => {
        normalized[key] = value instanceof Error ? serializeError(value) : value;
    });
    return normalized;
};

function formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const payload = normalize(data);

    if (isProduction) {
        return JSON.stringify({
            level,
            time: timestamp,
            service: 'frioo-api',
            message,
            ...(payload || {})
        });
    }

    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    if (payload && Object.keys(payload).length > 0) {
        return `${prefix} ${message} ${JSON.stringify(payload)}`;
    }
    return `${prefix} ${message}`;
}

const write = (level, stream, message, data) => {
    if (currentLevel < LOG_LEVELS[level]) return;
    stream(formatMessage(level, message, data));
};

const logger = {
    error: (message, data) => write('error', console.error, message, data),
    warn: (message, data) => write('warn', console.warn, message, data),
    info: (message, data) => write('info', console.log, message, data),
    debug: (message, data) => write('debug', console.log, message, data)
};

module.exports = logger;
