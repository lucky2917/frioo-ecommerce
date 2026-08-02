import { useConnectivity } from '../../hooks/useConnectivity';

const OfflineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 1l22 22" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const OnlineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

export default function ConnectivityBanner() {
  const { online, showRestored, dismissRestored } = useConnectivity();

  const offline = !online;
  if (!offline && !showRestored) return null;

  return (
    <div
      className={`fr-net${offline ? ' fr-net-off' : ' fr-net-on'}`}
      role="status"
      aria-live="polite"
      onClick={offline ? undefined : dismissRestored}
    >
      <span className="fr-net-icon">{offline ? <OfflineIcon /> : <OnlineIcon />}</span>
      <span className="fr-net-copy">
        <strong>{offline ? "You're offline" : 'Back online'}</strong>
        <span>{offline ? 'Some features may be unavailable.' : 'Everything is up to date.'}</span>
      </span>

      <style>{`
        .fr-net { position: fixed; z-index: var(--fr-z-toast); left: max(var(--fr-s4), env(safe-area-inset-left)); right: max(var(--fr-s4), env(safe-area-inset-right)); top: calc(var(--navbar-height-mobile) + var(--fr-s2)); max-width: 420px; margin-inline: auto; display: flex; align-items: center; gap: var(--fr-s3); padding: var(--fr-s3) var(--fr-s4); border-radius: var(--fr-r-card); box-shadow: var(--fr-elev-2); }
        .fr-net-off { background: var(--fr-text); color: #FFFFFF; }
        .fr-net-on { background: var(--fr-brand); color: var(--fr-on-brand); cursor: pointer; }
        .fr-net-icon { display: inline-flex; flex-shrink: 0; }
        .fr-net-copy { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .fr-net-copy strong { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); }
        .fr-net-copy span { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-snug); opacity: 0.85; }

        @media (min-width: 901px) {
          .fr-net { top: calc(var(--navbar-height-desktop) + var(--fr-s2)); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .fr-net { animation: fr-net-in var(--fr-dur-base) var(--fr-ease-settle); }
        }
        @keyframes fr-net-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
