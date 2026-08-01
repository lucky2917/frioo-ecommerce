import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { prefetchHandlers } from '../../../hooks/usePrefetchRoute';
import { loadCart } from '../../../lib/routeLoaders';

export default function CartButton({ count }) {
  const [beat, setBeat] = useState(false);
  const [previousCount, setPreviousCount] = useState(count);

  if (count !== previousCount) {
    setPreviousCount(count);
    setBeat(count > previousCount);
  }

  useEffect(() => {
    if (!beat) return;
    const timer = setTimeout(() => setBeat(false), 320);
    return () => clearTimeout(timer);
  }, [beat]);

  return (
    <Link to="/cart" className="fr-cart" {...prefetchHandlers(loadCart)} aria-label={count > 0 ? `Cart, ${count} items` : 'Cart'}>
      <span className="fr-cart-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
        {count > 0 && <span className={`fr-cart-count${beat ? ' fr-cart-count-beat' : ''}`}>{count}</span>}
      </span>
      <span className="fr-cart-label">Cart</span>
      <style>{`
        .fr-cart { display: inline-flex; align-items: center; gap: var(--fr-s2); height: 44px; padding: 0 var(--fr-s3); border-radius: var(--fr-r-pill); text-decoration: none; color: var(--fr-text); transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-cart:hover { background: var(--fr-surface-2); }
        .fr-cart:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        @media (prefers-reduced-motion: no-preference) {
          .fr-cart-count-beat { animation: fr-cart-beat var(--fr-dur-expressive) var(--fr-ease-settle); }
        }
        @keyframes fr-cart-beat { 0% { transform: scale(1); } 45% { transform: scale(1.28); } 100% { transform: scale(1); } }
        .fr-cart-icon { position: relative; display: inline-flex; }
        .fr-cart-count { position: absolute; top: -6px; right: -8px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: var(--fr-r-pill); background: var(--fr-brand); color: var(--fr-on-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); display: flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; }
        .fr-cart-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); }
        @media (max-width: 900px) { .fr-cart-label { display: none; } }
      `}</style>
    </Link>
  );
}
