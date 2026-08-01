import { Link } from 'react-router-dom';
import { useRail } from '../../hooks/useRail';
import { useReveal } from '../../hooks/useReveal';
import { prefetchHandlers } from '../../hooks/usePrefetchRoute';
import { loadShop } from '../../lib/routeLoaders';
import RailControls from './RailControls';

const CATEGORIES = [
  { slug: 'fruits', label: 'Fresh Fruits', note: 'Hand-picked daily', img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80' },
  { slug: 'juices', label: 'Pure Juices', note: 'Cold-pressed, no sugar', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80' },
  { slug: 'shakes', label: 'Fruit Shakes', note: 'Made to order', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80' },
  { slug: 'salads', label: 'Fresh Salads', note: 'Crisp and seasonal', img: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80' },
  { slug: 'deals', label: 'Daily Deals', note: 'This week only', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80' }
];

export default function CategoryRail() {
  const { trackRef, progressRef, prevRef, nextRef, scrollByPage } = useRail(CATEGORIES.length);
  useReveal(trackRef);

  return (
    <section className="fr-sec fr-sec-tight fr-cats" aria-label="Shop by category">
      <div className="fr-wrap">
        <header className="fr-sec-head">
          <div>
            <p className="fr-eyebrow">Start here</p>
            <h2 className="fr-sec-title">What are you shopping for?</h2>
          </div>
          <Link to="/shop" className="fr-sec-link" {...prefetchHandlers(loadShop)}>
            View all
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </Link>
        </header>

        <div className="fr-cats-track fr-reveal" ref={trackRef}>
          {CATEGORIES.map(({ slug, label, note, img }, index) => (
            <Link
              key={slug}
              to={`/shop?category=${slug}`}
              className="fr-cat"
              style={{ '--fr-stagger': index }}
              {...prefetchHandlers(loadShop)}
            >
              <span className="fr-cat-disc">
                <img src={img} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              </span>
              <span className="fr-cat-label">{label}</span>
              <span className="fr-cat-note">{note}</span>
            </Link>
          ))}
        </div>

        <RailControls progressRef={progressRef} prevRef={prevRef} nextRef={nextRef} onScroll={scrollByPage} label="categories" />
      </div>

      <style>{`
        .fr-cats { background: var(--fr-surface-2); }
        .fr-cats-track { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(180px, 1fr); gap: var(--fr-s5); overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -ms-overflow-style: none; padding-bottom: var(--fr-s2); }
        .fr-cats-track::-webkit-scrollbar { display: none; }
        .fr-cat { scroll-snap-align: start; display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--fr-s3); text-decoration: none; padding: var(--fr-s2); border-radius: var(--fr-r-card); }
        .fr-cat-disc { width: 100%; max-width: 168px; aspect-ratio: 1; border-radius: 50%; overflow: hidden; background: var(--fr-surface); box-shadow: var(--fr-elev-1); transition: transform var(--fr-dur-base) var(--fr-ease-settle), box-shadow var(--fr-dur-base) var(--fr-ease-standard); }
        .fr-cat-disc img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .fr-cat:hover .fr-cat-disc { transform: translateY(-6px); box-shadow: var(--fr-elev-2); }
        .fr-cat-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); color: var(--fr-text); }
        .fr-cat:hover .fr-cat-label { color: var(--fr-brand); }
        .fr-cat-note { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-snug); color: var(--fr-text-2); }
        .fr-cat:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 3px; }

        @media (prefers-reduced-motion: reduce) { .fr-cat-disc { transition: none; } }
        @media (max-width: 900px) {
          .fr-cats-track { grid-auto-columns: minmax(140px, 45%); gap: var(--fr-s4); }
        }
      `}</style>
    </section>
  );
}
