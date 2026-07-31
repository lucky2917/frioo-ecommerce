import './styles';

export default function AdminErrorState({ message, onRetry }) {
  return (
    <div className="adm-state" role="alert">
      <p className="adm-state-title">This didn&apos;t load</p>
      <p className="adm-state-text">{message}</p>
      {onRetry && (
        <button className="adm-btn adm-btn-secondary" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}
