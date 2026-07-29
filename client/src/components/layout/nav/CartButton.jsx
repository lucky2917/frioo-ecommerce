import React from 'react';
import { Link } from 'react-router-dom';

export default function CartButton({ count }) {
  return (
    <Link to="/cart" className="fr-cart" aria-label={count > 0 ? `Cart, ${count} items` : 'Cart'}>
      <span className="fr-cart-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
        {count > 0 && <span className="fr-cart-count">{count}</span>}
      </span>
      <span className="fr-cart-label">Cart</span>
      <style>{`
        .fr-cart { display: inline-flex; align-items: center; gap: var(--fr-s2); height: 44px; padding: 0 var(--fr-s3); border-radius: var(--fr-r-pill); text-decoration: none; color: var(--fr-text); transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-cart:hover { background: var(--fr-surface-2); }
        .fr-cart:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-cart-icon { position: relative; display: inline-flex; }
        .fr-cart-count { position: absolute; top: -6px; right: -8px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: var(--fr-r-pill); background: var(--fr-brand); color: var(--fr-on-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); display: flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; }
        .fr-cart-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); }
        @media (max-width: 900px) { .fr-cart-label { display: none; } }
      `}</style>
    </Link>
  );
}
