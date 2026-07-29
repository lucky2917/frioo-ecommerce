import React from 'react';

export default function SearchResults({ isSearching, results, onResultClick }) {
  return (
    <div className="fr-results">
      {isSearching ? (
        <div className="fr-results-status"><span className="fr-results-spinner" aria-hidden="true" />Searching&hellip;</div>
      ) : results.length > 0 ? (
        results.map((p) => (
          <div
            key={p.id}
            className="fr-result"
            role="button"
            tabIndex={0}
            onClick={() => onResultClick(p.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onResultClick(p.id); } }}
          >
            <img src={p.images?.[0]} alt="" className="fr-result-thumb" />
            <div className="fr-result-info">
              <div className="fr-result-name">{p.title}</div>
              <div className="fr-result-price">&#8377;{(p.price_cents / 100).toFixed(0)}</div>
            </div>
          </div>
        ))
      ) : (
        <div className="fr-results-status">No results &mdash; try another fruit.</div>
      )}
      <style>{`
        .fr-results { position: absolute; top: calc(100% + var(--fr-s2)); left: 0; right: 0; background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); box-shadow: var(--fr-elev-2); padding: var(--fr-s2); z-index: var(--fr-z-dropdown); max-height: 60vh; overflow-y: auto; }
        .fr-results-status { display: flex; align-items: center; gap: var(--fr-s2); padding: var(--fr-s3); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); }
        .fr-results-spinner { width: 14px; height: 14px; border: 2px solid var(--fr-line); border-top-color: var(--fr-brand); border-radius: var(--fr-r-pill); animation: fr-spin 0.7s linear infinite; }
        @keyframes fr-spin { to { transform: rotate(360deg); } }
        .fr-result { display: flex; align-items: center; gap: var(--fr-s3); padding: var(--fr-s2); border-radius: var(--fr-r-control); cursor: pointer; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-result:hover, .fr-result:focus-visible { background: var(--fr-brand-tint); outline: none; }
        .fr-result-thumb { width: 44px; height: 44px; border-radius: var(--fr-r-control); object-fit: cover; background: var(--fr-surface-2); flex-shrink: 0; }
        .fr-result-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .fr-result-name { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fr-result-price { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-normal); color: var(--fr-text); font-variant-numeric: tabular-nums; }
        @media (prefers-reduced-motion: reduce) { .fr-results-spinner { animation-duration: 1.4s; } }
      `}</style>
    </div>
  );
}
