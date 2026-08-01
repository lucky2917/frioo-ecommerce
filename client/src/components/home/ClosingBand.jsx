import { Link } from 'react-router-dom';
import { useReveal } from '../../hooks/useReveal';
import { prefetchHandlers } from '../../hooks/usePrefetchRoute';
import { loadShop } from '../../lib/routeLoaders';

const PHONE_DISPLAY = '+91 93470 43329';
const PHONE_HREF = 'tel:+919347043329';

export default function ClosingBand() {
  const revealRef = useReveal();

  return (
    <section className="fr-sec fr-closing" aria-label="Get in touch">
      <div className="fr-wrap">
        <div className="fr-closing-panel fr-reveal" ref={revealRef}>
          <div className="fr-closing-text">
            <p className="fr-eyebrow">In season now</p>
            <h2 className="fr-sec-title">Not sure what is good this week?</h2>
            <p className="fr-sec-sub">
              Stock changes with the market. Call the shop and whoever is packing that morning will tell you what came in well.
            </p>
          </div>

          <div className="fr-closing-actions">
            <a href={PHONE_HREF} className="fr-closing-call">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              {PHONE_DISPLAY}
            </a>
            <Link to="/shop" className="fr-closing-shop" {...prefetchHandlers(loadShop)}>Browse what is in today</Link>
          </div>
        </div>
      </div>

      <style>{`
        .fr-closing { background: var(--fr-surface); }
        .fr-closing-panel { display: grid; grid-template-columns: 1.2fr 0.8fr; align-items: center; gap: var(--fr-s8); padding: var(--fr-s9) var(--fr-s8); background: var(--fr-brand-tint); border-radius: var(--fr-r-surface); }
        .fr-closing-text { min-width: 0; }
        .fr-closing-text .fr-sec-sub { margin-top: var(--fr-s3); }
        .fr-closing-actions { display: flex; flex-direction: column; gap: var(--fr-s3); }
        .fr-closing-call { display: inline-flex; align-items: center; justify-content: center; gap: var(--fr-s3); min-height: 52px; padding: 0 var(--fr-s6); background: var(--fr-brand); color: var(--fr-on-brand); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); text-decoration: none; font-variant-numeric: tabular-nums; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-closing-call:hover { background: var(--fr-brand-press); }
        .fr-closing-call:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 3px; }
        .fr-closing-shop { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 0 var(--fr-s6); background: transparent; color: var(--fr-brand); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); text-decoration: none; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-closing-shop:hover { border-color: var(--fr-brand); background: var(--fr-surface); }
        .fr-closing-shop:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 3px; }

        @media (prefers-reduced-motion: reduce) { .fr-closing-call, .fr-closing-shop { transition: none; } }
        @media (max-width: 900px) {
          .fr-closing-panel { grid-template-columns: 1fr; gap: var(--fr-s6); padding: var(--fr-s7) var(--fr-s5); }
        }
      `}</style>
    </section>
  );
}
