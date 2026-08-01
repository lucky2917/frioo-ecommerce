import { useStoreSettings } from '../../context/store-settings-context';

export default function StoreNotice() {
  const { closedNotice } = useStoreSettings();

  if (!closedNotice) return null;

  return (
    <div className="fr-store-notice" role="status">
      <div className="fr-store-notice-inner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
        </svg>
        <span className="fr-store-notice-text">
          <strong>{closedNotice.title}</strong>
          <span>{closedNotice.detail}</span>
        </span>
      </div>

      <style>{`
        .fr-store-notice { background: var(--fr-danger); color: #FFFFFF; }
        .fr-store-notice-inner { max-width: var(--fr-container); margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: var(--fr-s3); padding: var(--fr-s3) var(--fr-s4); text-align: left; }
        .fr-store-notice svg { flex-shrink: 0; }
        .fr-store-notice-text { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--fr-s2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); }
        .fr-store-notice-text strong { font-weight: var(--fr-fw-bold); }
        .fr-store-notice-text span { opacity: 0.9; }
      `}</style>
    </div>
  );
}
