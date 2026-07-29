import React, { useState, useEffect } from 'react';

export default function CouponPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const welcomeSeen = localStorage.getItem('frioo_welcome_seen');
    if (!welcomeSeen) {
      setTimeout(() => setShow(true), 1500);
      localStorage.setItem('frioo_welcome_seen', 'true');
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fr-welcome-scrim" onClick={() => setShow(false)}>
      <div className="fr-welcome" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Welcome to Frioo">
        <button className="fr-welcome-close" onClick={() => setShow(false)} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <span className="fr-welcome-mark">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        </span>
        <h2 className="fr-welcome-title">Welcome to Frioo</h2>
        <p className="fr-welcome-text">We deliver fresh juices, shakes &amp; salads across <strong>Visakhapatnam</strong>.</p>
        <div className="fr-welcome-facts">
          <div className="fr-welcome-fact">
            <span className="fr-welcome-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
            </span>
            <div>
              <strong>Delivery range</strong>
              <p>Within 6&nbsp;km radius</p>
            </div>
          </div>
          <div className="fr-welcome-fact">
            <span className="fr-welcome-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M3 9h18a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2z" /></svg>
            </span>
            <div>
              <strong>Pickup available</strong>
              <p>At our Visakhapatnam store</p>
            </div>
          </div>
        </div>
        <button className="fr-welcome-btn" onClick={() => setShow(false)}>Start shopping</button>
      </div>
      <style>{`
        .fr-welcome-scrim { position: fixed; inset: 0; z-index: var(--fr-z-modal); background: var(--fr-scrim); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: var(--fr-s5); }
        .fr-welcome { position: relative; width: 100%; max-width: 400px; background: var(--fr-surface); border-radius: var(--fr-r-surface); box-shadow: var(--fr-elev-3); padding: var(--fr-s8) var(--fr-s7); text-align: center; font-family: var(--fr-font-sans); }
        .fr-welcome-close { position: absolute; top: var(--fr-s3); right: var(--fr-s3); width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: var(--fr-text-3); cursor: pointer; border-radius: var(--fr-r-control); }
        .fr-welcome-close:hover { background: var(--fr-surface-2); color: var(--fr-text); }
        .fr-welcome-close:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-welcome-mark { width: 56px; height: 56px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--fr-r-pill); background: var(--fr-brand-tint); color: var(--fr-brand); margin-bottom: var(--fr-s3); }
        .fr-welcome-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0 0 var(--fr-s2); }
        .fr-welcome-text { color: var(--fr-text-2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); margin: 0 0 var(--fr-s5); }
        .fr-welcome-text strong { color: var(--fr-text); font-weight: var(--fr-fw-medium); }
        .fr-welcome-facts { background: var(--fr-surface-2); border-radius: var(--fr-r-card); padding: var(--fr-s4); margin-bottom: var(--fr-s5); text-align: left; display: flex; flex-direction: column; gap: var(--fr-s4); }
        .fr-welcome-fact { display: flex; align-items: flex-start; gap: var(--fr-s3); }
        .fr-welcome-icon { color: var(--fr-brand); flex-shrink: 0; margin-top: 2px; }
        .fr-welcome-fact strong { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); color: var(--fr-text); }
        .fr-welcome-fact p { margin: 2px 0 0; font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-3); }
        .fr-welcome-btn { width: 100%; height: 48px; background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-welcome-btn:hover { background: var(--fr-brand-press); }
        .fr-welcome-btn:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        @media (prefers-reduced-motion: no-preference) { .fr-welcome { animation: fr-welcome-pop var(--fr-dur-expressive) var(--fr-ease-settle); } }
        @keyframes fr-welcome-pop { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
