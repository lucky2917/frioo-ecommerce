import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import RouteFallback from './RouteFallback';

export default function StorefrontLayout() {
  return (
    <>
      <Navbar />
      <div className="fr-shell">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
