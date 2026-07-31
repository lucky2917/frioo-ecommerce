import { useEffect, useState } from 'react';

const VISIBLE_AFTER = 150;

export default function RouteFallback() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), VISIBLE_AFTER);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fr-route-fallback" aria-busy="true">
      <span className="fr-sr-only" aria-live="polite">{visible ? 'Loading page' : ''}</span>
      {visible && (
        <div className="fr-route-skeleton" aria-hidden="true">
          <div className="fr-route-skel-line fr-route-skel-title" />
          <div className="fr-route-skel-line fr-route-skel-sub" />
          <div className="fr-route-skel-grid">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="fr-route-skel-card" />)}
          </div>
        </div>
      )}

      <style>{`
        .fr-route-fallback { min-height: 60vh; padding: var(--fr-s9) var(--fr-s5) var(--fr-s8); max-width: 1400px; margin: 0 auto; }
        .fr-route-skeleton { display: flex; flex-direction: column; gap: var(--fr-s4); }
        .fr-route-skel-line { background: var(--fr-surface-2); border-radius: var(--fr-r-control); }
        .fr-route-skel-title { height: 34px; width: min(320px, 60%); }
        .fr-route-skel-sub { height: 16px; width: min(220px, 45%); margin-bottom: var(--fr-s5); }
        .fr-route-skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--fr-s4); }
        .fr-route-skel-card { aspect-ratio: 4 / 5; background: var(--fr-surface-2); border-radius: var(--fr-r-card); }

        @media (prefers-reduced-motion: no-preference) {
          .fr-route-skel-line, .fr-route-skel-card { animation: fr-route-shimmer 1.4s var(--fr-ease-standard) infinite; }
        }
        @keyframes fr-route-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>
    </div>
  );
}
