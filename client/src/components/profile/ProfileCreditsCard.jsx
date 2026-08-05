import { Link } from 'react-router-dom';
import { useMyCredits } from '../../hooks/useMyCredits';
import { rupees, formatDate } from '../../utils/creditFormat';
import { expiryNotice } from '../../utils/creditExpiry';

export default function ProfileCreditsCard() {
    const { summary, loading } = useMyCredits();

    if (loading && !summary) return null;

    const available = Number(summary?.available_paise || 0);
    const lots = summary?.lots ?? [];
    const nextLot = lots.length > 0 ? lots[0] : null;
    const notice = nextLot ? expiryNotice(nextLot.expires_at) : null;
    const suspended = summary?.status === 'suspended';

    return (
        <section className="pcc" aria-label="Frioo Credits">
            <div className="pcc-main">
                <span className="pcc-label">Frioo Credits</span>
                <strong className="pcc-value">₹{rupees(available)}</strong>
                {suspended ? (
                    <span className="pcc-meta pcc-hold">Account on hold</span>
                ) : nextLot ? (
                    <span className={`pcc-meta${notice?.urgent ? ' pcc-urgent' : ''}`}>
                        ₹{rupees(nextLot.remaining_paise)} expires {formatDate(nextLot.expires_at)}
                    </span>
                ) : (
                    <span className="pcc-meta">Buy a plan at the store to get started</span>
                )}
            </div>

            <Link to="/credits" className="pcc-btn">View credits</Link>

            <style>{`
                .pcc { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s4); padding: var(--fr-s5); margin-bottom: var(--fr-s6); background: var(--fr-brand-tint, #E8F2EA); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); }
                .pcc-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
                .pcc-label { font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .pcc-value { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); color: var(--fr-brand); font-variant-numeric: tabular-nums; }
                .pcc-meta { font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .pcc-urgent { color: #A3352A; font-weight: var(--fr-fw-semibold); }
                .pcc-hold { color: #7A5B14; font-weight: var(--fr-fw-semibold); }
                .pcc-btn { flex-shrink: 0; display: inline-flex; align-items: center; min-height: 44px; padding: 0 var(--fr-s5); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-semibold); color: var(--fr-text-1); text-decoration: none; }
                .pcc-btn:hover { border-color: var(--fr-brand); color: var(--fr-brand); }
                .pcc-btn:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
                @media (max-width: 520px) { .pcc { flex-direction: column; align-items: stretch; } .pcc-btn { justify-content: center; } }
            `}</style>
        </section>
    );
}
