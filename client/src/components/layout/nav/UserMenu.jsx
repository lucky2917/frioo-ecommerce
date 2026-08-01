import React from 'react';
import { Link } from 'react-router-dom';

export default function UserMenu({ user, open, onToggle, onSignOut, onSignIn }) {
  if (!user) {
    return (
      <button className="fr-login" onClick={onSignIn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        <span>Login</span>
        <style>{`
          .fr-login { display: inline-flex; align-items: center; gap: var(--fr-s2); height: 44px; padding: 0 var(--fr-s4); background: none; border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-pill); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; white-space: nowrap; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), color var(--fr-dur-quick) var(--fr-ease-standard); }
          .fr-login:hover { border-color: var(--fr-brand); color: var(--fr-brand); }
          .fr-login:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
          @media (max-width: 900px) {
            .fr-login { width: 44px; padding: 0; justify-content: center; border: none; }
            .fr-login span { display: none; }
          }
        `}</style>
      </button>
    );
  }

  const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  return (
    <div className="fr-usermenu">
      <button className="fr-avatar-btn" onClick={onToggle} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu">
        {avatar
          ? <img loading="lazy" decoding="async" src={avatar} alt="" className="fr-avatar" />
          : <span className="fr-avatar fr-avatar-fallback">{user.email?.charAt(0).toUpperCase()}</span>}
      </button>
      {open && (
        <div className="fr-dropdown" role="menu">
          <Link to="/profile" className="fr-dropdown-item" role="menuitem">My profile</Link>
          <Link to="/orders" className="fr-dropdown-item" role="menuitem">My orders</Link>
          <div className="fr-dropdown-divider" />
          <button onClick={onSignOut} className="fr-dropdown-item fr-dropdown-signout" role="menuitem">Sign out</button>
        </div>
      )}
      <style>{`
        .fr-usermenu { position: relative; }
        .fr-avatar-btn { width: 44px; height: 44px; padding: 0; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; border-radius: var(--fr-r-pill); cursor: pointer; }
        .fr-avatar-btn:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-avatar { width: 40px; height: 40px; border-radius: var(--fr-r-pill); object-fit: cover; display: flex; align-items: center; justify-content: center; }
        .fr-avatar-fallback { background: var(--fr-brand-tint); color: var(--fr-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); }
        .fr-dropdown { position: absolute; top: calc(100% + var(--fr-s2)); right: 0; min-width: 184px; max-width: calc(100vw - var(--fr-s6)); background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); box-shadow: var(--fr-elev-2); padding: var(--fr-s2); z-index: var(--fr-z-dropdown); }
        .fr-dropdown-item { display: block; width: 100%; text-align: left; padding: var(--fr-s3); border: none; background: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); text-decoration: none; cursor: pointer; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-dropdown-item:hover, .fr-dropdown-item:focus-visible { background: var(--fr-brand-tint); outline: none; }
        .fr-dropdown-signout { color: var(--fr-danger); }
        .fr-dropdown-divider { height: 1px; background: var(--fr-line); margin: var(--fr-s2) 0; }
      `}</style>
    </div>
  );
}
