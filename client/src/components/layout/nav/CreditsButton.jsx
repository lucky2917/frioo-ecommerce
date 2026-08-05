import { Link } from 'react-router-dom';
import { useMyCredits } from '../../../hooks/useMyCredits';

const compact = (paise) => {
    const rupees = Number(paise || 0) / 100;
    if (rupees >= 1000) {
        const k = Math.round((rupees / 1000) * 10) / 10;
        return `₹${k}k`;
    }
    return `₹${Math.round(rupees)}`;
};

const full = (paise) =>
    `₹${(Number(paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function CreditsButton({ signedIn }) {
    const { summary, loading } = useMyCredits();

    if (!signedIn) return null;
    if (loading && !summary) return null;

    const available = Number(summary?.available_paise || 0);
    const hasCredits = available > 0;

    return (
        <Link
            to="/credits"
            className={`fr-credits${hasCredits ? ' fr-credits-on' : ''}`}
            aria-label={hasCredits ? `Frioo Credits, ${full(available)} available` : 'Frioo Credits'}
        >
            <span className="fr-credits-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="3" />
                    <path d="M2 10h20" />
                    <path d="M7 15h3" />
                </svg>
            </span>
            <span className="fr-credits-value">{hasCredits ? full(available) : 'Credits'}</span>
            <span className="fr-credits-value-sm" aria-hidden="true">
                {hasCredits ? compact(available) : ''}
            </span>

            <style>{`
                .fr-credits { display: inline-flex; align-items: center; gap: var(--fr-s2); height: 44px; padding: 0 var(--fr-s3); border-radius: var(--fr-r-pill); text-decoration: none; color: var(--fr-text); transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
                .fr-credits:hover { background: var(--fr-surface-2); }
                .fr-credits:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
                .fr-credits-on { color: var(--fr-brand); }
                .fr-credits-icon { display: inline-flex; }
                .fr-credits-value { font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-semibold); line-height: var(--fr-lh-control); font-variant-numeric: tabular-nums; }
                .fr-credits-value-sm { display: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-bold); font-variant-numeric: tabular-nums; }
                @media (max-width: 900px), (pointer: coarse) and (max-width: 1100px) {
                    .fr-credits { gap: 4px; padding: 0 var(--fr-s2); }
                    .fr-credits-value { display: none; }
                    .fr-credits-value-sm { display: inline; }
                }
                @media (prefers-reduced-motion: reduce) { .fr-credits { transition: none; } }
            `}</style>
        </Link>
    );
}
