import React, { useState, useRef } from 'react';
import { useDialog } from '../../hooks/useDialog';
import { useCommitFeedback } from '../../hooks/useCommitFeedback';
import { Link } from 'react-router-dom';
import OptimizedImage from '../OptimizedImage';



const WEIGHT_OPTIONS = [
  { label: '250g', multiplier: 0.25 },
  { label: '500g', multiplier: 0.50 },
  { label: '1kg', multiplier: 1.0 },
];

export default function ProductCard({ product, onAdd }) {
  const [showCustomize, setShowCustomize] = useState(false);
  const sheetRef = useRef(null);
  const sheetCloseRef = useRef(null);
  const { committed, commit } = useCommitFeedback();
  const [selectedExclusions, setSelectedExclusions] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [selectedWeight, setSelectedWeight] = useState(WEIGHT_OPTIONS[2]);

  useDialog({ open: showCustomize, onClose: () => setShowCustomize(false), dialogRef: sheetRef, initialFocusRef: sheetCloseRef });

  const isWeightBased = product.category === 'Fresh Fruit' && product.unit === 'kg';
  const hasOptions = product.nutrition?.exclusions?.length > 0 || product.nutrition?.ingredients?.length > 0;

  const basePrice = product.price_cents / 100;
  const hasDiscount = product.discount > 0;
  const originalPrice = hasDiscount ? Math.round(basePrice / (1 - product.discount / 100)) : null;

  const unitSuffix = product.unit === 'kg' ? ' / kg' : product.unit === 'item' ? ' each' : product.unit ? ` / ${product.unit}` : '';
  const per100g = product.unit === 'kg' ? Math.round(basePrice / 10) : null;

  let finalPrice, variantLabel;
  if (isWeightBased) {
    finalPrice = basePrice * selectedWeight.multiplier;
    variantLabel = selectedWeight.label;
  } else {
    finalPrice = basePrice;
    variantLabel = product.unit ? product.unit.charAt(0).toUpperCase() + product.unit.slice(1) : 'Standard';
  }

  const imageSrc = product.images?.[0];

  const handleActionClick = () => {
    if (hasOptions || isWeightBased) {
      setShowCustomize(true);
    } else {
      onAdd(product, variantLabel, finalPrice);
      commit();
    }
  };

  const handleConfirm = () => {
    onAdd(product, variantLabel, finalPrice, { exclusions: selectedExclusions, removedIngredients });
    commit();
    setShowCustomize(false);
    setSelectedExclusions([]);
    setRemovedIngredients([]);
    setSelectedWeight(WEIGHT_OPTIONS[2]);
  };

  const toggleExclusion = (item) => setSelectedExclusions((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  const toggleIngredient = (item) => setRemovedIngredients((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);

  return (
    <>
      <article className="fr-pc">
        <Link to={`/product/${product.id}`} className="fr-pc-media" aria-label={product.title}>
          {imageSrc
            ? <OptimizedImage src={imageSrc} alt={product.title} className="fr-pc-img" />
            : <span className="fr-pc-noimg">No photo yet</span>}
          {hasDiscount && <span className="fr-pc-badge">{product.discount}% off</span>}
        </Link>
        <div className="fr-pc-body">
          <Link to={`/product/${product.id}`} className="fr-pc-name">{product.title}</Link>
          <div className="fr-pc-price-row">
            <span className={`fr-pc-price${hasDiscount ? ' fr-pc-price-sale' : ''}`}>&#8377;{basePrice.toFixed(0)}</span>
            <span className="fr-pc-unit">{unitSuffix}</span>
            {hasDiscount && <span className="fr-pc-original">&#8377;{originalPrice}</span>}
          </div>
          {per100g && <div className="fr-pc-measure">&#8377;{per100g} / 100g</div>}
          <button className={`fr-pc-add${committed ? ' fr-pc-add-done' : ''}`} onClick={handleActionClick}>
            {committed ? (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                Added
              </>
            ) : (hasOptions || isWeightBased ? 'Choose options' : 'Add to cart')}
          </button>
          <span className="fr-sr-only" aria-live="polite">{committed ? `${product.title} added to cart.` : ''}</span>
        </div>
      </article>

      {showCustomize && (
        <div className="fr-pc-scrim fr-dialog-scrim" onClick={() => setShowCustomize(false)}>
          <div className="fr-pc-sheet fr-dialog-panel" ref={sheetRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Customize ${product.title}`}>
            <div className="fr-pc-sheet-head">
              <h4 className="fr-pc-sheet-title">{product.title}</h4>
              <button className="fr-pc-sheet-close" ref={sheetCloseRef} onClick={() => setShowCustomize(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="fr-pc-sheet-body">
              {isWeightBased && (
                <div className="fr-pc-section">
                  <label className="fr-pc-label">Quantity</label>
                  <div className="fr-pc-chips">
                    {WEIGHT_OPTIONS.map((opt) => (
                      <button key={opt.label} className={`fr-pc-chip${selectedWeight.label === opt.label ? ' fr-pc-chip-on' : ''}`} onClick={() => setSelectedWeight(opt)}>{opt.label}</button>
                    ))}
                  </div>
                  <div className="fr-pc-measure">&#8377;{(basePrice / 10).toFixed(0)} / 100g</div>
                </div>
              )}
              {product.nutrition?.exclusions?.length > 0 && (
                <div className="fr-pc-section">
                  <label className="fr-pc-label">Remove any? (no extra cost)</label>
                  <div className="fr-pc-chips">
                    {product.nutrition.exclusions.map((item) => (
                      <button key={item} className={`fr-pc-chip${selectedExclusions.includes(item) ? ' fr-pc-chip-on' : ''}`} onClick={() => toggleExclusion(item)}>{selectedExclusions.includes(item) ? 'No ' : ''}{item}</button>
                    ))}
                  </div>
                </div>
              )}
              {product.nutrition?.ingredients?.length > 0 && (
                <div className="fr-pc-section">
                  <label className="fr-pc-label">Customize ingredients</label>
                  <div className="fr-pc-chips">
                    {product.nutrition.ingredients.map((item) => (
                      <button key={item} className={`fr-pc-chip${removedIngredients.includes(item) ? ' fr-pc-chip-on' : ''}`} onClick={() => toggleIngredient(item)}>No {item}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="fr-pc-sheet-foot">
              <button className="fr-pc-confirm" onClick={handleConfirm}>Add to cart &middot; &#8377;{finalPrice.toFixed(0)}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fr-pc { display: flex; flex-direction: column; background: var(--fr-surface); border-radius: var(--fr-r-card); box-shadow: var(--fr-elev-1); overflow: hidden; height: 100%; transition: box-shadow var(--fr-dur-base) var(--fr-ease-standard), transform var(--fr-dur-base) var(--fr-ease-standard); }
        .fr-pc:hover { box-shadow: var(--fr-elev-2); transform: translateY(-2px); }
        .fr-pc-noimg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); color: var(--fr-text-3); }
        .fr-pc-media { position: relative; display: block; aspect-ratio: 4 / 5; background: var(--fr-surface-2); overflow: hidden; }
        .fr-pc-img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--fr-dur-base) var(--fr-ease-standard); }
        .fr-pc:hover .fr-pc-img { transform: scale(1.02); }
        .fr-pc-badge { position: absolute; top: var(--fr-s3); left: var(--fr-s3); background: var(--fr-warm); color: var(--fr-on-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); text-transform: uppercase; padding: 4px 9px; border-radius: var(--fr-r-control); }
        .fr-pc-body { display: flex; flex-direction: column; gap: var(--fr-s1); padding: var(--fr-s4); flex: 1; }
        .fr-pc-name { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-medium); color: var(--fr-text); text-decoration: none; line-height: var(--fr-lh-snug); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .fr-pc-name:hover { color: var(--fr-brand); }
        .fr-pc-name:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }
        .fr-pc-price-row { display: flex; align-items: baseline; gap: var(--fr-s2); margin-top: var(--fr-s1); }
        .fr-pc-price { font-family: var(--fr-font-sans); font-size: var(--fr-fs-lead); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); font-variant-numeric: tabular-nums; }
        .fr-pc-price-sale { color: var(--fr-warm); }
        .fr-pc-unit { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); color: var(--fr-text-2); }
        .fr-pc-original { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); color: var(--fr-text-3); text-decoration: line-through; font-variant-numeric: tabular-nums; }
        .fr-pc-measure { font-family: var(--fr-font-mono); font-size: var(--fr-fs-measure); font-weight: var(--fr-fw-regular); color: var(--fr-text-2); font-variant-numeric: tabular-nums; }
        .fr-pc-add { margin-top: auto; height: 44px; background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-pc-add { display: inline-flex; align-items: center; justify-content: center; gap: var(--fr-s2); }
        .fr-pc-add:hover { background: var(--fr-brand-press); }
        .fr-pc-add-done { background: var(--fr-success); }
        .fr-pc-add:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

        .fr-pc-scrim { position: fixed; inset: 0; z-index: var(--fr-z-modal); background: var(--fr-scrim); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: var(--fr-s5); }
        .fr-pc-sheet { width: 100%; max-width: 440px; background: var(--fr-surface); border-radius: var(--fr-r-surface); box-shadow: var(--fr-elev-3); overflow: hidden; }
        .fr-pc-sheet-head { display: flex; align-items: center; justify-content: space-between; padding: var(--fr-s4) var(--fr-s5); border-bottom: 1px solid var(--fr-line); }
        .fr-pc-sheet-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); letter-spacing: var(--fr-track-headline); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0; }
        .fr-pc-sheet-close { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: var(--fr-text-2); cursor: pointer; border-radius: var(--fr-r-control); }
        .fr-pc-sheet-close:hover { background: var(--fr-surface-2); }
        .fr-pc-sheet-close:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-pc-sheet-body { padding: var(--fr-s5); max-height: 60vh; overflow-y: auto; display: flex; flex-direction: column; gap: var(--fr-s5); }
        .fr-pc-section { display: flex; flex-direction: column; gap: var(--fr-s3); }
        .fr-pc-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); color: var(--fr-text-2); }
        .fr-pc-chips { display: flex; flex-wrap: wrap; gap: var(--fr-s2); }
        .fr-pc-chip { min-height: 44px; padding: 0 var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-pill); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-pc-chip:hover { border-color: var(--fr-brand); color: var(--fr-brand); }
        .fr-pc-chip-on { background: var(--fr-brand); color: var(--fr-on-brand); border-color: var(--fr-brand); }
        .fr-pc-chip-on:hover { color: var(--fr-on-brand); }
        .fr-pc-sheet-foot { padding: var(--fr-s4) var(--fr-s5); border-top: 1px solid var(--fr-line); }
        .fr-pc-confirm { width: 100%; height: 48px; background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; font-variant-numeric: tabular-nums; }
        .fr-pc-confirm:hover { background: var(--fr-brand-press); }
        .fr-pc-confirm:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

        @media (max-width: 768px) {
          .fr-pc-scrim { align-items: flex-end; padding: 0; }
          .fr-pc-sheet { max-width: none; border-radius: var(--fr-r-surface) var(--fr-r-surface) 0 0; padding-bottom: env(safe-area-inset-bottom); }
        }
        @media (prefers-reduced-motion: reduce) { .fr-pc, .fr-pc-img, .fr-pc-add, .fr-pc-chip { transition: none; } }
      `}</style>
    </>
  );
}
