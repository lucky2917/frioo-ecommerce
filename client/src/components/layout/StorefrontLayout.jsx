import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import RouteFallback from './RouteFallback';

export default function StorefrontLayout() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </>
  );
}
