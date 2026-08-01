import { Link } from 'react-router-dom';
import ProductCard from '../shop/ProductCard';
import ProductCardSkeleton from '../shop/ProductCardSkeleton';
import RailControls from './RailControls';
import { useRail } from '../../hooks/useRail';
import { useReveal } from '../../hooks/useReveal';
import { prefetchHandlers } from '../../hooks/usePrefetchRoute';
import { loadShop } from '../../lib/routeLoaders';

const SKELETON_COUNT = 5;

export default function ProductRail({ eyebrow, title, description, products, onAdd, loading, viewAllTo = '/shop', tint = false }) {
  const { trackRef, progressRef, prevRef, nextRef, scrollByPage } = useRail(products.length);
  useReveal(trackRef);

  if (!loading && products.length === 0) return null;

  return (
    <section className={`fr-sec fr-sec-tight fr-prail${tint ? ' fr-sec-tint' : ''}`} aria-label={title}>
      <div className="fr-wrap">
        <header className="fr-sec-head">
          <div>
            <p className="fr-eyebrow">{eyebrow}</p>
            <h2 className="fr-sec-title">{title}</h2>
            {description && <p className="fr-sec-sub">{description}</p>}
          </div>
          <Link to={viewAllTo} className="fr-sec-link" {...prefetchHandlers(loadShop)}>
            View all
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </Link>
        </header>

        <div className="fr-prail-track fr-reveal" ref={trackRef}>
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <div className="fr-prail-cell" key={index}><ProductCardSkeleton /></div>
              ))
            : products.map((product, index) => (
                <div className="fr-prail-cell" key={product.id} style={{ '--fr-stagger': index }}>
                  <ProductCard product={product} onAdd={onAdd} />
                </div>
              ))}
        </div>

        {!loading && <RailControls progressRef={progressRef} prevRef={prevRef} nextRef={nextRef} onScroll={scrollByPage} label={title} />}
      </div>

      <style>{`
        .fr-prail-track { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(240px, 1fr); gap: var(--fr-s5); overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -ms-overflow-style: none; padding: var(--fr-s1) var(--fr-s1) var(--fr-s4); margin: calc(var(--fr-s1) * -1) calc(var(--fr-s1) * -1) 0; }
        .fr-prail-track::-webkit-scrollbar { display: none; }
        .fr-prail-cell { scroll-snap-align: start; display: flex; min-width: 0; }
        .fr-prail-cell > * { width: 100%; }

        @media (max-width: 900px) {
          .fr-prail-track { grid-auto-columns: minmax(200px, 68%); gap: var(--fr-s4); }
        }
      `}</style>
    </section>
  );
}
