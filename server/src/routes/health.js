const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../db');

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'frioo-api',
        version: process.env.npm_package_version || '1.0.0'
    });
});

router.get('/health/ready', async (req, res) => {
    const checks = { server: 'ok', database: 'unknown', timestamp: new Date().toISOString() };

    try {
        const { error } = await supabaseAdmin.from('products').select('id').limit(1);

        if (error) {
            checks.database = 'error';
            checks.databaseError = error.message;
            return res.status(503).json({ status: 'unavailable', checks, message: 'Database connection failed' });
        }

        checks.database = 'ok';
        return res.status(200).json({ status: 'ready', checks, message: 'All systems operational' });
    } catch (err) {
        checks.database = 'error';
        checks.databaseError = err.message;
        return res.status(503).json({ status: 'unavailable', checks, message: 'Service unavailable' });
    }
});

router.get('/health/status', (req, res) => {
    res.status(200).json({
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
    });
});

module.exports = router;
