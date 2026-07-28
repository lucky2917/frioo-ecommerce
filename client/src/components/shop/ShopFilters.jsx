import React from 'react';
import { PRODUCT_CATEGORIES } from '../../config/constants';

export default function ShopFilters({ activeTab, setActiveTab, tabs, products, priceRange, onPriceChange, maxPrice }) {
  const getCategoryCount = (tab) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.label === tab);
    if (!cat || cat.dbValue === null) return products.filter(p => p.featured).length;
    return products.filter(p => p.category === cat.dbValue).length;
  };

  return (
    <div className="fr-filters">
      <div className="fr-filter-group">
        <h3 className="fr-filter-heading">Category</h3>
        <div className="fr-filter-list">
          {tabs.map((tab) => (
            <label key={tab} className="fr-filter-row">
              <input type="radio" name="category" checked={activeTab === tab} onChange={() => setActiveTab(tab)} className="fr-filter-radio" />
              <span className="fr-filter-label">{tab}</span>
              <span className="fr-filter-count">{getCategoryCount(tab)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="fr-filter-group">
        <h3 className="fr-filter-heading">Price</h3>
        <p className="fr-filter-hint">Up to &#8377;{maxPrice.toFixed(0)}</p>
        <div className="fr-filter-price">
          <div className="fr-price-field">
            <span className="fr-price-sym">&#8377;</span>
            <input type="number" min="0" placeholder="0" aria-label="Minimum price" value={priceRange[0] || ''} onChange={(e) => onPriceChange([Number(e.target.value) || 0, priceRange[1]])} />
          </div>
          <span className="fr-price-to">to</span>
          <div className="fr-price-field">
            <span className="fr-price-sym">&#8377;</span>
            <input type="number" placeholder={maxPrice.toFixed(0)} aria-label="Maximum price" value={priceRange[1] === maxPrice ? '' : priceRange[1]} onChange={(e) => onPriceChange([priceRange[0], Number(e.target.value) || maxPrice])} />
          </div>
        </div>
      </div>

      <style>{`
        .fr-filters { display: flex; flex-direction: column; gap: var(--fr-s6); }
        .fr-filter-group { display: flex; flex-direction: column; gap: var(--fr-s3); }
        .fr-filter-heading { font-family: var(--fr-font-sans); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--fr-text-3); margin: 0; }
        .fr-filter-list { display: flex; flex-direction: column; }
        .fr-filter-row { display: flex; align-items: center; gap: var(--fr-s3); min-height: 44px; cursor: pointer; font-family: var(--fr-font-sans); font-size: 0.94rem; color: var(--fr-text-2); }
        .fr-filter-row:hover .fr-filter-label { color: var(--fr-brand); }
        .fr-filter-radio { width: 18px; height: 18px; accent-color: var(--fr-brand); cursor: pointer; flex-shrink: 0; }
        .fr-filter-radio:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-filter-label { flex: 1; }
        .fr-filter-count { font-family: var(--fr-font-mono); font-size: 0.8rem; color: var(--fr-text-3); font-variant-numeric: tabular-nums; }
        .fr-filter-hint { font-size: 0.85rem; color: var(--fr-text-2); margin: 0; }
        .fr-filter-price { display: flex; align-items: center; gap: var(--fr-s2); }
        .fr-price-field { display: flex; align-items: center; gap: var(--fr-s1); flex: 1; min-width: 0; background: var(--fr-surface-2); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); padding: 0 var(--fr-s3); height: 44px; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), box-shadow var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-price-field:focus-within { border-color: var(--fr-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fr-brand) 16%, transparent); background: var(--fr-surface); }
        .fr-price-sym { color: var(--fr-text-3); font-size: 0.9rem; }
        .fr-price-field input { width: 100%; min-width: 0; background: none; border: none; outline: none; font-family: var(--fr-font-sans); font-size: 0.9rem; color: var(--fr-text); }
        .fr-price-to { font-size: 0.85rem; color: var(--fr-text-3); }
      `}</style>
    </div>
  );
}
