import './styles';

export default function MetricCard({ label, value, sub, tone = 'default', icon }) {
  return (
    <div className={`adm-metric adm-metric--${tone}`}>
      <div className="adm-metric-top">
        <span className="adm-metric-label">{label}</span>
        {icon && <span className="adm-metric-icon" aria-hidden="true">{icon}</span>}
      </div>
      <div className="adm-metric-value">{value}</div>
      {sub && <div className="adm-metric-sub">{sub}</div>}
    </div>
  );
}
