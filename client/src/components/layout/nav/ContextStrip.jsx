import React from 'react';

export default function ContextStrip({ activeOrder, onTrack }) {
  return (
    <div className="fr-context-strip">
      {activeOrder ? (
        <div
          className="fr-tracker"
          role="button"
          tabIndex={0}
          onClick={onTrack}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTrack(); } }}
        >
          <span className="fr-tracker-dot" aria-hidden="true" />
          <span className="fr-tracker-text">Order #{activeOrder.id} · <strong>{activeOrder.status}</strong></span>
          <span className="fr-tracker-cta">Track &rarr;</span>
        </div>
      ) : (
        <div className="fr-service">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
          <span>Delivering fresh in <strong>Visakhapatnam</strong> &mdash; within 6&nbsp;km</span>
        </div>
      )}
      <style>{`
        .fr-context-strip { height: 28px; display: flex; align-items: center; justify-content: center; padding: 0 var(--fr-s4); background: var(--fr-surface-2); border-bottom: 1px solid var(--fr-line); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); }
        .fr-service { display: flex; align-items: center; gap: var(--fr-s2); color: var(--fr-text-2); }
        .fr-service strong { color: var(--fr-text-2); font-weight: var(--fr-fw-medium); }
        .fr-service svg { color: var(--fr-brand); flex-shrink: 0; }
        .fr-tracker { display: inline-flex; align-items: center; gap: var(--fr-s2); color: var(--fr-text-2); background: none; border: none; cursor: pointer; padding: var(--fr-s1) var(--fr-s2); }
        .fr-tracker:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }
        .fr-tracker-dot { width: 7px; height: 7px; border-radius: var(--fr-r-pill); background: var(--fr-info); flex-shrink: 0; }
        @media (prefers-reduced-motion: no-preference) { .fr-tracker-dot { animation: fr-pulse 2s var(--fr-ease-standard) infinite; } }
        @keyframes fr-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .fr-tracker-text strong { color: var(--fr-text); font-weight: var(--fr-fw-medium); text-transform: capitalize; }
        .fr-tracker-cta { color: var(--fr-brand); font-weight: var(--fr-fw-medium); white-space: nowrap; }
      `}</style>
    </div>
  );
}
