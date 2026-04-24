const sendSuccess = (res, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        error: null
    });
};

const sendError = (res, message, statusCode = 500, details = null) => {
    const response = {
        success: false,
        data: null,
        error: {
            message,
            code: statusCode
        }
    };

    if (details) {
        response.error.details = details;
    }

    return res.status(statusCode).json(response);
};

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

const sendNotFound = (res, resource = 'Resource') => {
    return sendError(res, `${resource} not found`, 404);
};

const sendUnauthorized = (res, message = 'Unauthorized access') => {
    return sendError(res, message, 401);
};

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
