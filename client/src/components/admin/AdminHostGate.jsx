import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';

const ADMIN_HOSTS = ['admin.frioo.in'];

const isAdminHost = () => ADMIN_HOSTS.includes(window.location.hostname);

export default function AdminHostGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!isAdminHost()) return;
    if (redirectedRef.current) return;
    if (loading) return;
    if (location.pathname !== '/') return;

    // Only send admins onward. AdminRoute bounces everyone else back to "/",
    // and redirecting them again is an infinite loop.
    if (profile?.role !== 'admin') return;

    redirectedRef.current = true;
    navigate('/admin', { replace: true });
  }, [loading, profile?.role, location.pathname, navigate]);

  return null;
}
