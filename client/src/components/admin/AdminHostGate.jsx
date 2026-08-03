import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAdminHost } from '../../utils/adminHost';

export default function AdminHostGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!isAdminHost()) return;
    if (redirectedRef.current) return;
    if (location.pathname !== '/') return;

    // Safe to send everyone: on this host AdminRoute renders a sign-in panel
    // rather than redirecting back, so no cycle can form.
    redirectedRef.current = true;
    navigate('/admin', { replace: true });
  }, [location.pathname, navigate]);

  return null;
}
