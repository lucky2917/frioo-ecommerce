export default function FetchError({ message, onRetry }) {
  return (
    <div className="fetch-error">
      <p className="fetch-error-msg">{message || "We couldn't load this right now. Please check your connection."}</p>
      {onRetry && (
        <button className="fetch-error-btn" onClick={onRetry}>Try Again</button>
      )}
      <style>{`
        .fetch-error { text-align: center; padding: 60px 20px; color: var(--fr-text-2); }
        .fetch-error-msg { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); margin-bottom: 18px; }
        .fetch-error-btn { background: var(--fr-brand); color: var(--fr-on-brand); border: none; padding: 12px 28px; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; transition: background 0.2s; }
        .fetch-error-btn:hover { background: var(--fr-brand-press); }
      `}</style>
    </div>
  );
}
