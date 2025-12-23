import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerText from '../components/animations/StaggerText';

import ProductCard from '../components/shop/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { logger } from '../utils/logger';
import { useCart } from '../context/CartContext';

import SEO from '../components/SEO';
import { API_BASE_URL } from '../config/constants';

export default function Shop() {
  const { cart, addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Layout States
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortOption, setSortOption] = useState("recommended");

  // Derive active tab directly from URL (Single Source of Truth)
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search'); // [NEW] Get search query

  let activeTab = "Pure Juices";
  if (categoryParam === 'juices') activeTab = "Pure Juices";
  if (categoryParam === 'shakes') activeTab = "Fruit Shakes";
  if (categoryParam === 'salads') activeTab = "Salads";
  if (categoryParam === 'fruits') activeTab = "Fresh Fruits";
  if (categoryParam === 'deals') activeTab = "Daily Deals";

  // If searching, activeTab is effectively "Search"
  const isSearchMode = !!searchParam;

  const handleTabChange = (tab) => {
    const map = {
      "Pure Juices": "juices",
      "Fruit Shakes": "shakes",
      "Salads": "salads",
      "Fresh Fruits": "fruits",
      "Daily Deals": "deals"
    };
    setSearchParams({ category: map[tab] }); // Clears search param implicitly
  };

  // Load all products at once
  useEffect(() => {
    const fetchShopProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const response = await res.json();
        const data = response.data || {};
        setProducts(data.items || []);
        setLoading(false);
      } catch (err) {
        logger.error("Shop Fetch Error:", err);
        setLoading(false);
      }
    };
    fetchShopProducts();
  }, []);



  const processedProducts = useMemo(() => {
    let result = [...products];

    // [NEW] SEARCH FILTER
    if (isSearchMode) {
      const q = searchParam.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    } else {
      // TAB FILTER (Standard)
      result = result.filter(p => {
        switch (activeTab) {
          case "Pure Juices": return p.category === 'Pure Fruit Juice';
          case "Fruit Shakes": return p.category === 'Fruit Milkshake';
          case "Salads": return p.category === 'Salad';
          case "Fresh Fruits": return p.category === 'Fresh Fruit';
          case "Daily Deals": return p.featured === true;
          default: return false;
        }
      });
    }

    // Sort
    if (sortOption === 'price-asc') result.sort((a, b) => a.price_cents - b.price_cents);
    if (sortOption === 'price-desc') result.sort((a, b) => b.price_cents - a.price_cents);
    if (sortOption === 'alpha-asc') result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [products, activeTab, sortOption, isSearchMode, searchParam]);

  const safeCart = cart || {};

  return (
    <div className="shop-page">
      <SEO title="Shop Fresh" description="Browse our collection of fresh juices, shakes, and salads." />
      <Navbar />

      {/* MOBILE HEADER & TOOLBAR (Visible Mobile Only) */}
      <div className="visible-mobile shop-toolbar-container-mobile">
        {/* ROW 1: Heading & Description */}
        <ScrollReveal>
          <div className="mobile-header-content">
            <StaggerText
              text={isSearchMode ? `Results for "${searchParam}"` : 'Fresh Collection'}
              className="header-title-mobile"
            />
            <p className="header-desc-mobile">
              {isSearchMode ? `${processedProducts.length} items found` : 'Handpicked goodness for you.'}
            </p>
          </div>
        </ScrollReveal>

        {/* ... (mobile cats and sort remain similar, can wrap in ScrollReveal) ... */}
        {/* ROW 2: CATEGORY SWITCHER */}
        <ScrollReveal delay={0.1}>
          <div className="mobile-category-scroll">
            {['Pure Juices', 'Fruit Shakes', 'Salads', 'Fresh Fruits', 'Daily Deals'].map((cat) => (
              <button
                key={cat}
                className={`mobile-cat-pill ${!isSearchMode && activeTab === cat ? 'active' : ''}`}
                onClick={() => handleTabChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* ROW 3: FILTER & SORT */}
        <div className="mobile-sort-wrapper">
          <span className="sort-label">Sort by:</span>
          <select
            className="toolbar-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="recommended">Best</option>
            <option value="price-asc">Price: Low</option>
            <option value="price-desc">Price: High</option>
          </select>
        </div>
      </div>


      {/* DESKTOP HEADER (Hidden Mobile) */}
      <section className="shop-header hidden-mobile">
        <StaggerText
          text={isSearchMode ? `Search Results: "${searchParam}"` : 'Fresh Collection'}
          className="header-title"
          stagger={0.06}
        />
        <ScrollReveal delay={0.3}>
          <p className="header-desc">
            {isSearchMode
              ? `Found ${processedProducts.length} items matching your search.`
              : 'From buttery pastries to fresh fruit medleys, our collection has something for every craving.'
            }
          </p>
        </ScrollReveal>
      </section>

      {/* DESKTOP TOOLBAR (Hidden Mobile) */}
      <div className="shop-toolbar-container hidden-mobile">
        <ScrollReveal direction="up" delay={0.4}>
          <div className="shop-toolbar">
            <div className="toolbar-left">
              {/* If searching, user can clear search by clicking a category */}
              {isSearchMode && (
                <button onClick={() => handleTabChange('Pure Juices')} className="filter-toggle-btn">
                  ← Back to Categories
                </button>
              )}
            </div>

            <div className="toolbar-right">
              <span className="sort-label">Sort by:</span>
              <select
                className="toolbar-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="recommended">Best selling</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <span className="item-count">{processedProducts.length} items</span>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* MAIN CONTENT (Sidebar + Grid) */}
      <div className="shop-main-layout">
        <div className="layout-inner">

          {/* PRODUCT GRID */}
          <main className="grid-wrapper">
            {loading ? (
              <div className="loading-area"><LoadingSpinner /></div>
            ) : (
              <>
                <div className="product-grid">
                  {processedProducts.length > 0 ? (
                    processedProducts.map((p, idx) => (
                      <ScrollReveal key={p.id} delay={0.05 * (idx % 8)} direction="fade" className="grid-item-reveal">
                        <ProductCard product={p} cart={safeCart} onAdd={addToCart} />
                      </ScrollReveal>
                    ))
                  ) : (
                    <div className="no-res">
                      {isSearchMode ? `No products found for "${searchParam}"` : 'No products found.'}
                    </div>
                  )}
                </div>


              </>
            )}
          </main>

        </div>
      </div>



      <style>{`
        .shop-page {
          min-height: 100vh;
          background: white;
          color: #1a1a1a;
          padding-top: var(--navbar-height-mobile); /* Responsive navbar clearance */
        }

        /* HEADER */
        .shop-header {
          text-align: center;
          padding: 60px 20px 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header-title {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          color: #967E76;
          margin-bottom: 20px;
        }
        .header-desc {
          font-family: 'Inter', sans-serif;
          color: #555;
          line-height: 1.6;
          font-size: 1.05rem;
        }

        /* TOOLBAR */
        .shop-toolbar-container {
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
          background: white;
          position: sticky;
          top: 80px; /* Below navbar */
          z-index: 90;
        }
        .shop-toolbar {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 40px;
        }
        .toolbar-left, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .filter-toggle-btn {
          background: none;
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #333;
        }
        .toolbar-select {
          border: none;
          background: transparent;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          color: #333;
          padding-right: 10px;
        }
        .item-count {
          color: #999;
          font-size: 0.9rem;
          border-left: 1px solid #ddd;
          padding-left: 20px;
        }

        /* LAYOUT */
        .shop-main-layout {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px;
        }
        .layout-inner {
          display: flex;
          gap: 40px;
        }

        .sidebar-wrapper {
          width: 250px;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .sidebar-wrapper.closed {
          width: 0;
          overflow: hidden;
          opacity: 0;
        }

        .grid-wrapper {
          flex: 1;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px 30px; /* Vertical gap bigger */
        }

        /* RESPONSIVE UTILS */
        .hidden-mobile { display: block; }
        .visible-mobile { display: none; }

        /* MOBILE STYLES */
        @media (max-width: 900px) {
          .hidden-mobile { display: none !important; }
          .visible-mobile { display: block !important; }
          
          /* HEADER SPACING FIX - Increased for Tall Navbar */
          .shop-page {
            padding-top: var(--navbar-height-desktop); /* Desktop navbar with secondary nav */ 
          }

          /* MOBILE TOOLBAR CONTAINER */
          .shop-toolbar-container-mobile {
             background: white;
             padding: 15px 20px;
             border-bottom: 1px solid #f0f0f0;
             margin-bottom: 20px;
             display: flex;
             flex-direction: column;
             gap: 15px;
          }

          .mobile-header-content {
            text-align: left;
          }
          .header-title-mobile {
             font-family: 'Playfair Display', serif;
             font-size: 2rem;
             color: #2F4F4F;
             margin-bottom: 5px;
          }
           .header-desc-mobile {
             color: #666;
             font-size: 0.9rem;
          }

          .mobile-category-scroll {
            display: flex;
            overflow-x: auto;
            gap: 10px;
            padding-bottom: 5px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .mobile-category-scroll::-webkit-scrollbar { display: none; }

          .mobile-cat-pill {
            white-space: nowrap;
            padding: 8px 16px;
            border-radius: 50px;
            background: #f5f5f5;
            border: 1px solid transparent;
            color: #555;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.2s;
            flex-shrink: 0;
          }
          .mobile-cat-pill.active {
            background: #1a1a1a;
            color: white;
            border-color: #1a1a1a;
          }

          .toolbar-mobile-inner {
             display: flex;
             justify-content: space-between;
             align-items: center;
             border-top: 1px solid #eee;
             padding-top: 15px;
           }

          /* Mobile Filter Button */
          .mobile-inline-filter-btn {
            background: none;
            border: none;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            color: #1a1a1a;
            font-size: 0.9rem;
            padding: 0;
          }

          /* Mobile Sort */
          .mobile-sort-wrapper {
             display: flex;
             align-items: center;
             gap: 5px;
          }
          .sort-label { display: inline-block; font-size: 0.9rem; color: #666; margin-right: 5px; }

          .shop-main-layout { padding: 0 15px 40px; }
          
          /* GRID FIXES - FORCE 2 COLUMNS */
          .product-grid { 
            display: grid;
            grid-template-columns: repeat(2, 1fr) !important; 
            gap: 20px 10px;
          }
        }

        @media (max-width: 400px) {
           .product-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        /* Load More Styles */
        .load-more-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          gap: 15px;
        }
        .load-more-btn {
          background: #1a1a1a;
          color: white;
          border: none;
          padding: 15px 40px;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .load-more-btn:hover:not(:disabled) {
          background: #333;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .load-more-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .load-more-hint {
          font-size: 0.85rem;
          color: #888;
          margin: 0;
        }
      `}</style>
    </div>
  );
}