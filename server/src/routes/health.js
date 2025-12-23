/**
 * Health Check Route
 * Kubernetes-compatible liveness and readiness probes
 */

const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../db');

/**
 * Liveness Probe - Is the application alive?
 * Returns 200 if server process is running
 * Used by: Kubernetes, Docker, monitoring systems
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'frioo-api',
        version: process.env.npm_package_version || '1.0.0'
    });
});

/**
 * Readiness Probe - Is the application ready to serve traffic?
 * Checks critical dependencies (database, etc.)
 * Returns 200 only if all systems operational
 * Used by: Load balancers, Kubernetes readiness checks
 */
router.get('/health/ready', async (req, res) => {
    const checks = {
        server: 'ok',
        database: 'unknown',
        timestamp: new Date().toISOString()
    };

    try {
        // Check database connectivity
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

        // All checks passed
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
 * Detailed Status (Optional - for debugging)
 * More verbose health information
 */
router.get('/health/status', (req, res) => {
    const status = {
        service: 'frioo-api',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
        },
        cpu: process.cpuUsage()
    };

    res.status(200).json(status);
});

module.exports = router;
