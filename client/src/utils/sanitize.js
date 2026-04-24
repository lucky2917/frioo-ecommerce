import DOMPurify from 'dompurify';


export const sanitize = (dirty, options = {}) => {
    if (!dirty || typeof dirty !== 'string') return '';

    const defaultOptions = {
        ALLOWED_TAGS: [], // Strip all HTML tags by default (plain text only)
        ALLOWED_ATTR: [], // No attributes allowed
        KEEP_CONTENT: true, // Keep text content even if tags are removed
        ...options
    };

    return DOMPurify.sanitize(dirty, defaultOptions);
};

export const sanitizeHTML = (dirty) => {
    if (!dirty || typeof dirty !== 'string') return '';

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target'],
        ALLOW_DATA_ATTR: false
    });
};

export const sanitizeText = (text) => {
    return sanitize(text);
};

export const sanitizeObject = (obj, fields) => {
    const sanitized = { ...obj };

    fields.forEach(field => {
        if (sanitized[field] && typeof sanitized[field] === 'string') {
            sanitized[field] = sanitize(sanitized[field]);
        }
    });

    return sanitized;
};
