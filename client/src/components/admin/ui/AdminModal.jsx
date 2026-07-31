import { useId, useRef } from 'react';
import { useDialog } from '../../../hooks/useDialog';
import './styles';

export default function AdminModal({ open, onClose, title, size = 'md', children, footer }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();

  useDialog({ open, onClose, dialogRef, initialFocusRef: closeRef });

  if (!open) return null;

  return (
    <div className="adm-overlay fr-dialog-scrim" onClick={onClose}>
      <div
        className={`adm-dialog adm-dialog--${size} fr-dialog-panel`}
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
