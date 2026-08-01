const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const RECOMMENDED_IN_PRODUCTION = ['SENTRY_DSN', 'PRODUCTION_URL'];

const isProduction = () => process.env.NODE_ENV === 'production';

const validateEnvironment = () => {
    const missing = REQUIRED.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        process.stderr.write(
            `CRITICAL: missing required environment variables: ${missing.join(', ')}\n`
        );
        process.exit(1);
    }

    const warnings = isProduction()
        ? RECOMMENDED_IN_PRODUCTION.filter((key) => !process.env[key])
        : [];

    return { warnings };
};

const describeEnvironment = () => ({
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    logLevel: process.env.LOG_LEVEL || 'info',
    sentry: Boolean(process.env.SENTRY_DSN),
    serverless: Boolean(process.env.VERCEL)
});

module.exports = { validateEnvironment, describeEnvironment, isProduction };
