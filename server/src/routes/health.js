const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../db');
const metrics = require('../services/metrics');
const { getBuildInfo } = require('../config/version');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness probe
 *     description: Returns 200 immediately if the Node.js process is running. Does not check external dependencies.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthLive'
 *             example:
 *               status: ok
 *               timestamp: '2025-05-29T10:00:00.000Z'
 *               uptime: 3600.5
 *               service: frioo-api
 *               version: '1.0.0'
 */
router.get('/health', (req, res) => {
    const build = getBuildInfo();

    res.status(200).json({
        status: 'ok',
        service: 'frioo-api',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: build.version,
        commit: build.commitShort,
        environment: build.environment,
        metrics: metrics.getSummary()
    });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Pings the Supabase database. Returns 200 only when the database is reachable. Use this for Kubernetes readiness gates.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready — database connection confirmed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthReady'
 *             example:
 *               status: ready
 *               checks:
 *                 server: ok
 *                 database: ok
 *                 timestamp: '2025-05-29T10:00:00.000Z'
 *               message: All systems operational
 *       503:
 *         description: Service unavailable — database unreachable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthReady'
 *             example:
 *               status: unavailable
 *               checks:
 *                 server: ok
 *                 database: error
 *                 timestamp: '2025-05-29T10:00:00.000Z'
 *               message: Database connection failed
 */
router.get('/health/ready', async (req, res) => {
    const checks = {
        server: 'ok',
        database: 'unknown',
        timestamp: new Date().toISOString()
    };

    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('id')
            .limit(1);

        if (error) {
            checks.database = 'error';
            checks.databaseError = error.message;

            return res.status(503).json({
                status: 'unavailable',
                checks,
                message: 'Database connection failed'
            });
        }

        checks.database = 'ok';

        return res.status(200).json({
            status: 'ready',
            checks,
            message: 'All systems operational'
        });

    } catch (err) {
        checks.database = 'error';
        checks.databaseError = err.message;

        return res.status(503).json({
            status: 'unavailable',
            checks,
            message: 'Service unavailable'
        });
    }
});

/**
 * @swagger
 * /health/status:
 *   get:
 *     summary: Detailed service status
 *     description: Returns Node.js process stats — memory usage, CPU time, uptime, and environment. Useful for ops dashboards.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Full service metadata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *             example:
 *               service: frioo-api
 *               version: '1.0.0'
 *               environment: production
 *               uptime: 7200.3
 *               timestamp: '2025-05-29T10:00:00.000Z'
 *               memory:
 *                 used: 48 MB
 *                 total: 128 MB
 *                 rss: 72 MB
 *               cpu:
 *                 user: 123456
 *                 system: 78910
 */
router.get('/health/status', (req, res) => {
    const build = getBuildInfo();

    res.status(200).json({
        service: 'frioo-api',
        version: build.version,
        commit: build.commitShort,
        environment: build.environment,
        timestamp: new Date().toISOString(),
        metrics: metrics.getSummary()
    });
});

module.exports = router;
