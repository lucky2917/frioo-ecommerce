import React from 'react';
import { Link } from 'react-router-dom';
import { prefetchHandlers } from '../../../hooks/usePrefetchRoute';
import { loadShop } from '../../../lib/routeLoaders';

const CATEGORIES = [
  { to: '/shop?category=deals', label: 'Daily Deals' },
  { to: '/shop?category=juices', label: 'Juices' },
  { to: '/shop?category=shakes', label: 'Shakes' },
  { to: '/shop?category=salads', label: 'Salads' },
  { to: '/shop?category=fruits', label: 'Fresh Fruits' },
];

export default function CategoryNavigation() {
  return (
    <nav className="fr-catnav" aria-label="Product categories">
      {CATEGORIES.map((c) => (
        <Link key={c.to} to={c.to} className="fr-catnav-link" {...prefetchHandlers(loadShop)}>{c.label}</Link>
      ))}
      <style>{`
        .fr-catnav { display: flex; align-items: center; gap: var(--fr-s5); max-width: 100%; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .fr-catnav::-webkit-scrollbar { display: none; }
        .fr-catnav-link { position: relative; flex-shrink: 0; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text-2); text-decoration: none; padding: var(--fr-s1) 0; white-space: nowrap; transition: color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-catnav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -5px; height: 2px; background: var(--fr-brand); transform: scaleX(0); transition: transform var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-catnav-link:hover { color: var(--fr-brand); }
        .fr-catnav-link:hover::after { transform: scaleX(1); }
        .fr-catnav-link:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 3px; border-radius: var(--fr-r-control); }
        @media (prefers-reduced-motion: reduce) { .fr-catnav-link::after { transition: none; } }
      `}</style>
    </nav>
  );
}
