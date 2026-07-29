import React, { useMemo } from 'react';
import { PRODUCT_CATEGORIES } from '../../config/constants';

const cat = (label) => PRODUCT_CATEGORIES.find(c => c.label === label)?.dbValue;

const BUNDLE_DEFINITIONS = [
  { id: 'juice-trio', title: 'Juice Trio', description: 'Three pure fruit juices, refreshing and natural.', category: cat('Pure Juices'), count: 3 },
  { id: 'shake-pack', title: 'Shake Pack', description: 'Three of our best milkshakes.', category: cat('Fruit Shakes'), count: 3 },
  { id: 'salad-duo', title: 'Salad Duo', description: 'Two fresh salad bowls for the pair.', category: cat('Salads'), count: 2 },
];

export default function BundleDeals({ products, onAddBundle }) {
  const bundles = useMemo(() => {
    return BUNDLE_DEFINITIONS.reduce((acc, def) => {
      const picks = products.filter(p => p.category === def.category).slice(0, def.count);
      if (picks.length < 2) return acc;
      acc.push({ ...def, products: picks, totalPrice: picks.reduce((sum, p) => sum + p.price_cents / 100, 0) });
      return acc;
    }, []);
  }, [products]);

  if (bundles.length === 0) return null;

  return (
    <section className="fr-bundles" aria-label="Combos">
      <header className="fr-bundles-head">
        <h2 className="fr-bundles-title">Combos</h2>
        <p className="fr-bundles-sub">A few pairings, ready in one tap.</p>
      </header>

      <div className="fr-bundles-row">
        {bundles.map((bundle) => (
          <article key={bundle.id} className="fr-bundle">
            <div className="fr-bundle-thumbs">
              {bundle.products.map((p) => (
                <img key={p.id} src={p.images?.[0]} alt="" className="fr-bundle-thumb" loading="lazy" />
              ))}
            </div>
            <div className="fr-bundle-body">
              <h3 className="fr-bundle-name">{bundle.title}</h3>
              <p className="fr-bundle-desc">{bundle.description}</p>
              <div className="fr-bundle-tags">
                {bundle.products.map((p) => <span key={p.id} className="fr-bundle-tag">{p.title}</span>)}
              </div>
              <div className="fr-bundle-foot">
                <span className="fr-bundle-price">&#8377;{bundle.totalPrice.toFixed(0)}</span>
                <button className="fr-bundle-add" onClick={() => onAddBundle(bundle.products)}>Add combo</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <style>{`
        .fr-bundles { margin-top: var(--fr-s9); padding-top: var(--fr-s8); border-top: 1px solid var(--fr-line); }
        .fr-bundles-head { margin-bottom: var(--fr-s5); }
        .fr-bundles-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-headline); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0 0 var(--fr-s1); }
        .fr-bundles-sub { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }
        .fr-bundles-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--fr-s4); }
        .fr-bundle { display: flex; flex-direction: column; background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); overflow: hidden; }
        .fr-bundle-thumbs { display: flex; gap: 2px; background: var(--fr-surface-2); }
        .fr-bundle-thumb { flex: 1; min-width: 0; aspect-ratio: 1; object-fit: cover; }
        .fr-bundle-body { display: flex; flex-direction: column; gap: var(--fr-s2); padding: var(--fr-s4); flex: 1; }
        .fr-bundle-name { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); letter-spacing: var(--fr-track-headline); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0; }
        .fr-bundle-desc { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }
        .fr-bundle-tags { display: flex; flex-wrap: wrap; gap: var(--fr-s2); margin-top: var(--fr-s1); }
        .fr-bundle-tag { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); color: var(--fr-brand); background: var(--fr-brand-tint); padding: 3px 9px; border-radius: var(--fr-r-pill); }
        .fr-bundle-foot { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s3); margin-top: auto; padding-top: var(--fr-s3); }
        .fr-bundle-price { font-family: var(--fr-font-sans); font-size: var(--fr-fs-lead); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); font-variant-numeric: tabular-nums; }
        .fr-bundle-add { height: 44px; padding: 0 var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); color: var(--fr-text); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-bundle-add:hover { border-color: var(--fr-brand); color: var(--fr-brand); }
        .fr-bundle-add:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
      `}</style>
    </section>
  );
}
