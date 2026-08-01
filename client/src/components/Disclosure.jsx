import { useId, useState } from 'react';

export default function Disclosure({ summary, children, defaultOpen = false, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `${id}-panel`;
  const triggerId = `${id}-trigger`;

  return (
    <div className={`fr-disclosure${open ? ' fr-disclosure-open' : ''} ${className}`.trim()}>
      <button
        type="button"
        className="fr-disclosure-trigger"
        id={triggerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="fr-disclosure-summary">{summary}</span>
        <span className="fr-disclosure-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </button>

      <div className="fr-disclosure-panel" id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
        <div className="fr-disclosure-content">{children}</div>
      </div>

      <style>{`
        .fr-disclosure { border-bottom: 1px solid var(--fr-line); }
        .fr-disclosure-trigger { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s4); width: 100%; min-height: 44px; padding: var(--fr-s4) 0; background: none; border: none; text-align: left; color: var(--fr-text); cursor: pointer; }
        .fr-disclosure-summary { font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); }
        .fr-disclosure-trigger:hover .fr-disclosure-summary { color: var(--fr-brand); }
        .fr-disclosure-trigger:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }
        .fr-disclosure-mark { display: flex; flex-shrink: 0; color: var(--fr-text-3); }
        .fr-disclosure-open .fr-disclosure-mark { transform: rotate(180deg); color: var(--fr-brand); }
        .fr-disclosure-content { padding: 0 0 var(--fr-s4); font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-relaxed); color: var(--fr-text-2); max-width: var(--fr-measure); }

        @media (prefers-reduced-motion: no-preference) {
          .fr-disclosure-mark { transition: transform var(--fr-dur-quick) var(--fr-ease-standard); }
          .fr-disclosure-panel:not([hidden]) { animation: fr-disclosure-in var(--fr-dur-quick) var(--fr-ease-standard); }
        }
        @keyframes fr-disclosure-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
