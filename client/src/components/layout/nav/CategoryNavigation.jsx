import React from 'react';
import { Link } from 'react-router-dom';

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
        <Link key={c.to} to={c.to} className="fr-catnav-link">{c.label}</Link>
      ))}
      <style>{`
        .fr-catnav { display: flex; align-items: center; gap: var(--fr-s5); }
        .fr-catnav-link { position: relative; font-family: var(--fr-font-sans); font-size: 0.9rem; font-weight: 500; color: var(--fr-text-2); text-decoration: none; padding: var(--fr-s1) 0; white-space: nowrap; transition: color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-catnav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -5px; height: 2px; background: var(--fr-brand); transform: scaleX(0); transition: transform var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-catnav-link:hover { color: var(--fr-brand); }
        .fr-catnav-link:hover::after { transform: scaleX(1); }
        .fr-catnav-link:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 3px; border-radius: var(--fr-r-control); }
        @media (prefers-reduced-motion: reduce) { .fr-catnav-link::after { transition: none; } }
      `}</style>
    </nav>
  );
}
