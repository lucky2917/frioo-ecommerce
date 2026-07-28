import { useEffect, useId, useRef } from 'react';
import './styles';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function AdminModal({ open, onClose, title, size = 'md', children, footer }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const getFocusable = () => Array.from(dialog?.querySelectorAll(FOCUSABLE) || []);

    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const trigger = triggerRef.current;
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div
        className={`adm-dialog adm-dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onClick={e => e.stopPropagation()}
      >
        <div className="adm-dialog-head">
          <h2 className="adm-dialog-title" id={titleId}>{title}</h2>
          <button className="adm-icon-btn" onClick={onClose} aria-label="Close dialog" ref={closeRef}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="adm-dialog-body">{children}</div>
        {footer && <div className="adm-dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}
