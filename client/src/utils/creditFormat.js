export const ENTRY_TYPES = [
    'PLAN_ACTIVATION', 'BONUS_GRANT', 'ORDER_DEBIT', 'REFUND',
    'EXPIRY', 'ADJUSTMENT', 'EXTENSION', 'REVERSAL'
];

export const LOT_ORIGINS = [
    'plan', 'grace', 'bonus', 'promotional', 'referral', 'cashback', 'birthday', 'manual'
];

const ENTRY_LABELS = {
    PLAN_ACTIVATION: 'Plan activated',
    BONUS_GRANT: 'Credits granted',
    ORDER_DEBIT: 'Spent on order',
    REFUND: 'Refunded',
    EXPIRY: 'Expired',
    ADJUSTMENT: 'Manual adjustment',
    EXTENSION: 'Validity extended',
    REVERSAL: 'Reversed'
};

const ENTRY_TONES = {
    PLAN_ACTIVATION: 'success',
    BONUS_GRANT: 'success',
    ORDER_DEBIT: 'brand',
    REFUND: 'success',
    EXPIRY: 'danger',
    ADJUSTMENT: 'warning',
    EXTENSION: 'default',
    REVERSAL: 'danger'
};

export const entryLabel = (type) => ENTRY_LABELS[type] || type;
export const entryTone = (type) => ENTRY_TONES[type] || 'default';

export const rupees = (paise) => {
    const amount = Number(paise || 0) / 100;
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const signedRupees = (paise) => {
    const value = Number(paise || 0);
    if (value === 0) return `₹0`;
    return `${value > 0 ? '+' : '−'}₹${rupees(Math.abs(value))}`;
};

export const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
};

export const toDateInputValue = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
};

export const daysUntil = (value) => {
    if (!value) return 0;
    const diff = new Date(value).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
};

export const lotStatusTone = (status, daysRemaining) => {
    if (status === 'expired' || status === 'reversed') return 'danger';
    if (status === 'exhausted') return 'default';
    if (daysRemaining <= 3) return 'danger';
    if (daysRemaining <= 7) return 'warning';
    return 'success';
};

export const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
