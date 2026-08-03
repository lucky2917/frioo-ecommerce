import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ADMIN_HOSTS = ['admin.frioo.in'];

const isAdminHost = () => ADMIN_HOSTS.includes(window.location.hostname);

export default function AdminHostGate() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminHost()) return;
    if (location.pathname.startsWith('/admin')) return;

    navigate('/admin', { replace: true });
  }, [location.pathname, navigate]);

  return null;
}
