import './styles';

export default function AdminPage({ title, subtitle, actions, metrics, toolbar, children }) {
  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <h1 className="adm-page-title">{title}</h1>
          {subtitle && <p className="adm-page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="adm-page-actions">{actions}</div>}
      </header>
      {metrics && <div className="adm-metrics">{metrics}</div>}
      {toolbar && <div className="adm-toolbar">{toolbar}</div>}
      {children}
    </div>
  );
}
