export default function ProductCardSkeleton() {
  return (
    <div className="fr-pcs" aria-hidden="true">
      <div className="fr-pcs-img" />
      <div className="fr-pcs-line" />
      <div className="fr-pcs-line fr-pcs-short" />
      <div className="fr-pcs-btn" />

      <style>{`
        .fr-pcs { display: flex; flex-direction: column; gap: var(--fr-s3); background: var(--fr-surface); border-radius: var(--fr-r-card); box-shadow: var(--fr-elev-1); overflow: hidden; padding-bottom: var(--fr-s4); }
        .fr-pcs-img { aspect-ratio: 4 / 5; background: var(--fr-surface-2); }
        .fr-pcs-line { height: 12px; border-radius: var(--fr-r-control); background: var(--fr-surface-2); margin: 0 var(--fr-s4); }
        .fr-pcs-short { width: 50%; }
        .fr-pcs-btn { height: 44px; border-radius: var(--fr-r-control); background: var(--fr-surface-2); margin: var(--fr-s2) var(--fr-s4) 0; }

        @media (prefers-reduced-motion: no-preference) {
          .fr-pcs-img, .fr-pcs-line, .fr-pcs-btn { animation: fr-pcs-shimmer 1.4s var(--fr-ease-standard) infinite; }
        }
        @keyframes fr-pcs-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>
    </div>
  );
}
