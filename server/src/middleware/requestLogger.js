
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;

    const originalEnd = res.end;

    res.end = function (...args) {
        const duration = Date.now() - startTime;
        const { statusCode } = res;

        const logLevel = statusCode >= 500 ? 'error'
            : statusCode >= 400 ? 'warn'
                : 'info';

        const logData = {
            method,
            path: originalUrl,
            status: statusCode,
            duration: `${duration}ms`,
            ip: ip || req.connection?.remoteAddress,
            userAgent: headers['user-agent'],
            timestamp: new Date().toISOString()
        };

        if (req.user) {
            logData.userId = req.user.id;
        }

        const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

        if (logger[logLevel]) {
            logger[logLevel](message, logData);
        } else {
            logger.info(message, logData);
        }

        return originalEnd.apply(res, args);
    };

    next();
};

const errorLogger = (err, req, res, next) => {
    const { method, originalUrl, body, params, query } = req;

    const errorData = {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        method,
        path: originalUrl,
        body: sanitizeBody(body),
        params,
        query,
        timestamp: new Date().toISOString()
    };

    if (logger.error) {
        logger.error(`Error on ${method} ${originalUrl}`, errorData);
    } else {
        console.error(`Error on ${method} ${originalUrl}`, errorData);
    }

    next(err);
};

const performanceLogger = (threshold = 1000) => {
    return (req, res, next) => {
        const startTime = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - startTime;

            if (duration > threshold) {
                const warningData = {
                    method: req.method,
                    path: req.originalUrl,
                    duration: `${duration}ms`,
                    status: res.statusCode,
                    timestamp: new Date().toISOString()
                };

                if (logger.warn) {
                    logger.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, warningData);
                } else {
                    console.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, warningData);
                }
            }
        });

        next();
    };
};

const analyticsLogger = (req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode < 400) {
            const analyticsData = {
                endpoint: req.originalUrl.split('?')[0], // Remove query params
                method: req.method,
                status: res.statusCode,
                timestamp: new Date().toISOString(),
                userId: req.user?.id || 'anonymous'
            };

            if (logger.info && process.env.ENABLE_ANALYTICS === 'true') {
                logger.info('API Analytics', analyticsData);
            }
        }
    });

    next();
};

function sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '***REDACTED***';
        }
    }

    return sanitized;
}

module.exports = {
    requestLogger,
    errorLogger,
    performanceLogger,
    analyticsLogger
};
