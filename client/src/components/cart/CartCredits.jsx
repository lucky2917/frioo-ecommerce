import { Link } from 'react-router-dom';
import { rupees } from '../../utils/creditFormat';

export default function CartCredits({ preview, loading }) {
    if (loading && !preview) return null;
    if (!preview) return null;
    if (preview.available_paise === 0 && !preview.suspended) return null;

    const { available_paise: available, applicable_paise: applicable,
            remaining_paise: remaining, covers_order: covers, suspended } = preview;

    if (suspended) {
        return (
            <section className="cc cc-hold" aria-label="Frioo Credits">
                <p className="cc-hold-text">
                    Your credit balance of ₹{rupees(available)} is on hold, so it will not be used for this order.
                    <Link to="/credits" className="cc-link"> View credits</Link>
                </p>
            </section>
        );
    }

    return (
        <section className="cc" aria-label="Frioo Credits">
            <div className="cc-head">
                <span className="cc-title">Frioo Credits</span>
                <Link to="/credits" className="cc-link">View</Link>
            </div>

            <div className="cc-rows">
                <div className="cc-row">
                    <span>Available balance</span>
                    <span>₹{rupees(available)}</span>
                </div>
                <div className="cc-row cc-row-applied">
                    <span>Credits applied to this order</span>
                    <span>−₹{rupees(applicable)}</span>
                </div>
                <div className="cc-row cc-row-due">
                    <span>{covers ? 'Nothing left to pay' : 'Amount still to pay'}</span>
                    <span>₹{rupees(remaining)}</span>
                </div>
            </div>

            <p className="cc-note">
                {covers
                    ? 'This order is fully covered by your Frioo Credits.'
                    : `Your credits cover ₹${rupees(applicable)}. The remaining ₹${rupees(remaining)} is collected the usual way.`}
                {' '}Credits closest to expiry are used first.
            </p>

            <style>{`
                .cc { padding: var(--fr-s5); margin-bottom: var(--fr-s5); background: var(--fr-brand-tint, #E8F2EA); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); }
                .cc-hold { background: #FFF8E6; border-color: #E8D9A8; }
                .cc-hold-text { margin: 0; font-size: var(--fr-fs-caption); line-height: 1.55; color: #6B5518; }
                .cc-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fr-s3); margin-bottom: var(--fr-s3); }
                .cc-title { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .cc-link { font-size: var(--fr-fs-label); font-weight: var(--fr-fw-semibold); color: var(--fr-brand); text-decoration: none; }
                .cc-link:hover { text-decoration: underline; }
                .cc-rows { display: flex; flex-direction: column; gap: var(--fr-s2); margin-bottom: var(--fr-s3); }
                .cc-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fr-s3); font-size: var(--fr-fs-caption); color: var(--fr-text-2); font-variant-numeric: tabular-nums; }
                .cc-row-applied span:last-child { font-weight: var(--fr-fw-bold); color: var(--fr-brand); }
                .cc-row-due { padding-top: var(--fr-s2); border-top: 1px solid var(--fr-line); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .cc-note { margin: 0; font-size: var(--fr-fs-label); line-height: 1.55; color: var(--fr-text-3); }
            `}</style>
        </section>
    );
}
