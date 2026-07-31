import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {


  return (
    <footer className="fr-footer">
      <div className="fr-footer-main">
        <div className="fr-footer-col fr-footer-about">
          <h3 className="fr-footer-logo">Frioo<span>.</span></h3>
          <p className="fr-footer-tagline">Fresh fruits, juices &amp; salads in Visakhapatnam.</p>
          <p className="fr-footer-desc">
            Vizag's neighbourhood store for fresh fruits, pure juices, fruit shakes, and salads.
            Sourced daily, made fresh, delivered within 6&nbsp;km.
          </p>
          <address className="fr-footer-address">
            Railway Quarters, Allipuram<br />
            Visakhapatnam, AP 530004<br />
            India
          </address>
          <div className="fr-footer-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="fr-social" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="fr-social" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="fr-social" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>
            </a>
          </div>
        </div>

        <div className="fr-footer-col">
          <h4 className="fr-footer-heading">Shop</h4>
          <ul className="fr-footer-links">
            <li><Link to="/shop">Shop All</Link></li>
            <li><Link to="/shop?category=juices">Pure Juices</Link></li>
            <li><Link to="/shop?category=shakes">Fruit Shakes</Link></li>
            <li><Link to="/shop?category=salads">Fresh Salads</Link></li>
            <li><Link to="/shop?category=fruits">Fresh Fruits</Link></li>
          </ul>
        </div>

        <div className="fr-footer-col">
          <h4 className="fr-footer-heading">Help</h4>
          <ul className="fr-footer-links">
            <li><Link to="/orders">Track Order</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/faq">Help &amp; FAQs</Link></li>
            <li><Link to="/stores">Our Stores</Link></li>
            <li><Link to="/returns">Returns</Link></li>
          </ul>
        </div>

        <div className="fr-footer-col fr-footer-newsletter">
          <h4 className="fr-footer-heading">Stay fresh</h4>
          <p className="fr-footer-desc">Occasional notes on what's in season. No spam.</p>
          <p className="fr-newsletter-note">Sign-ups aren&apos;t open yet. Call us on <a href="tel:+919347043329">+91 93470 43329</a> to hear what&apos;s in season.</p>
          <div className="fr-footer-contact">
            <p className="fr-contact-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              +91 9347043329
            </p>
            <p className="fr-contact-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              frioo.trust@gmail.com
            </p>
          </div>
        </div>
      </div>

      <div className="fr-footer-bottom">
        <p className="fr-footer-copyright">&copy; {new Date().getFullYear()} Frioo. Fresh, honest, local.</p>
        <div className="fr-footer-legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/shipping">Shipping</Link>
        </div>
      </div>

      <style>{`
        .fr-footer { background: var(--fr-surface-2); border-top: 1px solid var(--fr-line); margin-top: auto; font-family: var(--fr-font-sans); }
        .fr-footer-main { max-width: var(--fr-container); margin: 0 auto; padding: var(--fr-s10) var(--fr-s7) var(--fr-s8); display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: var(--fr-s8); }
        .fr-footer-col { display: flex; flex-direction: column; }
        .fr-footer-logo { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0 0 var(--fr-s3); }
        .fr-footer-logo span { color: var(--fr-brand); }
        .fr-footer-tagline { color: var(--fr-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); margin: 0 0 var(--fr-s3); }
        .fr-footer-desc { color: var(--fr-text-2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); margin: 0 0 var(--fr-s4); max-width: 42ch; }
        .fr-footer-address { font-style: normal; color: var(--fr-text-3); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); margin: 0 0 var(--fr-s4); }
        .fr-footer-social { display: flex; gap: var(--fr-s2); }
        .fr-social { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--fr-r-pill); background: var(--fr-surface); border: 1px solid var(--fr-line); color: var(--fr-text-2); transition: color var(--fr-dur-quick) var(--fr-ease-standard), border-color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-social:hover { color: var(--fr-brand); border-color: var(--fr-brand); }
        .fr-social:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-footer-heading { font-family: var(--fr-font-sans); font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-eyebrow); text-transform: uppercase; color: var(--fr-text-3); margin: 0 0 var(--fr-s4); }
        .fr-footer-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--fr-s3); }
        .fr-footer-links a { color: var(--fr-text-2); text-decoration: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-control); transition: color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-footer-links a:hover { color: var(--fr-brand); }
        .fr-footer-links a:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }
        .fr-newsletter-note { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0 0 var(--fr-s4); }
        .fr-newsletter-note a { color: var(--fr-brand); font-weight: var(--fr-fw-medium); }
        .fr-newsletter-note a:hover { text-decoration: underline; text-underline-offset: 2px; }
        .fr-newsletter-input { flex: 1; min-width: 0; height: 44px; padding: 0 var(--fr-s3); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-control); color: var(--fr-text); outline: none; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), box-shadow var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-newsletter-input::placeholder { color: var(--fr-text-3); }
        .fr-newsletter-input:focus { border-color: var(--fr-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fr-brand) 16%, transparent); }
        .fr-newsletter-btn { height: 44px; padding: 0 var(--fr-s4); background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; white-space: nowrap; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-newsletter-btn:hover { background: var(--fr-brand-press); }
        .fr-newsletter-btn:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-footer-contact { display: flex; flex-direction: column; gap: var(--fr-s2); }
        .fr-contact-item { display: flex; align-items: center; gap: var(--fr-s2); color: var(--fr-text-2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); margin: 0; }
        .fr-contact-item svg { color: var(--fr-brand); flex-shrink: 0; }
        .fr-footer-bottom { max-width: var(--fr-container); margin: 0 auto; padding: var(--fr-s5) var(--fr-s7); border-top: 1px solid var(--fr-line); display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s4); flex-wrap: wrap; }
        .fr-footer-copyright { color: var(--fr-text-3); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); margin: 0; }
        .fr-footer-legal { display: flex; align-items: center; gap: var(--fr-s5); }
        .fr-footer-legal a { color: var(--fr-text-3); text-decoration: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-control); transition: color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-footer-legal a:hover { color: var(--fr-brand); }
        .fr-footer-legal a:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }

        @media (max-width: 900px) {
          .fr-footer-main { grid-template-columns: 1fr 1fr; gap: var(--fr-s7); padding: var(--fr-s8) var(--fr-s4) var(--fr-s6); }
          .fr-footer-about { grid-column: 1 / -1; }
          .fr-footer-newsletter { grid-column: 1 / -1; }
          .fr-footer-bottom { padding: var(--fr-s5) var(--fr-s4); }
        }
        @media (max-width: 520px) {
          .fr-footer-main { grid-template-columns: 1fr; }
          .fr-footer-bottom { flex-direction: column; align-items: flex-start; gap: var(--fr-s3); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fr-social, .fr-footer-links a, .fr-newsletter-input, .fr-newsletter-btn, .fr-footer-legal a { transition: none; }
        }
      `}</style>
    </footer>
  );
}
