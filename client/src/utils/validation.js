// Form validation utilities

/**
 * Validates Indian phone numbers
 * Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, or XXXXXXXXXX (10 digits)
 */
export const validatePhoneNumber = (phone) => {
    if (!phone || typeof phone !== 'string') return false;

    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');

    // Check for valid Indian phone number patterns
    const patterns = [
        /^\+91[6-9]\d{9}$/,  // +91XXXXXXXXXX
        /^91[6-9]\d{9}$/,     // 91XXXXXXXXXX
        /^[6-9]\d{9}$/        // XXXXXXXXXX (10 digits starting with 6-9)
    ];

    return patterns.some(pattern => pattern.test(cleaned));
};

/**
 * Validates address - must be at least 10 characters
 */
export const validateAddress = (address) => {
    if (!address || typeof address !== 'string') return false;
    const trimmed = address.trim();
    return trimmed.length >= 10;
};

/**
 * Validates email format
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates name - at least 2 characters, letters only
 */
export const validateName = (name) => {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && /^[a-zA-Z\s]+$/.test(trimmed);
};

/**
 * Formats phone number for display
 * Converts to +91 XXXXX XXXXX format
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return '';

    const cleaned = phone.replace(/[\s-]/g, '');

    // Add +91 prefix if not present
    let formatted = cleaned;
    if (!cleaned.startsWith('+91') && !cleaned.startsWith('91')) {
        formatted = '+91' + cleaned;
    } else if (cleaned.startsWith('91')) {
        formatted = '+' + cleaned;
    }

    // Format as +91 XXXXX XXXXX
    if (formatted.length === 13) {
        return `${formatted.slice(0, 3)} ${formatted.slice(3, 8)} ${formatted.slice(8)}`;
    }

    return formatted;
};

/**
 * Sanitizes user input to prevent XSS
 */
export const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') return '';

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};
