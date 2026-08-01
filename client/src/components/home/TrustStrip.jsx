import SwipeRow from './SwipeRow';
import {
  MAX_DELIVERY_RANGE_KM,
  MAX_TAKEAWAY_RANGE_KM,
  MIN_CART_VALUE
} from '../../config/constants';

const PROMISES = [
  {
    key: 'delivery',
    title: `Delivery within ${MAX_DELIVERY_RANGE_KM} km`,
    detail: 'Measured from our Allipuram kitchen',
    icon: (
      <>
        <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7z" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </>
    )
  },
  {
    key: 'minimum',
    title: `Orders from ₹${MIN_CART_VALUE}`,
    detail: 'Minimum basket for delivery',
    icon: (
      <>
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </>
    )
  },
  {
    key: 'takeaway',
    title: `Pickup up to ${MAX_TAKEAWAY_RANGE_KM} km`,
    detail: 'Collect from the counter instead',
    icon: (
      <>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
      </>
    )
  },
  {
    key: 'fresh',
    title: 'Picked each morning',
    detail: 'From local Vizag markets',
    icon: (
      <>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6" />
      </>
    )
  }
];

export default function TrustStrip() {
  return (
    <section className="fr-trust" aria-label="How Frioo delivers">
      <div className="fr-wrap">
        <SwipeRow className="fr-trust-grid" count={PROMISES.length} column="72%" onDark>
          {PROMISES.map(({ key, title, detail, icon }) => (
            <div className="fr-trust-item" key={key}>
              <span className="fr-trust-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              </span>
              <span className="fr-trust-copy">
                <span className="fr-trust-title">{title}</span>
                <span className="fr-trust-detail">{detail}</span>
              </span>
            </div>
          ))}
        </SwipeRow>
      </div>

      <style>{`
        .fr-trust { background: var(--fr-brand); color: var(--fr-on-brand); padding: var(--fr-s5) 0; }
        .fr-trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fr-s5); }
        .fr-trust-item { display: flex; align-items: center; gap: var(--fr-s3); min-width: 0; }
        .fr-trust-item + .fr-trust-item { border-left: 1px solid rgba(255, 255, 255, 0.16); padding-left: var(--fr-s5); }
        .fr-trust-icon { display: inline-flex; flex-shrink: 0; color: #A8D5B5; }
        .fr-trust-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .fr-trust-title { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); color: #FFFFFF; }
        .fr-trust-detail { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-snug); color: #B9D2C3; }

        @media (max-width: 900px) {
          .fr-trust-item { align-items: flex-start; padding: var(--fr-s4); background: rgba(255, 255, 255, 0.08); border-radius: var(--fr-r-card); }
          .fr-trust-item + .fr-trust-item { border-left: none; padding-left: var(--fr-s4); }
        }
      `}</style>
    </section>
  );
}
