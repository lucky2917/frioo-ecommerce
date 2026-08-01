const express = require('express');
const router = express.Router();
const { fetchStoreSettings, getStoreAvailability } = require('../services/storeSettings');
const { sendSuccess, sendError } = require('../utils/responses');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Public store settings
 *     description: |
 *       Opening state, opening hours, unavailable categories and delivery pricing.
 *       The storefront reads this to disable ordering and to show the delivery fee.
 *       All of it is re-checked server side when an order is placed.
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Current store settings
 */
router.get('/', async (_req, res) => {
    try {
        const settings = await fetchStoreSettings();
        const availability = getStoreAvailability(settings);

        return sendSuccess(res, {
            settings: {
                isOpen: Boolean(settings.is_open),
                closedMessage: settings.closed_message || null,
                unavailableCategories: settings.unavailable_categories || [],
                opensAtHour: settings.opens_at_hour,
                closesAtHour: settings.closes_at_hour,
                deliveryFee: settings.delivery_fee_cents / 100,
                freeDeliveryThreshold: settings.free_delivery_threshold_cents / 100,
                accepting: availability.accepting,
                reason: availability.reason
            }
        });
    } catch (err) {
        logger.error('Failed to read store settings:', err);
        return sendError(res, 'Could not load store settings', 500);
    }
});

module.exports = router;
