/**
 * Request Logging Middleware
 * Logs all API requests with timing, status codes, and error tracking
 */

const logger = require('../utils/logger');

/**
 * HTTP Request Logger
 * Logs method, path, status, response time, and errors
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;

    // Store original end function
    const originalEnd = res.end;

    // Override res.end to capture response
    res.end = function (...args) {
        const duration = Date.now() - startTime;
        const { statusCode } = res;

        // Determine log level based on status code
        const logLevel = statusCode >= 500 ? 'error'
            : statusCode >= 400 ? 'warn'
                : 'info';

        // Build log object
        const logData = {
            method,
            path: originalUrl,
            status: statusCode,
            duration: `${duration}ms`,
            ip: ip || req.connection?.remoteAddress,
            userAgent: headers['user-agent'],
            timestamp: new Date().toISOString()
        };

        // Add user context if authenticated
        if (req.user) {
            logData.userId = req.user.id;
        }

        // Log the request
        const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

        if (logger[logLevel]) {
            logger[logLevel](message, logData);
        } else {
            // Fallback to logger.info if specific level not available
            logger.info(message, logData);
        }

        // Call original end function
        return originalEnd.apply(res, args);
    };

    next();
};

/**
 * Error Request Logger
 * Logs requests that result in errors with additional context
 */
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

/**
 * Performance Logger
 * Logs slow requests (>1000ms) for performance monitoring
 */
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

/**
 * API Analytics Logger
 * Tracks API usage patterns for analytics
 */
const analyticsLogger = (req, res, next) => {
    res.on('finish', () => {
        // Only log successful API calls
        if (res.statusCode < 400) {
            const analyticsData = {
                endpoint: req.originalUrl.split('?')[0], // Remove query params
                method: req.method,
                status: res.statusCode,
                timestamp: new Date().toISOString(),
                userId: req.user?.id || 'anonymous'
            };

            // TODO: Send to analytics service (Google Analytics, Mixpanel, etc.)
            // For now, just log to info
            if (logger.info && process.env.ENABLE_ANALYTICS === 'true') {
                logger.info('API Analytics', analyticsData);
            }
        }
    });

    next();
};

/**
 * Sanitize request body to avoid logging sensitive data
 */
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
