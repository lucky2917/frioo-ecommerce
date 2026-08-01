import { Link } from 'react-router-dom';
import { prefetchHandlers } from '../../hooks/usePrefetchRoute';
import { loadShop } from '../../lib/routeLoaders';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1800&q=80';

export default function HomeHero() {
  return (
    <section className="fr-hero" aria-label="Welcome to Frioo">
      <div className="fr-hero-media">
        <img src={HERO_IMAGE} alt="" aria-hidden="true" fetchPriority="high" decoding="async" className="fr-hero-img" />
        <div className="fr-hero-veil" aria-hidden="true" />
      </div>

      <div className="fr-wrap fr-hero-inner">
        <div className="fr-hero-panel">
          <p className="fr-hero-eyebrow">Fresh in Visakhapatnam</p>
          <h2 className="fr-hero-title">Picked this morning, on your table tonight.</h2>
          <p className="fr-hero-sub">Fruit, juices and salads made the same day, delivered across Vizag.</p>
          <div className="fr-hero-actions">
            <Link to="/shop" className="fr-hero-cta" {...prefetchHandlers(loadShop)}>Shop fresh</Link>
            <Link to="/shop?category=deals" className="fr-hero-cta fr-hero-cta-ghost" {...prefetchHandlers(loadShop)}>Today&apos;s offers</Link>
          </div>
        </div>
      </div>

      <style>{`
        .fr-hero { position: relative; display: flex; align-items: flex-end; min-height: clamp(460px, 66vh, 640px); overflow: hidden; background: var(--fr-brand); isolation: isolate; }
        .fr-hero-media { position: absolute; inset: 0; z-index: -1; }
        .fr-hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .fr-hero-veil { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(12, 26, 20, 0.88) 0%, rgba(12, 26, 20, 0.66) 38%, rgba(12, 26, 20, 0.12) 72%, rgba(12, 26, 20, 0.02) 100%); }
        .fr-hero-inner { width: 100%; padding-top: calc(var(--navbar-height-mobile) + var(--fr-s7)); padding-bottom: var(--fr-s9); }
        .fr-hero-panel { max-width: 34rem; }
        .fr-hero-eyebrow { font-family: var(--fr-font-mono); font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-eyebrow); text-transform: uppercase; color: #CFE3D6; margin: 0 0 var(--fr-s4); }
        .fr-hero-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-display); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-display); color: #FFFFFF; margin: 0 0 var(--fr-s4); text-wrap: balance; }
        .fr-hero-sub { font-family: var(--fr-font-sans); font-size: var(--fr-fs-lead); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: #E4EEE7; margin: 0 0 var(--fr-s7); max-width: 42ch; }
        .fr-hero-actions { display: flex; flex-wrap: wrap; gap: var(--fr-s3); }
        .fr-hero-cta { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 0 var(--fr-s7); background: var(--fr-surface); color: var(--fr-brand); border: 1px solid transparent; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); text-decoration: none; transition: background var(--fr-dur-quick) var(--fr-ease-standard), color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-hero-cta:hover { background: #EAF3EC; }
        .fr-hero-cta:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 3px; }
        .fr-hero-cta-ghost { background: transparent; color: #FFFFFF; border-color: rgba(255, 255, 255, 0.55); }
        .fr-hero-cta-ghost:hover { background: rgba(255, 255, 255, 0.12); color: #FFFFFF; }

        @media (prefers-reduced-motion: no-preference) {
          .fr-hero-img { animation: fr-hero-settle 900ms var(--fr-ease-settle) both; }
          .fr-hero-panel > * { animation: fr-rise var(--fr-dur-expressive) var(--fr-ease-settle) backwards; }
          .fr-hero-eyebrow { animation-delay: 80ms; }
          .fr-hero-title { animation-delay: 150ms; }
          .fr-hero-sub { animation-delay: 220ms; }
          .fr-hero-actions { animation-delay: 290ms; }
        }
        @keyframes fr-hero-settle { from { transform: scale(1.07); } to { transform: scale(1); } }

        @media (min-width: 900px) {
          .fr-hero-inner { padding-top: calc(var(--navbar-height-desktop) + var(--fr-s9)); padding-bottom: var(--fr-s10); }
        }
        @media (max-width: 900px) {
          .fr-hero { min-height: 0; }
          .fr-hero-veil { background: linear-gradient(180deg, rgba(12, 26, 20, 0.66) 0%, rgba(12, 26, 20, 0.88) 100%); }
          .fr-hero-cta { flex: 1 1 auto; }
        }
      `}</style>
    </section>
  );
}
