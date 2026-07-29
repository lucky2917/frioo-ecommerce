import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

import { CartProvider, useCart } from './context/CartContext';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Cart = lazy(() => import('./pages/Cart'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));

const AboutUs = lazy(() => import('./pages/info/AboutUs'));
const Contact = lazy(() => import('./pages/info/Contact'));
const HelpFAQs = lazy(() => import('./pages/info/HelpFAQs'));
const OurStores = lazy(() => import('./pages/info/OurStores'));
const PrivacyPolicy = lazy(() => import('./pages/info/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/info/Terms'));
const ShippingPolicy = lazy(() => import('./pages/info/ShippingPolicy'));
const Returns = lazy(() => import('./pages/info/Returns'));

import CouponPopup from './components/layout/CouponPopup';
import OrderTracker from './components/layout/OrderTracker';

const Notification = ({ msg }) => {
  if (!msg) return null;
  return (
    <div className="toast-notification">
      <div className="toast-content">
        <span className="toast-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </span>
        <div className="toast-text">
          <strong className="toast-title">Cart Updated</strong>
          <div className="toast-msg">{msg}</div>
        </div>
      </div>
    </div>
  );
};

const AppInner = () => {
  const { notification } = useCart();

  return (
    <>
      <Notification msg={notification} />
      <OrderTracker />
      <CouponPopup />

      <ErrorBoundary>
        <Suspense fallback={
          <div className="app-loading">
            <LoadingSpinner />
            <p style={{ color: '#666', fontFamily: 'var(--fr-font-sans)', fontSize: 'var(--fr-fs-body)', fontWeight: 'var(--fr-fw-regular)', lineHeight: 'var(--fr-lh-normal)' }}>Freshness loading...</p>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />

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
            </Route>

            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<HelpFAQs />} />
            <Route path="/stores" element={<OurStores />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/returns" element={<Returns />} />

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
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
