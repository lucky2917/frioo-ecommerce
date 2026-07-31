import React from 'react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { to: '/shop?category=deals', label: 'Daily Deals' },
  { to: '/shop?category=juices', label: 'Pure Juices' },
  { to: '/shop?category=shakes', label: 'Fruit Shakes' },
  { to: '/shop?category=salads', label: 'Salads' },
  { to: '/shop?category=fruits', label: 'Fresh Fruits' },
];

const UTILITY = [
  { to: '/about', label: 'About Us' },
  { to: '/stores', label: 'Our Stores' },
  { to: '/faq', label: 'Help & FAQs' },
  { to: '/contact', label: 'Contact' },
];

export default function MobileDrawer({ open, onClose }) {
  return (
    <>
      <div className={`fr-drawer ${open ? 'fr-drawer-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}>
        <div className="fr-drawer-head">
          <span className="fr-drawer-title">Menu</span>
          <button className="fr-drawer-close" onClick={onClose} aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <nav className="fr-drawer-nav" aria-label="Categories">
          {CATEGORIES.map((c) => <Link key={c.to} to={c.to} className="fr-drawer-link" onClick={onClose}>{c.label}</Link>)}
        </nav>
        <div className="fr-drawer-divider" />
        <nav className="fr-drawer-nav" aria-label="More">
          {UTILITY.map((u) => <Link key={u.to} to={u.to} className="fr-drawer-link fr-drawer-link-sub" onClick={onClose}>{u.label}</Link>)}
        </nav>
      </div>
      {open && <div className="fr-drawer-scrim" onClick={onClose} />}
      <style>{`
        .fr-drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 82%; max-width: 320px; z-index: var(--fr-z-sheet); display: flex; flex-direction: column; background: var(--fr-surface); box-shadow: var(--fr-elev-3); transform: translateX(-100%); transition: transform var(--fr-dur-expressive) var(--fr-ease-settle); padding: max(var(--fr-s5), env(safe-area-inset-top)) var(--fr-s5) var(--fr-s5) max(var(--fr-s5), env(safe-area-inset-left)); }
        .fr-drawer-open { transform: translateX(0); }
        .fr-drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--fr-s5); }
        .fr-drawer-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: var(--fr-text); }
        .fr-drawer-close { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: var(--fr-text-2); cursor: pointer; border-radius: var(--fr-r-control); }
        .fr-drawer-close:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-drawer-nav { display: flex; flex-direction: column; }
        .fr-drawer-link { font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); text-decoration: none; padding: var(--fr-s3) 0; border-bottom: 1px solid var(--fr-line); transition: color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-drawer-link:hover, .fr-drawer-link:focus-visible { color: var(--fr-brand); outline: none; }
        .fr-drawer-link-sub { font-size: var(--fr-fs-control); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-control); color: var(--fr-text-2); border-bottom: none; padding: var(--fr-s2) 0; }
        .fr-drawer-divider { height: 1px; background: var(--fr-line); margin: var(--fr-s4) 0; }
        .fr-drawer-scrim { position: fixed; inset: 0; background: var(--fr-scrim); z-index: var(--fr-z-scrim); }
        @media (prefers-reduced-motion: reduce) { .fr-drawer { transition: none; } }
      `}</style>
    </>
  );
}
