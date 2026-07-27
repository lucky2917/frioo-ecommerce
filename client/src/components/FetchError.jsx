export default function FetchError({ message, onRetry }) {
  return (
    <div className="fetch-error">
      <p className="fetch-error-msg">{message || "We couldn't load this right now. Please check your connection."}</p>
      {onRetry && (
        <button className="fetch-error-btn" onClick={onRetry}>Try Again</button>
      )}
      <style>{`
        .fetch-error { text-align: center; padding: 60px 20px; color: #555; }
        .fetch-error-msg { font-size: 1rem; margin-bottom: 18px; line-height: 1.5; }
        .fetch-error-btn { background: #111; color: #fff; border: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
        .fetch-error-btn:hover { background: #333; }
      `}</style>
    </div>
  );
}
