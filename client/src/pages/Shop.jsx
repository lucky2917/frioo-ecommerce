import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerText from '../components/animations/StaggerText';

import ProductCard from '../components/shop/ProductCard';
import ShopFilters from '../components/shop/ShopFilters';
import BundleDeals from '../components/shop/BundleDeals';
import LoadingSpinner from '../components/LoadingSpinner';
import { logger } from '../utils/logger';
import { useCart } from '../context/CartContext';
import { showToast } from '../utils/toast';

import SEO from '../components/SEO';
import { API_BASE_URL, PRODUCT_CATEGORIES } from '../config/constants';

const TABS = PRODUCT_CATEGORIES.map(c => c.label);
const ITEMS_PER_PAGE = 12;

export default function Shop() {
  const { cart, addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const [sortOption, setSortOption] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, Infinity]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');

  const activeTab = (categoryParam
    ? PRODUCT_CATEGORIES.find(c => c.slug === categoryParam)?.label
    : null) ?? PRODUCT_CATEGORIES[0].label;

  const isSearchMode = !!searchParam;

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 500;
    return Math.ceil(Math.max(...products.map(p => p.price_cents / 100)));
  }, [products]);

  useEffect(() => {
    if (products.length > 0 && priceRange[1] === Infinity) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice, products.length]);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [categoryParam, searchParam, sortOption, priceRange]);

  const handleTabChange = (tab) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.label === tab);
    if (cat) setSearchParams({ category: cat.slug });
  };

  useEffect(() => {
    const fetchShopProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const response = await res.json();
        const data = response.data || {};
        setProducts(data.items || []);
        setLoading(false);
      } catch (err) {
        logger.error('Shop Fetch Error:', err);
        setLoading(false);
      }
    };
    fetchShopProducts();
  }, []);

  const processedProducts = useMemo(() => {
    let result = [...products];

    if (isSearchMode) {
      const q = searchParam.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    } else {
      const cat = PRODUCT_CATEGORIES.find(c => c.label === activeTab);
      if (cat) {
        result = cat.dbValue === null
          ? result.filter(p => p.featured === true)
          : result.filter(p => p.category === cat.dbValue);
      } else {
        result = [];
      }
    }

    const [minP, maxP] = priceRange;
    if (maxP !== Infinity) {
      result = result.filter(p => {
        const price = p.price_cents / 100;
        return price >= minP && price <= maxP;
      });
    }

    if (sortOption === 'price-asc') result.sort((a, b) => a.price_cents - b.price_cents);
    if (sortOption === 'price-desc') result.sort((a, b) => b.price_cents - a.price_cents);
    if (sortOption === 'alpha-asc') result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [products, activeTab, sortOption, isSearchMode, searchParam, priceRange]);

  const displayedProducts = processedProducts.slice(0, visibleCount);
  const hasMore = processedProducts.length > visibleCount;

  const handleAddBundle = (bundleProducts) => {
    bundleProducts.forEach(p => addToCart(p, 'Standard', p.price_cents / 100, {}));
    showToast(`${bundleProducts.length} items added to cart`, 'success');
  };

  const safeCart = cart || {};

  const shopStructuredData = useMemo(() => {
    const listProducts = processedProducts.slice(0, 20);
    if (listProducts.length === 0) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": categoryParam
        ? `Fresh ${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)} in Visakhapatnam — Frioo`
        : "Fresh Fruits, Juices & Salads in Vizag — Frioo",
      "url": categoryParam ? `https://frioo.in/shop?category=${categoryParam}` : "https://frioo.in/shop",
      "numberOfItems": listProducts.length,
      "itemListElement": listProducts.map((p, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `https://frioo.in/product/${p.id}`,
        "name": p.title
      }))
    };
  }, [processedProducts, categoryParam]);

  const CATEGORY_SEO = {
    juices: {
      title: 'Buy Fresh Fruit Juices in Vizag — Pure, No Preservatives',
      description: 'Order pure fresh fruit juices in Visakhapatnam. Cold-pressed, 100% natural, no added sugar or preservatives. Delivered same day within 6km in Vizag.',
      keywords: 'fresh fruit juice vizag, pure juice order vizag, cold pressed juice visakhapatnam, buy juice online vizag',
    },
    shakes: {
      title: 'Buy Fresh Fruit Milkshakes in Vizag — Order Online',
      description: 'Thick, creamy fruit milkshakes made fresh daily in Vizag. No artificial flavors. Order online and get delivery within 6km in Visakhapatnam.',
      keywords: 'fruit milkshake vizag, fresh milkshake order vizag, buy milkshake online visakhapatnam',
    },
    salads: {
      title: 'Buy Fresh Fruit Salads in Vizag — Healthy & Delivered',
      description: 'Fresh fruit salads cut and packed daily in Visakhapatnam. Healthy, natural, no dressings. Order online for same-day delivery within 6km in Vizag.',
      keywords: 'fresh fruit salad vizag, healthy salad order vizag, buy salad online visakhapatnam',
    },
    fruits: {
      title: 'Buy Fresh Fruits Online in Vizag — Delivered Same Day',
      description: 'Order the freshest farm fruits in Visakhapatnam. Sourced daily from local Vizag markets. Delivery within 6km. 100% natural, no preservatives.',
      keywords: 'buy fresh fruits vizag, order fruits online vizag, fresh fruit delivery visakhapatnam, local fruits vizag',
    },
    deals: {
      title: "Today's Deals — Fresh Fruits & Juices at Best Prices in Vizag",
      description: "Grab today's best deals on fresh fruits, juices, shakes and salads in Vizag. Limited-time offers on 100% natural produce. Same-day delivery in Visakhapatnam.",
      keywords: 'fresh fruit deals vizag, juice offers vizag, discount fruits visakhapatnam',
    },
  };

  const activeSeo = categoryParam ? CATEGORY_SEO[categoryParam] : null;

  return (
    <div className="shop-page">
      <SEO
        title={activeSeo?.title || 'Buy Fresh Fruits, Juices & Salads Online in Vizag'}
        description={activeSeo?.description || 'Shop the freshest fruits, pure juices, fruit milkshakes & healthy salads in Visakhapatnam. Order online for delivery in Vizag within 6km. 100% natural, no preservatives.'}
        canonical={categoryParam ? `/shop?category=${categoryParam}` : '/shop'}
        keywords={activeSeo?.keywords || 'buy fruits online vizag, fresh juice shop vizag, fruit delivery visakhapatnam, order fruits online vizag, fresh salad vizag, fruit milkshake order vizag'}
        structuredData={shopStructuredData}
      />
      <Navbar />

      <div className="visible-mobile shop-toolbar-container-mobile">
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

        <ScrollReveal delay={0.1}>
          <div className="mobile-category-scroll">
            {TABS.map((cat) => (
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

      <div className="shop-toolbar-container hidden-mobile">
        <ScrollReveal direction="up" delay={0.4}>
          <div className="shop-toolbar">
            <div className="toolbar-left">
              {!isSearchMode && (
                <button
                  onClick={() => setShowFilters(s => !s)}
                  className="filter-toggle-btn"
                >
                  ☰ {showFilters ? 'Hide' : 'Show'} Filters
                </button>
              )}
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

      <div className="shop-main-layout">
        <div className="layout-inner">
          {showFilters && !isSearchMode && (
            <div className="sidebar-wrapper">
              <ShopFilters
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                tabs={TABS}
                products={products}
                priceRange={priceRange}
                onPriceChange={setPriceRange}
                maxPrice={maxPrice}
              />
            </div>
          )}

          <main className="grid-wrapper">
            {loading ? (
              <div className="loading-area"><LoadingSpinner /></div>
            ) : (
              <>
                <div className="product-grid">
                  {displayedProducts.length > 0 ? (
                    displayedProducts.map((p, idx) => (
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

                {hasMore && (
                  <div className="load-more-wrapper">
                    <button
                      className="load-more-btn"
                      onClick={() => setVisibleCount(c => c + ITEMS_PER_PAGE)}
                    >
                      Load More
                    </button>
                    <p className="load-more-hint">
                      Showing {displayedProducts.length} of {processedProducts.length}
                    </p>
                  </div>
                )}

                {!isSearchMode && !loading && products.length > 0 && (
                  <BundleDeals products={products} onAddBundle={handleAddBundle} />
                )}
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
          padding-top: var(--navbar-height-mobile);
        }

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

        .shop-toolbar-container {
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
          background: white;
          position: sticky;
          top: 80px;
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
          transition: color 0.2s;
        }
        .filter-toggle-btn:hover { color: #C5A065; }
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
        }

        .grid-wrapper { flex: 1; }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px 30px;
        }

        .hidden-mobile { display: block; }
        .visible-mobile { display: none; }

        @media (max-width: 900px) {
          .hidden-mobile { display: none !important; }
          .visible-mobile { display: block !important; }

          .shop-page {
            padding-top: var(--navbar-height-desktop);
          }

          .shop-toolbar-container-mobile {
            background: white;
            padding: 15px 20px;
            border-bottom: 1px solid #f0f0f0;
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .mobile-header-content { text-align: left; }
          .header-title-mobile {
            font-family: 'Playfair Display', serif;
            font-size: 2rem;
            color: #2F4F4F;
            margin-bottom: 5px;
          }
          .header-desc-mobile { color: #666; font-size: 0.9rem; }

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

          .mobile-sort-wrapper {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .sort-label { display: inline-block; font-size: 0.9rem; color: #666; margin-right: 5px; }

          .shop-main-layout { padding: 0 15px 40px; }

          .product-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px 10px;
          }
        }

        @media (max-width: 400px) {
          .product-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

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
        .load-more-btn:hover {
          background: #333;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .load-more-hint {
          font-size: 0.85rem;
          color: #888;
          margin: 0;
        }

        .no-res {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 0;
          color: #888;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
