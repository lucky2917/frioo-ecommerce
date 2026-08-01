import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../../hooks/useReveal';
import { prefetchHandlers } from '../../hooks/usePrefetchRoute';
import { loadProductDetails } from '../../lib/routeLoaders';
import { hasNutritionFacts } from '../../utils/productSignals';

const MACROS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' }
];

const MAX_ITEMS = 5;

export default function NutritionPanel({ products }) {
  const revealRef = useReveal();

  const items = useMemo(
    () => products.filter(hasNutritionFacts).slice(0, MAX_ITEMS),
    [products]
  );

  const [activeId, setActiveId] = useState(null);
  const active = items.find((item) => item.id === activeId) ?? items[0];

  if (!active) return null;

  return (
    <section className="fr-sec fr-nutri" aria-label="Nutrition information">
      <div className="fr-wrap">
        <div className="fr-nutri-shell fr-reveal" ref={revealRef}>
          <div className="fr-nutri-intro">
            <p className="fr-eyebrow">Know what you eat</p>
            <h2 className="fr-sec-title">The numbers, straight off the label</h2>
            <p className="fr-sec-sub">
              Every figure below comes from the product itself. Pick an item to see what it actually contains.
            </p>

            <div className="fr-nutri-picker" role="tablist" aria-label="Choose a product">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={item.id === active.id}
                  className={`fr-nutri-chip${item.id === active.id ? ' fr-nutri-chip-on' : ''}`}
                  onClick={() => setActiveId(item.id)}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          <figure className="fr-nutri-card">
            <div className="fr-nutri-media">
              {active.images?.[0]
                ? <img src={active.images[0]} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                : <span className="fr-nutri-noimg" aria-hidden="true" />}
            </div>
            <figcaption className="fr-nutri-body">
              <h3 className="fr-nutri-name">{active.title}</h3>
              {active.perfect_for && <p className="fr-nutri-for">Good for {active.perfect_for}</p>}

              <dl className="fr-nutri-macros">
                {MACROS.map(({ key, label, unit }) => {
                  const value = Number(active.nutrition?.[key]);
                  if (!Number.isFinite(value) || value <= 0) return null;
                  return (
                    <div className="fr-nutri-macro" key={key}>
                      <dt>{label}</dt>
                      <dd>{value}<span>{unit}</span></dd>
                    </div>
                  );
                })}
              </dl>

              <Link to={`/product/${active.id}`} className="fr-sec-link" {...prefetchHandlers(loadProductDetails)}>
                See full details
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </Link>
            </figcaption>
          </figure>
        </div>
      </div>

      <style>{`
        .fr-nutri { background: var(--fr-surface); }
        .fr-nutri-shell { display: grid; grid-template-columns: 1fr 0.85fr; gap: var(--fr-s9); align-items: center; }
        .fr-nutri-intro { min-width: 0; }
        .fr-nutri-picker { display: flex; flex-wrap: wrap; gap: var(--fr-s2); margin-top: var(--fr-s6); }
        .fr-nutri-chip { min-height: 44px; padding: 0 var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-pill); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), background var(--fr-dur-quick) var(--fr-ease-standard), color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-nutri-chip:hover { border-color: var(--fr-brand); color: var(--fr-brand); }
        .fr-nutri-chip-on { background: var(--fr-brand); border-color: var(--fr-brand); color: var(--fr-on-brand); }
        .fr-nutri-chip-on:hover { color: var(--fr-on-brand); }
        .fr-nutri-chip:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 3px; }

        .fr-nutri-card { display: flex; flex-direction: column; margin: 0; background: var(--fr-surface); border-radius: var(--fr-r-surface); overflow: hidden; box-shadow: var(--fr-elev-2); }
        .fr-nutri-media { aspect-ratio: 16 / 9; background: var(--fr-surface-2); }
        .fr-nutri-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .fr-nutri-noimg { display: block; width: 100%; height: 100%; background: var(--fr-surface-2); }
        .fr-nutri-body { padding: var(--fr-s6); display: flex; flex-direction: column; gap: var(--fr-s3); }
        .fr-nutri-name { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0; }
        .fr-nutri-for { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }
        .fr-nutri-macros { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--fr-s3); margin: var(--fr-s2) 0 var(--fr-s3); }
        .fr-nutri-macro { padding: var(--fr-s3) var(--fr-s4); background: var(--fr-brand-tint); border-radius: var(--fr-r-card); }
        .fr-nutri-macro dt { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: 0.04em; text-transform: uppercase; color: var(--fr-text-2); }
        .fr-nutri-macro dd { margin: 2px 0 0; font-family: var(--fr-font-sans); font-size: var(--fr-fs-lead); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-brand); font-variant-numeric: tabular-nums; }
        .fr-nutri-macro dd span { font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); margin-left: 2px; }

        @media (prefers-reduced-motion: reduce) { .fr-nutri-chip { transition: none; } }
        @media (max-width: 900px) {
          .fr-nutri-shell { grid-template-columns: 1fr; gap: var(--fr-s6); }
        }
      `}</style>
    </section>
  );
}
