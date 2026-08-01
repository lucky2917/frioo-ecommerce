import { Link } from 'react-router-dom';
import SwipeRow from './SwipeRow';
import { prefetchHandlers } from '../../hooks/usePrefetchRoute';
import { loadShop } from '../../lib/routeLoaders';

const PROMOS = [
  {
    key: 'grill',
    to: '/shop?category=fruits',
    flag: 'In season',
    flagTone: 'brand',
    label: 'Summer fruit, at its peak',
    img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200&q=80',
    span: 'tall'
  },
  {
    key: 'juices',
    to: '/shop?category=juices',
    flag: 'Cold pressed',
    flagTone: 'warm',
    label: 'Juices made this morning',
    img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=1200&q=80',
    span: 'wide'
  },
  {
    key: 'salads',
    to: '/shop?category=salads',
    flag: 'Ready to eat',
    flagTone: 'info',
    label: 'Salads, prepped and packed',
    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
    span: 'wide'
  }
];

export default function PromoGrid() {
  return (
    <section className="fr-sec fr-promo" aria-label="Featured collections">
      <div className="fr-wrap">
        <header className="fr-sec-head">
          <div>
            <p className="fr-eyebrow">Worth a look</p>
            <h2 className="fr-sec-title">Fresh picks, ready to go</h2>
          </div>
        </header>

        <SwipeRow className="fr-promo-grid" count={PROMOS.length} column="82%">
          {PROMOS.map(({ key, to, flag, flagTone, label, img, span }, index) => (
            <Link key={key} to={to} className={`fr-promo-card fr-promo-card--${span}`} style={{ '--fr-stagger': index }} {...prefetchHandlers(loadShop)}>
              <span className="fr-promo-media">
                <img src={img} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              </span>
              <span className={`fr-promo-flag fr-promo-flag--${flagTone}`}>{flag}</span>
              <span className="fr-promo-bar">
                <span className="fr-promo-label">{label}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </span>
            </Link>
          ))}
        </SwipeRow>
      </div>

      <style>{`
        .fr-promo-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(2, minmax(0, 1fr)); gap: var(--fr-s5); min-height: 620px; }
        .fr-promo-card { position: relative; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; border-radius: var(--fr-r-surface); text-decoration: none; background: var(--fr-surface-2); box-shadow: var(--fr-elev-1); }
        .fr-promo-card--tall { grid-row: span 2; }
        .fr-promo-media { position: absolute; inset: 0; }
        .fr-promo-media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform var(--fr-dur-expressive) var(--fr-ease-settle); }
        .fr-promo-card:hover .fr-promo-media img { transform: scale(1.04); }
        .fr-promo-card:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 3px; }
        .fr-promo-flag { position: absolute; top: 0; left: 0; padding: var(--fr-s3) var(--fr-s5); background: var(--fr-brand); color: var(--fr-on-brand); font-family: var(--fr-font-mono); font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-eyebrow); text-transform: uppercase; border-bottom-right-radius: var(--fr-r-surface); }
        .fr-promo-flag--warm { background: var(--fr-warm); }
        .fr-promo-flag--info { background: var(--fr-info); }
        .fr-promo-bar { position: relative; display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s4); padding: var(--fr-s5) var(--fr-s6); background: linear-gradient(180deg, rgba(12, 26, 20, 0) 0%, rgba(12, 26, 20, 0.82) 42%, rgba(12, 26, 20, 0.94) 100%); color: #FFFFFF; padding-top: var(--fr-s10); }
        .fr-promo-label { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); }
        .fr-promo-bar svg { flex-shrink: 0; transition: transform var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-promo-card:hover .fr-promo-bar svg { transform: translateX(4px); }

        @media (prefers-reduced-motion: reduce) {
          .fr-promo-media img, .fr-promo-bar svg { transition: none; }
        }
        @media (max-width: 900px) {
          .fr-promo-grid { grid-template-rows: none; min-height: 0; }
          .fr-promo-card { min-height: 300px; }
          .fr-promo-card--tall { grid-row: auto; }
          .fr-promo-bar { padding: var(--fr-s8) var(--fr-s5) var(--fr-s5); }
          .fr-promo-label { font-size: var(--fr-fs-lead); }
        }
      `}</style>
    </section>
  );
}
