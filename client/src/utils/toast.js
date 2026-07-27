let toastTimeoutId = null;

export const showToast = (message, type = 'info', duration = 3000) => {
    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
        const existingToast = document.getElementById('app-toast');
        if (existingToast) {
            existingToast.remove();
        }
    }

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

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
      <span class="toast-message" style="font-size: 0.9rem; font-weight: 500;"></span>
    </div>
  `;

    const messageSpan = toast.querySelector('.toast-message');
    if (messageSpan) messageSpan.textContent = message;

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

    document.body.appendChild(toast);

    toastTimeoutId = setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

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
