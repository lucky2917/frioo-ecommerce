// Enhanced toast notification utility
// Provides success, error, info, and warning toast messages

let toastTimeoutId = null;

/**
 * Shows a toast notification with different types
 * @param {string} message - The message to display
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - Duration in ms (default 3000)
 */
export const showToast = (message, type = 'info', duration = 3000) => {
    // Clear any existing toast
    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
        const existingToast = document.getElementById('app-toast');
        if (existingToast) {
            existingToast.remove();
        }
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = `toast toast-${type}`;

    // Icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    // Colors based on type
    const colors = {
        success: { bg: '#10b981', text: '#fff' },
        error: { bg: '#ef4444', text: '#fff' },
        warning: { bg: '#f59e0b', text: '#fff' },
        info: { bg: '#3b82f6', text: '#fff' }
    };

    const color = colors[type] || colors.info;

    toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 1.2rem;">${icons[type]}</span>
      <span style="font-size: 0.9rem; font-weight: 500;">${message}</span>
    </div>
  `;

    // Styles
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: color.bg,
        color: color.text,
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease',
        minWidth: '280px',
        maxWidth: '400px'
    });

    // Add to body
    document.body.appendChild(toast);

    // Auto remove
    toastTimeoutId = setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

// Add animation styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.innerHTML = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
    document.head.appendChild(style);
}
