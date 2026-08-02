import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';

import { CartProvider } from './context/CartProvider';
import { StoreSettingsProvider } from './context/StoreSettingsProvider';
import { loadShop, loadCart, loadProductDetails } from './lib/routeLoaders';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(loadShop);
const Cart = lazy(loadCart);
const ProductDetails = lazy(loadProductDetails);
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

const AboutUs = lazy(() => import('./pages/info/AboutUs'));
const Contact = lazy(() => import('./pages/info/Contact'));
const HelpFAQs = lazy(() => import('./pages/info/HelpFAQs'));
const OurStores = lazy(() => import('./pages/info/OurStores'));
const PrivacyPolicy = lazy(() => import('./pages/info/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/info/Terms'));
const ShippingPolicy = lazy(() => import('./pages/info/ShippingPolicy'));
const Returns = lazy(() => import('./pages/info/Returns'));

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import InstallPrompt from './components/pwa/InstallPrompt';
import UpdatePrompt from './components/pwa/UpdatePrompt';
import CouponPopup from './components/layout/CouponPopup';
import StorefrontLayout from './components/layout/StorefrontLayout';
import RouteFallback from './components/layout/RouteFallback';
import FeedbackRegion from './components/feedback/FeedbackRegion';

const AppInner = () => {
  return (
    <>
      <FeedbackRegion />
      <CouponPopup />
      <InstallPrompt />
      <UpdatePrompt />
      <Analytics />
      <SpeedInsights />

      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
            </Route>

            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route element={<StorefrontLayout />}>
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<HelpFAQs />} />
              <Route path="/stores" element={<OurStores />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/shipping" element={<ShippingPolicy />} />
              <Route path="/returns" element={<Returns />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StoreSettingsProvider>
          <BrowserRouter>
            <AppInner />
          </BrowserRouter>
        </StoreSettingsProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
