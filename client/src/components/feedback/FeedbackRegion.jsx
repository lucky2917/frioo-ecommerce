import { useEffect, useState } from 'react';
import { subscribeToFeedback, dismissFeedback, getFeedbackEntries } from '../../lib/feedbackStore';

const MARKS = {
  success: <path d="M20 6 9 17l-5-5" />,
  error: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12" y2="16.5" /></>,
  warning: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" /></>,
  info: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="8" x2="12" y2="8" /></>,
};

export default function FeedbackRegion() {
  const [entries, setEntries] = useState(getFeedbackEntries);

  useEffect(() => subscribeToFeedback(setEntries), []);

  if (entries.length === 0) return null;

  return (
    <div className="fr-feedback-region">
      {entries.map(({ id, tone, message, title }) => (
        <div
          key={id}
          className={`fr-feedback fr-feedback--${tone}`}
          role={tone === 'error' ? 'alert' : 'status'}
          aria-live={tone === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          <span className="fr-feedback-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              {MARKS[tone]}
            </svg>
          </span>
          <div className="fr-feedback-body">
            {title && <strong className="fr-feedback-title">{title}</strong>}
            <span className="fr-feedback-msg">{message}</span>
          </div>
          <button className="fr-feedback-close" onClick={() => dismissFeedback(id)} aria-label="Dismiss">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      ))}

      <style>{`
        .fr-feedback-region { position: fixed; top: calc(var(--navbar-height-desktop) + var(--fr-s4)); right: var(--fr-s5); z-index: var(--fr-z-toast); display: flex; flex-direction: column; gap: var(--fr-s2); max-width: min(380px, calc(100vw - var(--fr-s8))); }
        .fr-feedback { display: flex; align-items: flex-start; gap: var(--fr-s3); padding: var(--fr-s3) var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line); border-left: 3px solid var(--fr-text-3); border-radius: var(--fr-r-card); box-shadow: var(--fr-elev-2); }
        .fr-feedback--success { border-left-color: var(--fr-success); }
        .fr-feedback--error { border-left-color: var(--fr-danger); }
        .fr-feedback--warning { border-left-color: var(--fr-warm); }
        .fr-feedback--info { border-left-color: var(--fr-info); }
        .fr-feedback-mark { display: flex; flex-shrink: 0; margin-top: 1px; }
        .fr-feedback--success .fr-feedback-mark { color: var(--fr-success); }
        .fr-feedback--error .fr-feedback-mark { color: var(--fr-danger); }
        .fr-feedback--warning .fr-feedback-mark { color: var(--fr-warm); }
        .fr-feedback--info .fr-feedback-mark { color: var(--fr-info); }
        .fr-feedback-body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .fr-feedback-title { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-normal); color: var(--fr-text); }
        .fr-feedback-msg { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); }
        .fr-feedback-close { flex-shrink: 0; width: 44px; height: 44px; margin: -10px -10px -10px 0; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: var(--fr-text-3); border-radius: var(--fr-r-control); }
        .fr-feedback-close:hover { background: var(--fr-surface-2); color: var(--fr-text); }

        @media (prefers-reduced-motion: no-preference) {
          .fr-feedback { animation: fr-feedback-in var(--fr-dur-base) var(--fr-ease-settle); }
        }
        @keyframes fr-feedback-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }

        @media (max-width: 768px) {
          .fr-feedback-region { top: auto; bottom: calc(var(--fr-s4) + env(safe-area-inset-bottom)); left: var(--fr-s4); right: var(--fr-s4); max-width: none; }
          @media (prefers-reduced-motion: no-preference) {
            .fr-feedback { animation: fr-feedback-in-mobile var(--fr-dur-base) var(--fr-ease-settle); }
          }
        }
        @keyframes fr-feedback-in-mobile { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
