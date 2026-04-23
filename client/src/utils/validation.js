export const validatePhoneNumber = (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    const cleaned = phone.replace(/[\s-]/g, '');
    const patterns = [
        /^\+91[6-9]\d{9}$/,
        /^91[6-9]\d{9}$/,
        /^[6-9]\d{9}$/
    ];
    return patterns.some(pattern => pattern.test(cleaned));
};

export const validateAddress = (address) => {
    if (!address || typeof address !== 'string') return false;
    return address.trim().length >= 10;
};

export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateName = (name) => {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && /^[a-zA-Z\s]+$/.test(trimmed);
};

export const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/[\s-]/g, '');
    let formatted = cleaned;
    if (!cleaned.startsWith('+91') && !cleaned.startsWith('91')) {
        formatted = '+91' + cleaned;
    } else if (cleaned.startsWith('91')) {
        formatted = '+' + cleaned;
    }
    if (formatted.length === 13) {
        return `${formatted.slice(0, 3)} ${formatted.slice(3, 8)} ${formatted.slice(8)}`;
    }
    return formatted;
};

export const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') return '';
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};
