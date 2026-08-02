import { useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useDialog } from '../../hooks/useDialog';
import { logger } from '../../utils/logger';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export default function UpdatePrompt() {
  const [applying, setApplying] = useState(false);
  const sheetRef = useRef(null);
  const updateButtonRef = useRef(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(url, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch((err) => logger.warn('Update check failed', err));
      }, UPDATE_CHECK_INTERVAL_MS);
    },
    onRegisterError(error) {
      logger.error('Service worker registration failed:', error);
    }
  });

  const close = () => setNeedRefresh(false);

  useDialog({ open: needRefresh, onClose: close, dialogRef: sheetRef, initialFocusRef: updateButtonRef });

  if (!needRefresh) return null;

  const applyUpdate = async () => {
    if (applying) return;
    setApplying(true);
    try {
      await updateServiceWorker(true);
    } catch (err) {
      logger.error('Could not apply update:', err);
      setApplying(false);
    }
  };

  return (
    <div className="fr-update-scrim fr-dialog-scrim" onClick={close}>
      <div
        className="fr-update fr-dialog-panel"
        ref={sheetRef}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fr-update-title"
      >
        <span className="fr-update-mark" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </span>

        <div className="fr-update-copy">
          <h2 className="fr-update-title" id="fr-update-title">New version available</h2>
          <p className="fr-update-text">Update to get the latest prices and products.</p>
        </div>

        <div className="fr-update-actions">
          <button type="button" className="fr-update-now" ref={updateButtonRef} onClick={applyUpdate} disabled={applying} aria-busy={applying}>
            {applying ? 'Updating…' : 'Update now'}
          </button>
          <button type="button" className="fr-update-later" onClick={close} disabled={applying}>Later</button>
        </div>
      </div>

      <style>{`
        .fr-update-scrim { position: fixed; inset: 0; z-index: var(--fr-z-modal); background: var(--fr-scrim); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; padding: var(--fr-s4); }
        .fr-update { width: 100%; max-width: 460px; display: flex; flex-direction: column; gap: var(--fr-s4); padding: var(--fr-s6); padding-bottom: max(var(--fr-s6), calc(var(--fr-s4) + env(safe-area-inset-bottom))); background: var(--fr-surface); border-radius: var(--fr-r-surface); box-shadow: var(--fr-elev-3); }
        .fr-update-mark { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--fr-r-pill); background: var(--fr-brand-tint); color: var(--fr-brand); }
        .fr-update-copy { display: flex; flex-direction: column; gap: var(--fr-s2); }
        .fr-update-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0; }
        .fr-update-text { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }
        .fr-update-actions { display: flex; gap: var(--fr-s3); }
        .fr-update-now { flex: 1; min-height: 48px; padding: 0 var(--fr-s5); background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-control); cursor: pointer; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-update-now:hover:not(:disabled) { background: var(--fr-brand-press); }
        .fr-update-now:disabled { opacity: 0.7; cursor: default; }
        .fr-update-later { min-height: 48px; padding: 0 var(--fr-s5); background: transparent; color: var(--fr-text-2); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; }
        .fr-update-later:hover:not(:disabled) { color: var(--fr-text); border-color: var(--fr-brand); }
        .fr-update-now:focus-visible, .fr-update-later:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

        @media (prefers-reduced-motion: no-preference) {
          .fr-update { animation: fr-update-in var(--fr-dur-expressive) var(--fr-ease-settle); }
        }
        @keyframes fr-update-in { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .fr-update-now { transition: none; } }

        @media (min-width: 640px) {
          .fr-update-scrim { align-items: center; }
        }
      `}</style>
    </div>
  );
}
