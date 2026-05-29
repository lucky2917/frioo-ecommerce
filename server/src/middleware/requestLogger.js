const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;

    res.on('finish', () => {
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
            ip: ip || req.socket?.remoteAddress,
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
    });

    next();
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

                logger.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, warningData);
            }
        });

        next();
    };
};

module.exports = {
    requestLogger,
    performanceLogger
};
