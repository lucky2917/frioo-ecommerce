import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Use this for any user-generated content that will be displayed
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} dirty - Raw user input
 * @param {Object} options - DOMPurify configuration options
 * @returns {string} - Sanitized safe string
 */
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

/**
 * Sanitize and allow basic formatting tags (for rich text)
 * Use when you want to allow safe HTML like <b>, <i>, <a>
 * @param {string} dirty - Raw user input with HTML
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHTML = (dirty) => {
    if (!dirty || typeof dirty !== 'string') return '';

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target'],
        ALLOW_DATA_ATTR: false
    });
};

/**
 * Sanitize text for safe display (removes all HTML, returns plain text)
 * Use for displaying user notes, comments, names, etc.
 * @param {string} text - Raw user text
 * @returns {string} - Safe plain text
 */
export const sanitizeText = (text) => {
    return sanitize(text);
};

/**
 * Sanitize an object's string properties
 * Useful for sanitizing form data before saving/displaying
 * @param {Object} obj - Object with string properties
 * @param {string[]} fields - Array of field names to sanitize
 * @returns {Object} - Object with sanitized fields
 */
export const sanitizeObject = (obj, fields) => {
    const sanitized = { ...obj };

    fields.forEach(field => {
        if (sanitized[field] && typeof sanitized[field] === 'string') {
            sanitized[field] = sanitize(sanitized[field]);
        }
    });

    return sanitized;
};
