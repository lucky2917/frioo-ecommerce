const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.COMMIT_SHA ||
    null;

const buildInfo = {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    commit: commitSha,
    commitShort: commitSha ? commitSha.slice(0, 7) : null,
    branch: process.env.VERCEL_GIT_COMMIT_REF || null,
    deployedAt: process.env.VERCEL_DEPLOYMENT_CREATED_AT || null,
    startedAt: new Date().toISOString(),
    region: process.env.VERCEL_REGION || null,
    serverless: Boolean(process.env.VERCEL)
};

const getBuildInfo = () => ({ ...buildInfo });

const getRelease = () => buildInfo.commit || `frioo-api@${buildInfo.version}`;

module.exports = { getBuildInfo, getRelease };
