export default function RailControls({ progressRef, prevRef, nextRef, onScroll, label }) {
  return (
    <div className="fr-rail-foot">
      <div className="fr-rail-progress" ref={progressRef} aria-hidden="true">
        <span className="fr-rail-progress-bar" />
      </div>
      <div className="fr-rail-nav">
        <button type="button" className="fr-rail-btn" ref={prevRef} onClick={() => onScroll(-1)} aria-label={`Scroll ${label} backward`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button type="button" className="fr-rail-btn" ref={nextRef} onClick={() => onScroll(1)} aria-label={`Scroll ${label} forward`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <style>{`
        .fr-rail-foot { display: flex; align-items: center; gap: var(--fr-s5); margin-top: var(--fr-s6); }
        .fr-rail-progress { flex: 1; height: 3px; background: var(--fr-line); border-radius: var(--fr-r-pill); overflow: hidden; }
        .fr-rail-progress[data-rail-static] { visibility: hidden; }
        .fr-rail-progress-bar { display: block; width: 38%; height: 100%; background: var(--fr-brand); border-radius: inherit; transform: translateX(calc(var(--fr-rail-progress, 0) * (100cqw - 100%))); transition: transform var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-rail-progress { container-type: inline-size; }
        .fr-rail-nav { display: flex; gap: var(--fr-s2); flex-shrink: 0; }
        .fr-rail-btn { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-pill); color: var(--fr-text); cursor: pointer; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-rail-btn:hover:not(:disabled) { border-color: var(--fr-brand); color: var(--fr-brand); }
        .fr-rail-btn:disabled { opacity: 0.38; cursor: default; }
        .fr-rail-btn:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 3px; }

        @media (prefers-reduced-motion: reduce) {
          .fr-rail-progress-bar, .fr-rail-btn { transition: none; }
        }
        @media (max-width: 900px) {
          .fr-rail-nav { display: none; }
        }
      `}</style>
    </div>
  );
}
