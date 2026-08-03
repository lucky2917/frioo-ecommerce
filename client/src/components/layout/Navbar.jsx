import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDialog } from '../../hooks/useDialog';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { useCart } from '../../context/cart-context';
import { supabase } from '../../lib/supabaseClient';
import { logger } from '../../utils/logger';
import {
  ORDER_STATUS_FLOW,
  getStatusPresentation,
  getStatusStepIndex,
  getStatusProgress,
  formatOrderAmount,
} from '../../utils/orderStatus';
import ContextStrip from './nav/ContextStrip';
import CategoryNavigation from './nav/CategoryNavigation';
import SearchBar from './nav/SearchBar';
import UserMenu from './nav/UserMenu';
import CartButton from './nav/CartButton';
import MobileDrawer from './nav/MobileDrawer';

export default function Navbar() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { cartCount } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const blurTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(blurTimerRef.current), []);

  const accountRef = useRef(null);
  useEffect(() => {
    if (!showDropdown) return;

    const closeOnOutside = (event) => {
      if (!accountRef.current?.contains(event.target)) setShowDropdown(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowDropdown(false);
    };

    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showDropdown]);

  const [lastSearchQuery, setLastSearchQuery] = useState(searchQuery);
  if (searchQuery !== lastSearchQuery) {
    setLastSearchQuery(searchQuery);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  }

  useEffect(() => {
    if (searchQuery.trim().length < 2) return;

    const controller = new AbortController();
    const debounceTimer = setTimeout(async () => {
      try {
        const term = searchQuery.replace(/["\\]/g, '\\$&');
        const { data, error } = await supabase
          .from('products')
          .select('id, title, category, price_cents, images')
          .or(`title.ilike."%${term}%",category.ilike."%${term}%"`)
          .limit(5)
          .abortSignal(controller.signal);

        if (controller.signal.aborted) return;

        if (!error && data) {
          setSearchResults(data);
        }
        setIsSearching(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        logger.error('Search error:', err);
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [searchQuery]);

  const [activeOrder, setActiveOrder] = useState(null);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const trackerDialogRef = useRef(null);
  const trackerCloseRef = useRef(null);

  useDialog({ open: showTrackerModal, onClose: () => setShowTrackerModal(false), dialogRef: trackerDialogRef, initialFocusRef: trackerCloseRef });

  const trackerStatus = getStatusPresentation(activeOrder?.status);
  const trackerStep = getStatusStepIndex(activeOrder?.status);
  const trackerItems = useMemo(() => {
    let items = activeOrder?.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    return Array.isArray(items) ? items : [];
  }, [activeOrder]);

  const [lastLocation, setLastLocation] = useState(location);
  if (location !== lastLocation) {
    setLastLocation(location);
    setIsMobileMenuOpen(false);
    setShowDropdown(false);
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowMobileSearch(false);
      } else {
        setShowMobileSearch(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const checkOrderValidity = (order) => {
    if (order.status !== 'delivered') {
      setActiveOrder(order);
    } else {
      const deliveryTime = new Date(order.updated_at || order.created_at).getTime();
      const now = new Date().getTime();
      if ((now - deliveryTime) / 60000 < 30) {
        setActiveOrder(order);
      } else {
        setActiveOrder(null);
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchActiveOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) checkOrderValidity(data);
    };

    fetchActiveOrder();

    const channel = supabase
      .channel('navbar-tracker')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
        checkOrderValidity(payload.new);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (!term) return;
    navigate(`/shop?search=${encodeURIComponent(term)}`);
    setShowSearchResults(false);
    setIsMobileMenuOpen(false);
  };

  const handleResultClick = (id) => {
    navigate(`/product/${id}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 1) setShowSearchResults(true);
  };
  const handleSearchFocus = () => { if (searchQuery.length > 1) setShowSearchResults(true); };
  const handleSearchBlur = () => {
    clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => setShowSearchResults(false), 200);
  };

  return (
    <>
      <header className="fr-header">
        <ContextStrip activeOrder={activeOrder} onTrack={() => setShowTrackerModal(true)} />

        <div className="fr-bar-inner">
          <button
            className="fr-hamburger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link to="/" className="fr-logo-link" aria-label="Frioo home">
            <h1 className="fr-logo">Frioo<span>.</span></h1>
          </Link>

          <div className="fr-bar-center">
            <CategoryNavigation />
          </div>

          <div className="fr-bar-right">
            <div className="fr-desktop fr-search-slot">
              <SearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                onSubmit={handleSearch}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                showResults={showSearchResults}
                isSearching={isSearching}
                results={searchResults}
                onResultClick={handleResultClick}
              />
            </div>

            <div className="fr-account" ref={accountRef}>
              <UserMenu
                user={user}
                open={showDropdown}
                onToggle={() => setShowDropdown(!showDropdown)}
                onSignOut={signOut}
                onSignIn={signInWithGoogle}
              />
            </div>

            <CartButton count={cartCount} />
          </div>
        </div>

        <form
          className={`fr-mobile-search ${showMobileSearch ? '' : 'fr-mobile-search-hidden'}`}
          onSubmit={handleSearch}
          role="search"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            className="fr-mobile-search-input"
            placeholder="Search for mango, guava&hellip;"
            aria-label="Search products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </header>

      <MobileDrawer open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {showTrackerModal && activeOrder && (
        <div className="fr-modal-scrim fr-dialog-scrim" onClick={() => setShowTrackerModal(false)}>
          <div className="fr-modal fr-dialog-panel" ref={trackerDialogRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Order tracking">
            <div className="fr-modal-head">
              <h3 className="fr-modal-title">Order tracking</h3>
              <button className="fr-modal-close" ref={trackerCloseRef} onClick={() => setShowTrackerModal(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="fr-modal-body">
              <span className={`fr-modal-chip fr-status--${trackerStatus.tone}`}>{trackerStatus.label}</span>

              <div className="fr-modal-progress">
                <div className="fr-modal-track">
                  <div className="fr-modal-fill" style={{ width: `${getStatusProgress(activeOrder.status)}%` }} />
                </div>
                <ol className="fr-modal-steps">
                  {ORDER_STATUS_FLOW.map((stepKey, index) => (
                    <li key={stepKey} className={`fr-modal-step${index <= trackerStep ? ' fr-modal-step-done' : ''}`}>
                      <span className="fr-modal-dot" aria-hidden="true" />
                      <span className="fr-modal-step-label">{getStatusPresentation(stepKey).label}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="fr-modal-row"><span>Order</span><span>#{activeOrder.id}</span></div>
              <div className="fr-modal-row"><span>Type</span><span className="fr-modal-status">{activeOrder.order_type}</span></div>

              {trackerItems.length > 0 && (
                <div className="fr-modal-items">
                  {trackerItems.map((item, index) => (
                    <div className="fr-modal-row" key={index}>
                      <span>{item.qty}x {item.title}{item.variant && item.variant !== 'Standard' ? ` (${item.variant})` : ''}</span>
                      <span>&#8377;{formatOrderAmount(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="fr-modal-total"><span>Total</span><span>&#8377;{formatOrderAmount(activeOrder.total_amount)}</span></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fr-header { position: fixed; top: 0; left: 0; right: 0; z-index: var(--fr-z-nav); background: var(--fr-surface); border-bottom: 1px solid var(--fr-line); }

        .fr-bar-inner { display: flex; align-items: center; gap: var(--fr-s5); height: 60px; max-width: var(--fr-container); margin: 0 auto; padding-left: max(var(--fr-s7), env(safe-area-inset-left)); padding-right: max(var(--fr-s7), env(safe-area-inset-right)); }

        .fr-hamburger, .fr-icon-btn { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: var(--fr-text); cursor: pointer; border-radius: var(--fr-r-pill); flex-shrink: 0; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-hamburger { display: none; }
        .fr-hamburger:hover, .fr-icon-btn:hover { background: var(--fr-surface-2); }
        .fr-hamburger:focus-visible, .fr-icon-btn:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

        .fr-logo-link { text-decoration: none; flex-shrink: 0; }
        .fr-logo-link:hover .fr-logo { color: var(--fr-brand); }
        .fr-logo { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0; }
        .fr-logo span { color: var(--fr-brand); }

        .fr-bar-center { flex: 1; min-width: 0; display: flex; justify-content: center; }
        .fr-bar-right { display: flex; align-items: center; gap: var(--fr-s3); flex-shrink: 0; }
        .fr-search-slot { width: 320px; }

        .fr-desktop { display: flex; }
        .fr-mobile { display: none; }
        .fr-account { display: flex; align-items: center; }

        .fr-mobile-search { display: none; align-items: center; gap: var(--fr-s2); height: 44px; margin: 0 max(var(--fr-s4), env(safe-area-inset-right)) var(--fr-s2) max(var(--fr-s4), env(safe-area-inset-left)); padding: 0 var(--fr-s4); background: var(--fr-surface-2); border: 1px solid var(--fr-line); border-radius: var(--fr-r-pill); overflow: hidden; }
        .fr-mobile-search:focus-within { border-color: var(--fr-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fr-brand) 16%, transparent); background: var(--fr-surface); }
        .fr-mobile-search svg { color: var(--fr-text-3); flex-shrink: 0; }
        .fr-mobile-search-input { flex: 1; min-width: 0; border: none; background: none; outline: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-control); color: var(--fr-text); }
        .fr-mobile-search-input::placeholder { color: var(--fr-text-3); }
        .fr-mobile-search-hidden { height: 0; margin-top: 0; margin-bottom: 0; border-color: transparent; opacity: 0; }

        .fr-modal-scrim { position: fixed; inset: 0; z-index: var(--fr-z-modal); background: var(--fr-scrim); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: var(--fr-s5); }
        .fr-modal { width: 100%; min-width: 0; max-width: 460px; background: var(--fr-surface); border-radius: var(--fr-r-surface); box-shadow: var(--fr-elev-3); overflow: hidden; }
        .fr-modal-head { display: flex; align-items: center; justify-content: space-between; padding: var(--fr-s5); border-bottom: 1px solid var(--fr-line); }
        .fr-modal-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0; }
        .fr-modal-close { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: var(--fr-text-2); cursor: pointer; border-radius: var(--fr-r-control); }
        .fr-modal-close:hover { background: var(--fr-surface-2); }
        .fr-modal-close:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .fr-modal-body { padding: var(--fr-s5); display: flex; flex-direction: column; gap: var(--fr-s3); }
        .fr-modal-row { display: flex; align-items: center; justify-content: space-between; font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); }
        .fr-modal-row > span:first-child { color: var(--fr-text-2); }
        .fr-modal-row > span:last-child { color: var(--fr-text); font-weight: var(--fr-fw-medium); }
        .fr-modal-status { text-transform: capitalize; color: var(--fr-brand) !important; }
        .fr-modal-body { max-height: 72vh; overflow-y: auto; }
        .fr-modal-chip { align-self: flex-start; padding: var(--fr-s1) var(--fr-s3); border-radius: var(--fr-r-pill); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); }
        .fr-status--info { background: var(--fr-info-tint); color: var(--fr-info); }
        .fr-status--brand { background: var(--fr-brand-tint); color: var(--fr-brand); }
        .fr-status--success { background: var(--fr-brand-tint); color: var(--fr-success); }
        .fr-status--danger { background: var(--fr-warm-tint); color: var(--fr-danger); }
        .fr-modal-progress { margin: var(--fr-s2) 0 var(--fr-s3); }
        .fr-modal-track { position: relative; height: 4px; background: var(--fr-line); border-radius: var(--fr-r-pill); margin-bottom: var(--fr-s3); }
        .fr-modal-fill { position: absolute; inset: 0 auto 0 0; height: 4px; background: var(--fr-brand); border-radius: var(--fr-r-pill); transition: width var(--fr-dur-expressive) var(--fr-ease-settle); }
        .fr-modal-steps { display: flex; justify-content: space-between; list-style: none; margin: 0; padding: 0; gap: var(--fr-s1); }
        .fr-modal-step { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0; }
        .fr-modal-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--fr-line-strong); margin-bottom: var(--fr-s2); }
        .fr-modal-step-done .fr-modal-dot { background: var(--fr-brand); }
        .fr-modal-step-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-snug); color: var(--fr-text-3); text-align: center; }
        .fr-modal-step-done .fr-modal-step-label { color: var(--fr-text-2); font-weight: var(--fr-fw-medium); }
        .fr-modal-items { display: flex; flex-direction: column; gap: var(--fr-s2); padding-top: var(--fr-s3); border-top: 1px solid var(--fr-line); }
        .fr-modal-total { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s3); padding-top: var(--fr-s3); border-top: 1px solid var(--fr-line); font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-normal); color: var(--fr-text); font-variant-numeric: tabular-nums; }
        @media (prefers-reduced-motion: reduce) { .fr-modal-fill { transition: none; } }

        @media (max-width: 900px), (pointer: coarse) and (max-width: 1100px) {
          .fr-bar-inner { height: 52px; gap: var(--fr-s3); padding-left: max(var(--fr-s4), env(safe-area-inset-left)); padding-right: max(var(--fr-s4), env(safe-area-inset-right)); }
          .fr-hamburger { display: inline-flex; }
          .fr-bar-center { display: none; }
          .fr-bar-right { flex: 1; justify-content: flex-end; }
          .fr-desktop { display: none !important; }
          .fr-mobile { display: inline-flex !important; }
          .fr-mobile-search { display: flex; }
        }

        @media (prefers-reduced-motion: no-preference) {
          .fr-mobile-search { transition: height var(--fr-dur-base) var(--fr-ease-standard), opacity var(--fr-dur-base) var(--fr-ease-standard), margin var(--fr-dur-base) var(--fr-ease-standard); }
        }
      `}</style>
    </>
  );
}
