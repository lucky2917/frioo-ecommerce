/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern for CSRF protection
 * Industry standard used by Google, Facebook, and other enterprise apps
 */

const crypto = require('crypto');

/**
 * Generate a cryptographically secure CSRF token
 */
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF Token Generator Middleware
 * Sets a CSRF token cookie and makes it available in req.csrfToken()
 */
const csrfProtection = (req, res, next) => {
    // Generate or retrieve existing token from cookie
    let token = req.cookies?.csrfToken;

    if (!token) {
        token = generateToken();
        // Set secure cookie with CSRF token
        // SECURITY NOTE: httpOnly is intentionally FALSE for CSRF tokens
        // This is CORRECT and SECURE because:
        // 1. CSRF tokens MUST be accessible to JavaScript to include in requests
        // 2. CSRF uses "double-submit cookie" pattern (cookie + header validation)
        // 3. The token itself is not a session identifier (no auth privileges)
        // 4. SameSite:strict prevents cookie from being sent in cross-origin requests
        // Auth tokens (JWT) should have httpOnly:true, but CSRF tokens cannot.
        res.cookie('csrfToken', token, {
            httpOnly: false, // Must be accessible to JavaScript for form submission
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'strict', // Prevent CSRF by default
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
    }

    // Make token available to route handlers
    req.csrfToken = () => token;

    next();
};

/**
 * CSRF Token Validator Middleware
 * Validates CSRF token for state-changing operations (POST, PUT, DELETE, PATCH)
 * SKIPS validation for safe methods (GET, HEAD, OPTIONS)
 */
const validateCsrfToken = (req, res, next) => {
    // Skip validation for safe methods - CRITICAL FOR CLIENT ACCESS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const tokenFromCookie = req.cookies?.csrfToken;
    const tokenFromHeader = req.headers['x-csrf-token'] || req.body?._csrf;

    // Validate token presence
    if (!tokenFromCookie || !tokenFromHeader) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'CSRF token missing. Include X-CSRF-Token header or _csrf in body.',
                code: 403
            },
            data: null
        });
    }

    // Validate token match (constant-time comparison to prevent timing attacks)
    if (!secureCompare(tokenFromCookie, tokenFromHeader)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Invalid CSRF token',
                code: 403
            },
            data: null
        });
    }

    next();
};

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

/**
 * CSRF Token Endpoint
 * Provides CSRF token to frontend applications
 */
const getCsrfToken = (req, res) => {
    res.json({
        success: true,
        data: {
            csrfToken: req.csrfToken()
        },
        error: null
    });
};

module.exports = {
    csrfProtection,
    validateCsrfToken,
    getCsrfToken
};
