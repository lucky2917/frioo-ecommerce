import { Link } from 'react-router-dom';
import SwipeRow from './SwipeRow';
import { prefetchHandlers } from '../../hooks/usePrefetchRoute';
import { loadShop } from '../../lib/routeLoaders';

const REASONS = [
  {
    key: 'quality',
    title: 'Picked, not ordered',
    body: 'We choose produce by hand at the market each morning instead of taking whatever a supplier sends.',
    to: '/about',
    action: 'How we source',
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80'
  },
  {
    key: 'custom',
    title: 'Made the way you want',
    body: 'Leave out an ingredient, change the weight, add a note. Your preferences travel with the order.',
    to: '/shop',
    action: 'Start an order',
    img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&q=80'
  },
  {
    key: 'help',
    title: 'A person on the phone',
    body: 'Questions about an order or what is in season? Call the shop and someone who packed it will answer.',
    to: '/contact',
    action: 'Talk to us',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80'
  }
];

export default function ReasonsGrid() {
  return (
    <section className="fr-sec fr-reasons" aria-label="Reasons to shop with Frioo">
      <div className="fr-wrap">
        <header className="fr-sec-head">
          <div>
            <p className="fr-eyebrow">Why Frioo</p>
            <h2 className="fr-sec-title">More reasons to shop with us</h2>
          </div>
          <Link to="/shop" className="fr-sec-link" {...prefetchHandlers(loadShop)}>
            Start your order
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </Link>
        </header>

        <SwipeRow className="fr-reasons-grid" count={REASONS.length} column="80%">
          {REASONS.map(({ key, title, body, to, action, img }, index) => (
            <article className="fr-reason" key={key} style={{ '--fr-stagger': index }}>
              <div className="fr-reason-media">
                <img src={img} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              </div>
              <div className="fr-reason-body">
                <h3 className="fr-reason-title">{title}</h3>
                <p className="fr-reason-text">{body}</p>
                <Link to={to} className="fr-reason-action">{action}</Link>
              </div>
            </article>
          ))}
        </SwipeRow>
      </div>

      <style>{`
        .fr-reasons { background: var(--fr-surface-2); }
        .fr-reasons-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fr-s5); }
        .fr-reason { display: flex; flex-direction: column; background: var(--fr-surface); border-radius: var(--fr-r-surface); overflow: hidden; box-shadow: var(--fr-elev-1); transition: box-shadow var(--fr-dur-base) var(--fr-ease-standard), transform var(--fr-dur-base) var(--fr-ease-standard); }
        .fr-reason:hover { box-shadow: var(--fr-elev-2); transform: translateY(-3px); }
        .fr-reason-media { aspect-ratio: 16 / 10; background: var(--fr-surface-2); overflow: hidden; }
        .fr-reason-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .fr-reason-body { display: flex; flex-direction: column; align-items: flex-start; gap: var(--fr-s3); padding: var(--fr-s6); flex: 1; }
        .fr-reason-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0; }
        .fr-reason-text { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-relaxed); color: var(--fr-text-2); margin: 0; flex: 1; }
        .fr-reason-action { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 var(--fr-s5); margin-top: var(--fr-s1); background: var(--fr-brand-tint); color: var(--fr-brand); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); text-decoration: none; transition: background var(--fr-dur-quick) var(--fr-ease-standard), color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-reason-action:hover { background: var(--fr-brand); color: var(--fr-on-brand); }
        .fr-reason-action:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 3px; }

        @media (prefers-reduced-motion: reduce) { .fr-reason, .fr-reason-action { transition: none; } }
        @media (max-width: 900px) {
          .fr-reason { height: 100%; }
        }
      `}</style>
    </section>
  );
}
