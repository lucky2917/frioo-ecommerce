/**
 * Standardized API Response Utilities
 * Provides consistent response format across all API endpoints
 */

/**
 * Success response with data
 * @param {object} res - Express response object
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        error: null
    });
};

/**
 * Error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {object} details - Optional error details (e.g., validation errors)
 */
const sendError = (res, message, statusCode = 500, details = null) => {
    const response = {
        success: false,
        data: null,
        error: {
            message,
            code: statusCode
        }
    };

    // Add validation details if present
    if (details) {
        response.error.details = details;
    }

    return res.status(statusCode).json(response);
};

/**
 * Validation error response (from express-validator)
 * @param {object} res - Express response object
 * @param {array} errors - Array of validation errors from express-validator
 */
const sendValidationError = (res, errors) => {
    return sendError(
        res,
        'Validation failed',
        400,
        errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }))
    );
};

/**
 * Not found error
 * @param {object} res - Express response object
 * @param {string} resource - Resource that was not found
 */
const sendNotFound = (res, resource = 'Resource') => {
    return sendError(res, `${resource} not found`, 404);
};

/**
 * Unauthorized error
 * @param {object} res - Express response object
 * @param {string} message - Optional custom message
 */
const sendUnauthorized = (res, message = 'Unauthorized access') => {
    return sendError(res, message, 401);
};

/**
 * Forbidden error
 * @param {object} res - Express response object
 * @param {string} message - Optional custom message
 */
const sendForbidden = (res, message = 'Forbidden') => {
    return sendError(res, message, 403);
};

module.exports = {
    sendSuccess,
    sendError,
    sendValidationError,
    sendNotFound,
    sendUnauthorized,
    sendForbidden
};
