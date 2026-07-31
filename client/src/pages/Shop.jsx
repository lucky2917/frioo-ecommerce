import React, { useState, useMemo, useRef } from 'react';
import { useDialog } from '../hooks/useDialog';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/shop/ProductCard';
import ProductCardSkeleton from '../components/shop/ProductCardSkeleton';
import ShopFilters from '../components/shop/ShopFilters';
import BundleDeals from '../components/shop/BundleDeals';
import FetchError from '../components/FetchError';
import { useCart } from '../context/CartContext';
import { notify } from '../lib/feedbackStore';
import SEO from '../components/SEO';
import { useProducts } from '../hooks/useProducts';
import { PRODUCT_CATEGORIES } from '../config/constants';

const TABS = PRODUCT_CATEGORIES.map(c => c.label);
const ITEMS_PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'alpha-asc', label: 'A → Z' },
];


export default function Shop() {
  const { addToCart } = useCart();
  const { products, loading, error, refetch: fetchShopProducts } = useProducts();

  const [searchParams, setSearchParams] = useSearchParams();
  const [sortOption, setSortOption] = useState('recommended');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const sheetRef = useRef(null);
  const sheetCloseRef = useRef(null);

  useDialog({ open: showMobileFilters, onClose: () => setShowMobileFilters(false), dialogRef: sheetRef, initialFocusRef: sheetCloseRef });
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

  if (products.length > 0 && priceRange[1] === Infinity) {
    setPriceRange([0, maxPrice]);
  }

  const filterKey = `${categoryParam}|${searchParam}|${sortOption}|${priceRange[0]}|${priceRange[1]}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setVisibleCount(ITEMS_PER_PAGE);
  }

  const handleTabChange = (tab) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.label === tab);
    if (cat) setSearchParams({ category: cat.slug });
  };

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
    notify.success(`${bundleProducts.length} items added to cart`);
  };

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

  const priceActive = priceRange[1] !== Infinity && (priceRange[0] > 0 || priceRange[1] < maxPrice);
  const clearPrice = () => setPriceRange([0, maxPrice]);
  const clearSearch = () => setSearchParams({});
  const clearAll = () => { clearPrice(); if (isSearchMode) clearSearch(); };

  const filtersEl = (
    <ShopFilters
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      tabs={TABS}
      products={products}
      priceRange={priceRange}
      onPriceChange={setPriceRange}
      maxPrice={maxPrice}
    />
  );

  return (
    <div className="shop-page">
      <SEO
        title={activeSeo?.title || 'Buy Fresh Fruits, Juices & Salads Online in Vizag'}
        description={activeSeo?.description || 'Shop the freshest fruits, pure juices, fruit milkshakes & healthy salads in Visakhapatnam. Order online for delivery in Vizag within 6km. 100% natural, no preservatives.'}
        canonical={categoryParam ? `/shop?category=${categoryParam}` : '/shop'}
        keywords={activeSeo?.keywords || 'buy fruits online vizag, fresh juice shop vizag, fruit delivery visakhapatnam, order fruits online vizag, fresh salad vizag, fruit milkshake order vizag'}
        structuredData={shopStructuredData}
      />

      <main className="shop-main">
        <header className="shop-head">
          <p className="shop-eyebrow">{isSearchMode ? 'Search' : 'Shop'}</p>
          <h1 className="shop-title">{isSearchMode ? `Results for “${searchParam}”` : activeTab}</h1>
          <p className="shop-sub">{processedProducts.length} {processedProducts.length === 1 ? 'item' : 'items'}, freshly stocked.</p>
        </header>

        {!isSearchMode && (
          <div className="shop-pills fr-only-mobile">
            {TABS.map((tab) => (
              <button key={tab} className={`shop-pill${activeTab === tab ? ' shop-pill-on' : ''}`} onClick={() => handleTabChange(tab)}>{tab}</button>
            ))}
          </div>
        )}

        <div className="shop-layout">
          {!isSearchMode && <aside className="shop-rail fr-only-desktop">{filtersEl}</aside>}

          <div className="shop-content">
            <div className="shop-toolbar">
              <div className="shop-toolbar-left">
                {!isSearchMode && (
                  <button className="shop-filter-btn fr-only-mobile" onClick={() => setShowMobileFilters(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="10" y1="18" x2="14" y2="18" /></svg>
                    Filters
                  </button>
                )}
                {isSearchMode && (
                  <button className="shop-back" onClick={clearSearch}>&larr; Back to shop</button>
                )}
                {(priceActive || isSearchMode) && (
                  <div className="shop-chips">
                    {isSearchMode && <span className="shop-chip">&ldquo;{searchParam}&rdquo;<button onClick={clearSearch} aria-label="Clear search">&times;</button></span>}
                    {priceActive && <span className="shop-chip">&#8377;{priceRange[0]} &ndash; &#8377;{priceRange[1]}<button onClick={clearPrice} aria-label="Clear price filter">&times;</button></span>}
                    <button className="shop-clear-all" onClick={clearAll}>Clear all</button>
                  </div>
                )}
              </div>
              <div className="shop-toolbar-right">
                <label className="shop-sort">
                  <span className="shop-sort-label">Sort</span>
                  <select className="shop-sort-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {loading && products.length === 0 ? (
              <div className="shop-grid">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
            ) : error ? (
              <FetchError message="We couldn't load the products. Please check your connection and try again." onRetry={fetchShopProducts} />
            ) : displayedProducts.length > 0 ? (
              <>
                <div className="shop-grid">
                  {displayedProducts.map((p) => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
                </div>
                {hasMore && (
                  <div className="shop-loadmore">
                    <button className="shop-loadmore-btn" onClick={() => setVisibleCount(c => c + ITEMS_PER_PAGE)}>Load more</button>
                    <p className="shop-loadmore-hint">Showing {displayedProducts.length} of {processedProducts.length}</p>
                  </div>
                )}
                {!isSearchMode && <BundleDeals products={products} onAddBundle={handleAddBundle} />}
              </>
            ) : (
              <div className="shop-empty">
                <p className="shop-empty-title">{isSearchMode ? `No results for “${searchParam}”` : 'Nothing matches these filters'}</p>
                <p className="shop-empty-sub">{isSearchMode ? 'Try a different search, or browse the shop.' : 'Try widening your price range or pick another category.'}</p>
                <div className="shop-empty-actions">
                  {priceActive && <button className="shop-empty-btn" onClick={clearPrice}>Clear filters</button>}
                  {isSearchMode && <button className="shop-empty-btn" onClick={clearSearch}>Browse the shop</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showMobileFilters && (
        <div className="shop-sheet-scrim fr-dialog-scrim" onClick={() => setShowMobileFilters(false)}>
          <div className="shop-sheet fr-dialog-panel--sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Filters">
            <div className="shop-sheet-head">
              <span className="shop-sheet-title">Filters</span>
              <button className="shop-sheet-close" ref={sheetCloseRef} onClick={() => setShowMobileFilters(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="shop-sheet-body">{filtersEl}</div>
            <div className="shop-sheet-foot">
              <button className="shop-sheet-clear" onClick={clearAll}>Clear all</button>
              <button className="shop-sheet-done" onClick={() => setShowMobileFilters(false)}>Show {processedProducts.length} items</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .shop-page { background: var(--fr-canvas); min-height: 100vh; padding-top: var(--navbar-height-mobile); }
        @media (min-width: 901px) { .shop-page { padding-top: var(--navbar-height-desktop); } }
        .shop-main { max-width: var(--fr-container); margin: 0 auto; padding: var(--fr-s7) var(--fr-s7) var(--fr-s9); }
        .shop-head { margin-bottom: var(--fr-s6); }
        .shop-eyebrow { font-family: var(--fr-font-mono); font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-eyebrow); text-transform: uppercase; color: var(--fr-brand); margin: 0 0 var(--fr-s2); }
        .shop-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-headline); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0 0 var(--fr-s2); }
        .shop-sub { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }

        .shop-pills { display: flex; gap: var(--fr-s2); overflow-x: auto; padding-bottom: var(--fr-s2); margin-bottom: var(--fr-s5); scrollbar-width: none; }
        .shop-pills::-webkit-scrollbar { display: none; }
        .shop-pill { flex-shrink: 0; min-height: 44px; padding: 0 var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-pill); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text-2); cursor: pointer; white-space: nowrap; }
        .shop-pill-on { background: var(--fr-brand); border-color: var(--fr-brand); color: var(--fr-on-brand); }

        .shop-layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: var(--fr-s8); align-items: start; }
        .shop-rail { position: sticky; top: calc(var(--navbar-height-desktop) + var(--fr-s5)); }
        .shop-content { min-width: 0; }

        .shop-toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s4); flex-wrap: wrap; margin-bottom: var(--fr-s5); padding-bottom: var(--fr-s4); border-bottom: 1px solid var(--fr-line); }
        .shop-toolbar-left { display: flex; align-items: center; gap: var(--fr-s3); flex-wrap: wrap; }
        .shop-filter-btn { display: inline-flex; align-items: center; gap: var(--fr-s2); min-height: 44px; padding: 0 var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; }
        .shop-filter-btn:focus-visible, .shop-back:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .shop-back { background: none; border: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-brand); cursor: pointer; padding: var(--fr-s2) 0; }
        .shop-chips { display: flex; align-items: center; gap: var(--fr-s2); flex-wrap: wrap; }
        .shop-chip { display: inline-flex; align-items: center; gap: var(--fr-s2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); color: var(--fr-brand); background: var(--fr-brand-tint); border-radius: var(--fr-r-pill); padding: 5px 6px 5px var(--fr-s3); }
        .shop-chip button { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; background: none; color: var(--fr-brand); cursor: pointer; font-size: var(--fr-fs-control); border-radius: var(--fr-r-pill); }
        .shop-chip button::after { content: ""; position: absolute; top: 50%; left: 50%; width: 44px; height: 44px; transform: translate(-50%, -50%); }
        .shop-chip button:hover { background: color-mix(in srgb, var(--fr-brand) 16%, transparent); }
        .shop-clear-all { background: none; border: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text-2); cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
        .shop-clear-all:hover { color: var(--fr-brand); }
        .shop-sort { display: inline-flex; align-items: center; gap: var(--fr-s2); }
        .shop-sort-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); color: var(--fr-text-2); }
        .shop-sort-select { height: 44px; padding: 0 var(--fr-s3); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; }
        .shop-sort-select:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

        .shop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fr-s5); }

        .shop-loadmore { display: flex; flex-direction: column; align-items: center; gap: var(--fr-s3); padding: var(--fr-s8) 0 0; }
        .shop-loadmore-btn { min-height: 48px; padding: 0 var(--fr-s7); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), color var(--fr-dur-quick) var(--fr-ease-standard); }
        .shop-loadmore-btn:hover { border-color: var(--fr-brand); color: var(--fr-brand); }
        .shop-loadmore-btn:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .shop-loadmore-hint { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-3); font-variant-numeric: tabular-nums; margin: 0; }

        .shop-empty { text-align: center; padding: var(--fr-s10) var(--fr-s5); display: flex; flex-direction: column; align-items: center; gap: var(--fr-s2); }
        .shop-empty-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0; }
        .shop-empty-sub { color: var(--fr-text-2); margin: 0 0 var(--fr-s3); }
        .shop-empty-actions { display: flex; gap: var(--fr-s3); }
        .shop-empty-btn { min-height: 44px; padding: 0 var(--fr-s5); background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; }
        .shop-empty-btn:hover { background: var(--fr-brand-press); } }

        .shop-sheet-scrim { position: fixed; inset: 0; z-index: var(--fr-z-sheet); background: var(--fr-scrim); display: flex; align-items: flex-end; }
        .shop-sheet { width: 100%; max-height: 82vh; display: flex; flex-direction: column; background: var(--fr-surface); border-radius: var(--fr-r-surface) var(--fr-r-surface) 0 0; box-shadow: var(--fr-elev-3); padding-bottom: env(safe-area-inset-bottom); }
        .shop-sheet-head { display: flex; align-items: center; justify-content: space-between; padding: var(--fr-s4) var(--fr-s5); border-bottom: 1px solid var(--fr-line); }
        .shop-sheet-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); }
        .shop-sheet-close { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: var(--fr-text-2); cursor: pointer; border-radius: var(--fr-r-control); }
        .shop-sheet-close:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .shop-sheet-body { padding: var(--fr-s5); overflow-y: auto; }
        .shop-sheet-foot { display: flex; gap: var(--fr-s3); padding: var(--fr-s4) var(--fr-s5); border-top: 1px solid var(--fr-line); }
        .shop-sheet-clear { flex-shrink: 0; min-height: 48px; padding: 0 var(--fr-s5); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; }
        .shop-sheet-done { flex: 1; min-height: 48px; background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; font-variant-numeric: tabular-nums; }
        .shop-sheet-done:focus-visible, .shop-sheet-clear:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

        .fr-only-mobile { display: none; }
        .fr-only-desktop { display: block; }

        @media (max-width: 900px) {
          .shop-main { padding: var(--fr-s5) var(--fr-s4) var(--fr-s8); }
          .shop-layout { grid-template-columns: 1fr; gap: 0; }
          .shop-grid { grid-template-columns: repeat(2, 1fr); gap: var(--fr-s4); }
          .fr-only-mobile { display: flex; }
          .fr-only-desktop { display: none; }
        }
        @media (max-width: 400px) { .shop-grid { grid-template-columns: repeat(2, 1fr); } }

        @media (prefers-reduced-motion: reduce) {
          .shop-loadmore-btn, .shop-filter-btn { transition: none; }
        }
      `}</style>
    </div>
  );
}
