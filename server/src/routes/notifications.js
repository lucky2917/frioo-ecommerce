const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responses');
const logger = require('../utils/logger');
const notifications = require('../services/notifications');

const timingSafeEqual = (a, b) => {
    const left = Buffer.from(String(a || ''));
    const right = Buffer.from(String(b || ''));
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
};

/**
 * @swagger
 * /api/notifications/public-key:
 *   get:
 *     summary: VAPID public key for push subscription
 *     tags: [Notifications]
 */
router.get('/public-key', (_req, res) => {
    const key = notifications.getPublicKey();
    if (!key) return sendError(res, 'Push notifications are not configured', 503);
    return sendSuccess(res, { publicKey: key });
});

/**
 * @swagger
 * /api/notifications/dispatch:
 *   post:
 *     summary: Internal notification dispatch
 *     description: |
 *       Called by the database through pg_net when a notification event is
 *       queued. Authenticated with a shared secret, never by a user session.
 *     tags: [Notifications]
 */
router.post('/dispatch', async (req, res) => {
    const expected = process.env.NOTIFICATION_DISPATCH_SECRET;

    if (!expected) return sendError(res, 'Dispatch is not configured', 503);
    if (!timingSafeEqual(req.headers['x-notification-secret'], expected)) {
        logger.warn('Rejected notification dispatch', { requestId: req.id });
        return sendError(res, 'Not allowed', 403);
    }

    const eventId = Number(req.body?.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
        return sendError(res, 'A valid eventId is required', 400);
    }

    try {
        const result = await notifications.processEvent(eventId);
        return sendSuccess(res, { eventId, ...result });
    } catch (err) {
        logger.error('Notification dispatch failed', { requestId: req.id, eventId, error: err });
        return sendError(res, 'Dispatch failed', 500);
    }
});

router.use(requireAuth);

/**
 * @swagger
 * /api/notifications/subscriptions:
 *   get:
 *     summary: List this user's push subscriptions
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Register a push subscription for this device
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Remove a push subscription
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/subscriptions', async (req, res) => {
    try {
        const items = await notifications.listSubscriptions(req.user.id);
        return sendSuccess(res, { subscriptions: items });
    } catch (err) {
        logger.error('Could not list push subscriptions', { requestId: req.id, error: err });
        return sendError(res, 'Could not load your devices', 500);
    }
});

router.post('/subscriptions',
    body('subscription').isObject(),
    body('subscription.endpoint').isString().isURL({ protocols: ['https'], require_protocol: true }).isLength({ max: 1000 }),
    body('subscription.keys.p256dh').isString().isLength({ min: 10, max: 300 }),
    body('subscription.keys.auth').isString().isLength({ min: 10, max: 300 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendValidationError(res, errors);

        try {
            await notifications.saveSubscription(req.user.id, req.body.subscription, req.headers['user-agent']);
            return sendSuccess(res, { registered: true }, 201);
        } catch (err) {
            if (err.status === 400) return sendError(res, err.message, 400);
            logger.error('Could not save push subscription', { requestId: req.id, error: err });
            return sendError(res, 'Could not register this device', 500);
        }
    }
);

router.delete('/subscriptions',
    body('endpoint').isString().isLength({ max: 1000 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendValidationError(res, errors);

        try {
            await notifications.deleteSubscription(req.user.id, req.body.endpoint);
            return sendSuccess(res, { removed: true });
        } catch (err) {
            logger.error('Could not remove push subscription', { requestId: req.id, error: err });
            return sendError(res, 'Could not remove this device', 500);
        }
    }
);

module.exports = router;
