
const crypto = require('crypto');

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

const csrfProtection = (req, res, next) => {
    let token = req.cookies?.csrfToken;

    if (!token) {
        token = generateToken();
        res.cookie('csrfToken', token, {
            httpOnly: false, // Must be accessible to JavaScript for form submission
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-origin in production
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
    }

    req.csrfToken = () => token;

    next();
};

const validateCsrfToken = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const tokenFromCookie = req.cookies?.csrfToken;
    const tokenFromHeader = req.headers['x-csrf-token'] || req.body?._csrf;

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
