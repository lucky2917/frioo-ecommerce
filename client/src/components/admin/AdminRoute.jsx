import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="adm-route-loading" role="status">
        <span className="adm-route-spinner" aria-hidden="true" />
        <p>Verifying credentials</p>
        <style>{`
          .adm-route-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--fr-s4);
            background: var(--adm-canvas);
            font-family: var(--fr-font-sans);
            color: var(--adm-text-2);
          }
          .adm-route-loading p { margin: 0; font-size: 0.9rem; font-weight: 600; }
          .adm-route-spinner {
            width: 36px;
            height: 36px;
            border: 3px solid var(--adm-border);
            border-top-color: var(--fr-brand);
            border-radius: 50%;
          }
          @media (prefers-reduced-motion: no-preference) {
            .adm-route-spinner { animation: adm-route-spin 0.8s linear infinite; }
          }
          @keyframes adm-route-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
