const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

const REQUEST_ID_HEADER = 'x-request-id';
const MAX_INBOUND_ID_LENGTH = 64;
const SAFE_ID = /^[A-Za-z0-9._-]+$/;

const acceptInboundId = (value) =>
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_INBOUND_ID_LENGTH &&
    SAFE_ID.test(value);

const requestContext = (req, res, next) => {
    const inbound = req.headers[REQUEST_ID_HEADER];
    req.id = acceptInboundId(inbound) ? inbound : randomUUID();
    req.startedAt = process.hrtime.bigint();

    res.setHeader('X-Request-Id', req.id);

    const originalWriteHead = res.writeHead;
    res.writeHead = function patchedWriteHead(...args) {
        const durationMs = Number(process.hrtime.bigint() - req.startedAt) / 1e6;
        if (!this.headersSent) {
            this.setHeader('X-Response-Time', `${Math.round(durationMs * 100) / 100}ms`);
        }
        return originalWriteHead.apply(this, args);
    };

    next();
};

const requestLogger = (slowThresholdMs = 1000) => (req, res, next) => {
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - req.startedAt) / 1e6;
        const rounded = Math.round(durationMs * 100) / 100;
        const { statusCode } = res;

        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

        logger[level](`${req.method} ${req.originalUrl} ${statusCode}`, {
            requestId: req.id,
            method: req.method,
            path: req.originalUrl,
            status: statusCode,
            durationMs: rounded,
            ip: req.ip || req.socket?.remoteAddress,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id,
            slow: rounded > slowThresholdMs || undefined
        });
    });

    next();
};

module.exports = { requestContext, requestLogger, REQUEST_ID_HEADER };
