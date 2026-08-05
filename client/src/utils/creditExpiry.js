export const expiryNotice = (expiresAt) => {
    if (!expiresAt) return null;

    const millis = new Date(expiresAt).getTime() - Date.now();
    if (Number.isNaN(millis)) return null;

    if (millis <= 0) return { tone: 'past', label: 'Expired', urgent: false };

    const days = Math.ceil(millis / 86400000);

    if (days <= 1) return { tone: 'soon', label: 'Expires today', urgent: true };
    if (days === 2) return { tone: 'soon', label: 'Expires tomorrow', urgent: true };
    if (days <= 3) return { tone: 'soon', label: `Expires in ${days} days`, urgent: true };
    if (days <= 7) return { tone: 'near', label: `Expires in ${days} days`, urgent: false };

    return { tone: 'calm', label: `${days} days left`, urgent: false };
};

export const monthKey = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Earlier';
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export const groupByMonth = (rows) => {
    const groups = new Map();

    for (const row of rows) {
        const key = monthKey(row.created_at);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
    }

    return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }));
};

const ENTRY_COPY = {
    PLAN_ACTIVATION: { label: 'Plan activated', hint: 'Credits added to your account' },
    BONUS_GRANT: { label: 'Credits added', hint: 'Bonus credits from Frioo' },
    ORDER_DEBIT: { label: 'Used on order', hint: 'Paid with Frioo Credits' },
    REFUND: { label: 'Refund received', hint: 'Returned to your credits' },
    EXPIRY: { label: 'Credits expired', hint: 'Unused credits reached their expiry' },
    ADJUSTMENT: { label: 'Adjustment', hint: 'Adjusted by the Frioo team' },
    EXTENSION: { label: 'Validity extended', hint: 'Your expiry date moved later' },
    REVERSAL: { label: 'Correction', hint: 'A previous entry was reversed' }
};

export const entryCopy = (type) => ENTRY_COPY[type] || { label: type, hint: '' };

export const originLabel = (origin, planName) => {
    if (planName) return planName;
    const labels = {
        grace: 'Refund credits',
        bonus: 'Bonus credits',
        promotional: 'Promotional credits',
        referral: 'Referral credits',
        cashback: 'Cashback',
        birthday: 'Birthday credits',
        manual: 'Added by Frioo'
    };
    return labels[origin] || 'Credits';
};
