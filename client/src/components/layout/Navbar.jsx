import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabaseClient';
import { logger } from '../../utils/logger';

export default function Navbar() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { cartCount } = useCart(); // [NEW] Use global cart count
  const [showDropdown, setShowDropdown] = useState(false);

  // SEARCH STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Database Search with Debouncing
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Debounce: wait 300ms after user stops typing
    const debounceTimer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, category, price_cents, images')
          .or(`title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
          .limit(5);

        if (!error && data) {
          setSearchResults(data);
        }
      } catch (err) {
        logger.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // TRACKING STATE
  const [activeOrder, setActiveOrder] = useState(null);
  const [showTrackerModal, setShowTrackerModal] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
  }, [location]);

  // Scroll detection for mobile search bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide search
        setShowMobileSearch(false);
      } else {
        // Scrolling up - show search
        setShowMobileSearch(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const checkOrderValidity = (order) => {
    if (order.status !== 'Delivered') {
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

  // --- LIVE ORDER LISTENER ---
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
    if (searchQuery.trim()) {
      navigate(`/shop?search=${searchQuery}`);
      setShowSearchResults(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleResultClick = (id) => {
    navigate(`/product/${id}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="navbar-wrapper">
        {/* TOP ANNOUNCEMENT BAR - Show order tracker OR service area info */}
        {activeOrder ? (
          <div className="tracker-bar" onClick={() => setShowTrackerModal(true)}>
            <div className="tracker-content">
              <span className="pulse-dot"></span>
              <span>Order #{activeOrder.id}: <strong>{activeOrder.status}</strong></span>
              <span className="track-link">Tap to Track →</span>
            </div>
          </div>
        ) : (
          <div className="service-area-bar">
            <div className="service-area-content">
              <span>📍</span>
              <span>Delivering fresh in <strong>Visakhapatnam</strong> • Within 6km radius</span>
            </div>
          </div>
        )}

        {/* MAIN NAVBAR ROW */}
        <div className="main-navbar">
          <div className="navbar-container">
            {/* MOBILE MENU TOGGLE */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

            {/* LOGO */}
            <Link to="/" className="logo-link">
              <h1 className="logo">Frioo.</h1>
            </Link>

            {/* DESKTOP SEARCH */}

            <div className="search-wrapper desktop-only">
              <form className="search-form" onSubmit={handleSearch}>
                <button type="submit" className="search-icon-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for anything..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length > 1) setShowSearchResults(true);
                  }}
                  onFocus={() => searchQuery.length > 1 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                />
              </form>

              {/* INSTANT SEARCH DROPDOWN */}
              {showSearchResults && (
                <div className="search-dropdown">
                  {isSearching ? (
                    <div className="search-loading">
                      <div className="loading-spinner"></div>
                      <span>Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(p => (
                      <div key={p.id} className="search-result-item" onClick={() => handleResultClick(p.id)}>
                        <img src={p.images?.[0]} alt={p.title} className="result-img" />
                        <div className="result-info">
                          <div className="result-title">{p.title}</div>
                          <div className="result-price">₹{(p.price_cents / 100).toFixed(2)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">No products found</div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT ACTIONS */}
            <div className="nav-actions">
              {user ? (
                <div className="user-menu desktop-only">
                  <button className="avatar-btn" onClick={() => setShowDropdown(!showDropdown)}>
                    {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata.avatar_url || user.user_metadata.picture}
                        alt="User"
                        className="user-avatar"
                      />
                    ) : (
                      <div className="user-avatar-placeholder">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  {showDropdown && (
                    <div className="dropdown-menu">
                      <Link to="/profile" className="dropdown-item">My Profile</Link>
                      <Link to="/orders" className="dropdown-item">My Orders</Link>
                      <div className="dropdown-divider"></div>
                      <button onClick={signOut} className="dropdown-item logout-btn">Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (

                <button className="icon-btn desktop-only" onClick={signInWithGoogle}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Login</span>
                </button>
              )}

              {/* Mobile User Icon */}
              <button className="icon-btn mobile-only" onClick={user ? () => navigate('/orders') : signInWithGoogle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              <Link to="/cart" className="cart-btn">
                <div className="cart-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
                </div>
                <span className="desktop-only cart-label">Cart</span>
              </Link>
            </div>
          </div >

          {/* MOBILE SEARCH BAR */}
          <form className={`mobile-search-bar mobile-only ${showMobileSearch ? 'visible' : 'hidden'}`} onSubmit={handleSearch}>
            <input
              type="text"
              className="mobile-search-input"
              placeholder="Search for anything"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="mobile-search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form >
        </div >

        {/* SECONDARY NAVIGATION BAR - Desktop Only */}
        <div className="secondary-nav desktop-only">
          <div className="secondary-container">
            <nav className="centered-nav">
              <Link to="/shop?category=deals" className="nav-link-shop deals-link">Daily Deals 🔥</Link>
              <Link to="/shop?category=juices" className="nav-link-shop">Pure Juices</Link>
              <Link to="/shop?category=shakes" className="nav-link-shop">Shakes</Link>
              <Link to="/shop?category=salads" className="nav-link-shop">Salads</Link>
              <Link to="/shop?category=fruits" className="nav-link-shop">Fresh Fruits</Link>

              <div className="nav-separator-line"></div>

              <Link to="/about" className="nav-link-utility">About us</Link>
              <Link to="/stores" className="nav-link-utility">Our stores</Link>
              <Link to="/faq" className="nav-link-utility">Help & FAQs</Link>
              <Link to="/contact" className="nav-link-utility">Contact</Link>
            </nav>
          </div>
        </div>

        {/* MOBILE MENU PANEL */}
        <div className={`mobile-menu-panel ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <h2 className="mobile-menu-title">Menu</h2>
            <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}>×</button>
          </div>

          <div className="mobile-menu-content">
            {/* Main Links */}
            <nav className="mobile-nav-group">
              <Link to="/shop?category=deals" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Daily Deals 🔥</Link>
              <Link to="/shop?category=juices" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Pure Juices</Link>
              <Link to="/shop?category=shakes" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Fruit Shakes</Link>
              <Link to="/shop?category=salads" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Salads</Link>
              <Link to="/shop?category=fruits" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Fresh Fruits</Link>
            </nav>

            <div className="mobile-divider"></div>

            <nav className="mobile-nav-group secondary">
              <Link to="/about" className="mobile-link-small" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
              <Link to="/stores" className="mobile-link-small" onClick={() => setIsMobileMenuOpen(false)}>Our Stores</Link>
              <Link to="/faq" className="mobile-link-small" onClick={() => setIsMobileMenuOpen(false)}>Help & FAQs</Link>
              <Link to="/contact" className="mobile-link-small" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
            </nav>

            {/* Social Icons */}
            <div className="mobile-footer">
              <a href="#" className="social-icon" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {
          isMobileMenuOpen && (
            <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
          )
        }
      </header >

      {/* TRACKER MODAL */}
      {
        showTrackerModal && activeOrder && (
          <div className="modal-overlay" onClick={() => setShowTrackerModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Order Tracking</h3>
                <button onClick={() => setShowTrackerModal(false)} className="close-btn">×</button>
              </div>
              <div className="modal-body">
                <div className="order-info">
                  <p><strong>Order ID:</strong> #{activeOrder.id}</p>
                  <p><strong>Status:</strong> <span className="status-badge">{activeOrder.status}</span></p>
                  <p><strong>Type:</strong> {activeOrder.order_type}</p>
                  <p><strong>Total:</strong> ₹{activeOrder.total_amount?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <style>{`
        * {
          box-sizing: border-box;
        }

        .navbar-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: white;
        }

        /* ===== ANNOUNCEMENT BAR ===== */
        .announcement-bar,
        .tracker-bar {
          background: #2D2D2D;
          color: white;
          text-align: center;
          padding: 6px 20px;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .tracker-bar {
          cursor: pointer;
          background: #4CAF50;
        }

        .tracker-bar:hover {
          background: #45a049;
        }

        .tracker-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .track-link {
          text-decoration: underline;
          margin-left: 8px;
        }

        /* SERVICE AREA BAR */
        .service-area-bar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 6px 20px;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .service-area-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* ===== VISIBILITY HELPERS ===== */
        .desktop-only {
          display: flex;
        }

        .mobile-only {
          display: none !important;
        }

        /* ===== MAIN NAVBAR ===== */
        .main-navbar {
          background: #FAF5ED;
          border-bottom: 1px solid #E5E5E5;
        }

        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 8px 30px;
          display: flex;
          align-items: center;
          gap: 20px;
          justify-content: space-between;
        }

        .mobile-menu-toggle {
          display: none;
          background: none;
          border: 2px solid #4A7C9D;
          border-radius: 4px;
          padding: 6px;
          cursor: pointer;
          color: #4A7C9D;
        }

        /* LOGO */
        .logo-link {
          text-decoration: none;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #D4AF7A;
          margin: 0;
          font-family: 'Georgia', serif;
          white-space: nowrap;
        }

        /* SEARCH FORM */
        .search-wrapper {
          flex: 1;
          max-width: 500px;
          position: relative;
        }

        .search-form {
          display: flex;
          align-items: center;
          background: #F5F5F5;
          border-radius: 50px; /* Modern pill shape */
          padding: 6px 16px;
          transition: all 0.3s;
          border: 1px solid transparent;
        }

        .search-form:focus-within {
          background: white;
          border-color: #D4AF7A;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08); /* Glow effect */
        }

        .search-icon-btn {
          background: none;
          border: none;
          color: #888;
          display: flex;
          align-items: center;
          cursor: pointer;
          padding: 0;
          margin-right: 10px;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.95rem;
          outline: none;
          color: #2D2D2D;
          font-weight: 500;
        }
        
        .search-input::placeholder { color: #aaa; }

        /* SEARCH DROPDOWN */
        .search-dropdown {
          position: absolute;
          top: 120%;
          left: 0;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          overflow: hidden;
          z-index: 1000;
          border: 1px solid #f0f0f0;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px 20px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #f9f9f9;
        }

        .search-result-item:hover {
          background: #fafafa;
        }

        .result-img {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: cover;
          background: #eee;
        }

        .result-info {
          display: flex;
          flex-direction: column;
        }

        .result-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #2D2D2D;
        }

        .result-price {
          font-size: 0.8rem;
          color: #666;
          font-weight: 500;
        }

        .no-results {
          padding: 20px;
          text-align: center;
          color: #888;
          font-size: 0.9rem;
        }

        .search-loading {
          padding: 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #666;
          font-size: 0.9rem;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #D4AF7A;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* MOBILE SEARCH */
        .mobile-search-bar {
          padding: 12px 20px;
          border-top: 1px solid #E5E5E5;
          display: none;
          gap: 10px;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
        }

        .mobile-search-bar.visible {
          max-height: 100px;
          opacity: 1;
        }

        .mobile-search-bar.hidden {
          max-height: 0;
          opacity: 0;
          padding: 0 20px;
        }

        .mobile-search-input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #D0D0D0;
          border-radius: 4px;
          font-size: 0.9rem;
          outline: none;
          background: #F5F5F5;
        }

        .mobile-search-input::placeholder {
          color: #999;
        }

        .mobile-search-btn {
          background: none;
          border: none;
          padding: 10px;
          color: #666;
          cursor: pointer;
        }

        /* RIGHT ACTIONS */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: auto;
        }

        .icon-btn,
        .cart-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #2D2D2D;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
          font-weight: 500;
          white-space: nowrap;
        }

        .icon-btn:hover,
        .cart-btn:hover {
          color: #D4AF7A;
        }

        .cart-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #2D2D2D;
          font-weight: 500;
        }

        .cart-icon-wrapper {
          position: relative;
        }

        .cart-count-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #FF5252; /* Modern red badge */
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white; /* Clean improved badge */
        }
        
        .cart-label {
          font-size: 0.9rem;
        }

        /* USER MENU */
        .user-menu {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #E0E0E0;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          margin-top: 8px;
          min-width: 150px;
          overflow: hidden;
          z-index: 10;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 12px 20px;
          text-align: left;
          background: none;
          border: none;
          color: #2D2D2D;
          font-size: 0.9rem;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }

        .dropdown-item:hover {
          background: #F5F5F5;
        }

        /* ===== SECONDARY NAVIGATION ===== */
        .secondary-nav {
          background: white;
          border-bottom: 1px solid #EAEAEA;
          height: 52px;
        }

        .secondary-container {
          max-width: 1400px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .centered-nav {
          display: flex;
          align-items: center;
          gap: 40px; /* Generous spacing */
        }

        /* --- SHOP LINKS --- */
        .nav-link-shop {
          text-decoration: none;
          color: #444;
          font-family: 'Playfair Display', serif; /* Premium Font */
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          padding: 6px 0;
          position: relative;
          transition: color 0.2s;
        }
        .nav-link-shop:hover {
          color: #111;
        }
        
        /* Gold Underline Effect */
        .nav-link-shop::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: #D4AF7A;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s ease;
        }
        .nav-link-shop:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }

        /* Daily Deals Special */
        .deals-link {
          color: #D4AF7A;
          font-weight: 700;
        }
        .deals-link:hover {
          color: #bf955e;
        }

        /* --- UTILITY LINKS (Info) --- */
        .nav-link-utility {
          text-decoration: none;
          color: #666;
          font-family: 'Manrope', sans-serif;
          font-size: 0.8rem;
          text-transform: uppercase; /* Clean differentiation */
          letter-spacing: 0.08em;
          font-weight: 600;
          transition: color 0.2s;
        }
        .nav-link-utility:hover { 
          color: #D4AF7A; 
        }

        /* SEPARATOR */
        .nav-separator-line {
          width: 1px;
          height: 18px;
          background: #E0E0E0;
          margin: 0 10px;
        }
        
        .nav-link:hover::after {
          width: 100%;
        }

        .nav-link.highlight-link {
          color: #D32F2F;
          font-weight: 700;
        }

        .nav-link.highlight-link::after {
          background: #D32F2F;
        }
        
        /* ===== MOBILE MENU PANEL ===== */
        .mobile-menu-panel {
          position: fixed;
          top: 0;
          left: -100%;
          width: 100%; /* Full width for cleaner look with horizontal layout */
          height: 100vh; /* Full height */
          background: white;
          transition: left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2000;
          display: flex;
          flex-direction: column;
        }

        .mobile-menu-panel.open {
          left: 0;
        }

        .mobile-menu-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f0f0f0;
        }

        .mobile-menu-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          color: #111;
          margin: 0;
        }

        .close-menu-btn {
          background: none;
          border: none;
          font-size: 2rem;
          line-height: 1;
          padding: 0;
          color: #666;
          cursor: pointer;
        }

        .mobile-menu-content {
          padding: 40px 20px; /* More breathing room */
          display: flex;
          flex-direction: column;
          align-items: center; /* Center everything */
          gap: 20px;
        }

        .mobile-nav-group {
          display: flex;
          flex-direction: row; /* HORIZONTAL */
          flex-wrap: wrap;     /* Allow wrapping if screen is tiny */
          justify-content: center;
          gap: 15px 25px;      /* Spacing between items */
          width: 100%;
          max-width: 600px;    /* Constrain width */
        }

        .mobile-link {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;   /* Balanced size */
          color: #444;
          text-decoration: none;
          padding: 5px 0;
          position: relative;
          transition: color 0.2s;
        }
        
        .mobile-link:hover {
          color: #111;
        }
        
        /* Gold Underline for Mobile too */
        .mobile-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: #D4AF7A;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s ease;
        }
        .mobile-link:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }

        .mobile-divider {
          height: 1px;
          width: 60px; /* Small divider line */
          background: #E0E0E0;
          margin: 10px 0;
        }

        .mobile-link-small {
          font-family: 'Manrope', sans-serif;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #888;
          text-decoration: none;
          padding: 5px 10px;
          font-weight: 600;
          transition: color 0.2s;
        }
        
        .mobile-link-small:hover {
          color: #D4AF7A;
        }

        .mobile-footer {
          margin-top: auto;
          display: flex;
          gap: 20px;
          padding-top: 30px;
        }

        .social-icon {
          color: #999;
          transition: color 0.2s;
        }
        
        .social-icon:hover { color: #111; }

        /* OVERLAY */
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1500;
          backdrop-filter: blur(2px);
        }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #E0E0E0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.3rem;
          color: #2D2D2D;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          color: #666;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
        }

        .close-btn:hover {
          color: #D4AF7A;
        }

        .modal-body {
          padding: 24px;
        }

        .order-info p {
          margin: 0 0 12px 0;
          font-size: 0.95rem;
          color: #2D2D2D;
        }

        .status-badge {
          background: #4CAF50;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* ===== USER AVATAR ===== */
        .avatar-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #E5E5E5;
          transition: border-color 0.2s;
        }

        .avatar-btn:hover .user-avatar {
          border-color: #D4AF7A;
        }

        .user-avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #D4AF7A;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
        }

        .dropdown-divider {
          height: 1px;
          background: #F0F0F0;
          margin: 4px 0;
        }

        .logout-btn {
          color: #D32F2F;
        }

        .logout-btn:hover {
          background: #FFEBEE;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }

          .mobile-only {
            display: flex !important;
          }

          .mobile-search-bar {
            display: flex;
          }

          .mobile-menu-toggle {
            display: block;
          }

          .navbar-container {
            padding: 12px 16px;
            gap: 12px;
          }

          .logo {
            font-size: 1.6rem;
            flex: 1;
            text-align: center;
          }

          .nav-actions {
            gap: 16px;
          }

          .cart-count {
            top: -6px;
            left: 14px;
            width: 16px;
            height: 16px;
            font-size: 0.6rem;
          }

          .announcement-bar {
            font-size: 0.7rem;
            padding: 6px 12px;
          }
        }
      `}</style>
    </>
  );
}