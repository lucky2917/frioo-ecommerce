import { useState, useRef } from 'react';
import { useDialog } from '../../hooks/useDialog';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

const IosStep = ({ index, children, icon }) => (
  <li className="fr-ios-step">
    <span className="fr-ios-num">{index}</span>
    <span className="fr-ios-text">{children}</span>
    {icon}
  </li>
);

export default function InstallPrompt() {
  const { eligible, isIos, canPrompt, justInstalled, promptInstall, dismiss, acknowledgeInstall } = useInstallPrompt();
  const [showIosGuide, setShowIosGuide] = useState(false);

  const guideRef = useRef(null);
  const guideCloseRef = useRef(null);
  const doneRef = useRef(null);
  const doneCloseRef = useRef(null);

  useDialog({ open: showIosGuide, onClose: () => setShowIosGuide(false), dialogRef: guideRef, initialFocusRef: guideCloseRef });
  useDialog({ open: justInstalled, onClose: acknowledgeInstall, dialogRef: doneRef, initialFocusRef: doneCloseRef });

  const handleInstall = async () => {
    if (isIos && !canPrompt) {
      setShowIosGuide(true);
      return;
    }
    await promptInstall();
  };

  return (
    <>
      {eligible && (
        <div className="fr-install" role="region" aria-label="Install Frioo">
          <span className="fr-install-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </span>

          <span className="fr-install-copy">
            <strong>Add Frioo to your Home Screen</strong>
            <span>Open the shop in one tap, like an app.</span>
          </span>

          <span className="fr-install-actions">
            <button type="button" className="fr-install-go" onClick={handleInstall}>Install</button>
            <button type="button" className="fr-install-later" onClick={dismiss}>Not now</button>
          </span>
        </div>
      )}

      {showIosGuide && (
        <div className="fr-pwa-scrim fr-dialog-scrim" onClick={() => setShowIosGuide(false)}>
          <div className="fr-pwa-sheet fr-dialog-panel" ref={guideRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fr-ios-title">
            <div className="fr-pwa-head">
              <h2 className="fr-pwa-title" id="fr-ios-title">Add Frioo to your Home Screen</h2>
              <button className="fr-pwa-close" ref={guideCloseRef} onClick={() => setShowIosGuide(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <p className="fr-pwa-lead">Three steps in Safari, then Frioo sits with your other apps.</p>

            <ol className="fr-ios-steps">
              <IosStep index="1" icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4" /><polyline points="8 8 12 4 16 8" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
              }>Tap the Share button in the Safari toolbar</IosStep>
              <IosStep index="2" icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
              }>Scroll down and choose <strong>Add to Home Screen</strong></IosStep>
              <IosStep index="3" icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              }>Tap <strong>Add</strong> in the top corner</IosStep>
            </ol>

            <button type="button" className="fr-pwa-primary" onClick={() => { setShowIosGuide(false); dismiss(); }}>Got it</button>
          </div>
        </div>
      )}

      {justInstalled && (
        <div className="fr-pwa-scrim fr-dialog-scrim" onClick={acknowledgeInstall}>
          <div className="fr-pwa-sheet fr-dialog-panel" ref={doneRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fr-done-title">
            <span className="fr-pwa-done-mark" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <h2 className="fr-pwa-title fr-pwa-title-center" id="fr-done-title">Frioo is now installed</h2>
            <p className="fr-pwa-lead fr-pwa-lead-center">You can launch it from your Home Screen.</p>
            <button type="button" className="fr-pwa-primary" ref={doneCloseRef} onClick={acknowledgeInstall}>Continue shopping</button>
          </div>
        </div>
      )}

      <style>{`
        .fr-install { position: fixed; z-index: var(--fr-z-cta); left: max(var(--fr-s4), env(safe-area-inset-left)); right: max(var(--fr-s4), env(safe-area-inset-right)); bottom: calc(var(--fr-s4) + env(safe-area-inset-bottom)); max-width: 520px; margin-inline: auto; display: flex; align-items: center; gap: var(--fr-s4); padding: var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-surface); box-shadow: var(--fr-elev-3); }
        .fr-install-mark { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; border-radius: var(--fr-r-pill); background: var(--fr-brand-tint); color: var(--fr-brand); }
        .fr-install-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
        .fr-install-copy strong { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); }
        .fr-install-copy span { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); }
        .fr-install-actions { display: flex; align-items: center; gap: var(--fr-s2); flex-shrink: 0; }
        .fr-install-go { min-height: 44px; padding: 0 var(--fr-s5); background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-control); cursor: pointer; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-install-go:hover { background: var(--fr-brand-press); }
        .fr-install-later { min-height: 44px; padding: 0 var(--fr-s3); background: none; border: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text-2); cursor: pointer; }
        .fr-install-later:hover { color: var(--fr-text); }
        .fr-install-go:focus-visible, .fr-install-later:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

        .fr-pwa-scrim { position: fixed; inset: 0; z-index: var(--fr-z-modal); background: var(--fr-scrim); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: var(--fr-s5); }
        .fr-pwa-sheet { width: 100%; max-width: 420px; background: var(--fr-surface); border-radius: var(--fr-r-surface); box-shadow: var(--fr-elev-3); padding: var(--fr-s6); padding-bottom: max(var(--fr-s6), env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: var(--fr-s4); }
        .fr-pwa-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--fr-s4); }
        .fr-pwa-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0; }
        .fr-pwa-title-center { text-align: center; }
        .fr-pwa-close { width: 44px; height: 44px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: var(--fr-text-2); cursor: pointer; border-radius: var(--fr-r-control); }
        .fr-pwa-close:hover { background: var(--fr-surface-2); }
        .fr-pwa-close:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-pwa-lead { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }
        .fr-pwa-lead-center { text-align: center; }
        .fr-pwa-primary { min-height: 48px; background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-control); cursor: pointer; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-pwa-primary:hover { background: var(--fr-brand-press); }
        .fr-pwa-primary:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-pwa-done-mark { align-self: center; display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: var(--fr-r-pill); background: var(--fr-brand-tint); color: var(--fr-brand); }

        .fr-ios-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--fr-s3); }
        .fr-ios-step { display: flex; align-items: center; gap: var(--fr-s3); padding: var(--fr-s3) var(--fr-s4); background: var(--fr-surface-2); border-radius: var(--fr-r-card); }
        .fr-ios-num { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 26px; height: 26px; border-radius: var(--fr-r-pill); background: var(--fr-brand); color: var(--fr-on-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-bold); }
        .fr-ios-text { flex: 1; min-width: 0; font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text); }
        .fr-ios-text strong { font-weight: var(--fr-fw-bold); }
        .fr-ios-step > svg { flex-shrink: 0; color: var(--fr-brand); }

        @media (prefers-reduced-motion: no-preference) {
          .fr-install { animation: fr-install-in var(--fr-dur-expressive) var(--fr-ease-settle); }
        }
        @keyframes fr-install-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .fr-install-go, .fr-pwa-primary { transition: none; } }

        @media (max-width: 560px) {
          .fr-install { flex-wrap: wrap; }
          .fr-install-copy { flex-basis: calc(100% - 60px); }
          .fr-install-actions { flex-basis: 100%; justify-content: flex-end; }
          .fr-install-go { flex: 1; }
        }
      `}</style>
    </>
  );
}
