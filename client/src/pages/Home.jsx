import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notify } from '../lib/feedbackStore';
import SEO from '../components/SEO';
import FetchError from '../components/FetchError';
import ProductCard from '../components/shop/ProductCard';
import HomeHero from '../components/home/HomeHero';
import TrustStrip from '../components/home/TrustStrip';
import CategoryRail from '../components/home/CategoryRail';
import ProductRail from '../components/home/ProductRail';
import PromoGrid from '../components/home/PromoGrid';
import NutritionPanel from '../components/home/NutritionPanel';
import StoryBand from '../components/home/StoryBand';
import ReasonsGrid from '../components/home/ReasonsGrid';
import ClosingBand from '../components/home/ClosingBand';
import { useProducts } from '../hooks/useProducts';
import { useReveal } from '../hooks/useReveal';
import { useCart } from '../context/cart-context';
import { PRODUCT_CATEGORIES } from '../config/constants';
import { isNewArrival } from '../utils/productSignals';

const homeSchema = {
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Frioo — Fresh Fruits & Juices in Vizag",
  "description": "Best fresh fruits, pure juices, fruit milkshakes, and healthy salads delivered in Visakhapatnam (Vizag). 100% natural, farm-fresh, no preservatives.",
  "url": "https://frioo.in",
  "telephone": "+91-9347043329",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Railway Quarters, Allipuram",
    "addressLocality": "Visakhapatnam",
    "addressRegion": "Andhra Pradesh",
    "postalCode": "530004",
    "addressCountry": "IN"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 17.721086639920603, "longitude": 83.29694119604164 }
};

const PRODUCT_TABS = PRODUCT_CATEGORIES.filter(c => c.dbValue !== null).slice(0, 3);

const COUPON_CODE = 'FRESH10';

export default function Home() {
  const { products, loading, error: productsError, refetch: loadProducts } = useProducts();
  const { addToCart } = useCart();
  const [couponCopied, setCouponCopied] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState(PRODUCT_TABS[0].slug);

  const offerRef = useReveal();
  const browseRef = useReveal();

  const featuredProducts = useMemo(() => products.filter(p => p.featured).slice(0, 10), [products]);

  const freshInProducts = useMemo(() => {
    const arrivals = products.filter(isNewArrival);
    return (arrivals.length >= 4 ? arrivals : products).slice(0, 10);
  }, [products]);

  const tabGroups = useMemo(() => {
    return PRODUCT_TABS.reduce((acc, tab) => {
      acc[tab.slug] = products.filter(p => p.category === tab.dbValue).slice(0, 8);
      return acc;
    }, {});
  }, [products]);

  const activeTabProducts = tabGroups[activeProductTab] ?? [];

  const copyResetTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(copyResetTimerRef.current), []);

  const copyCoupon = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCouponCopied(true);
      clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => setCouponCopied(false), 2000);
    } catch {
      notify.info(`Copy this code to use it: ${COUPON_CODE}`);
    }
  }, []);

  const isLoadingProducts = loading && products.length === 0;
  const isEmpty = !loading && !productsError && products.length === 0;

  return (
    <div className="home-page">
      <SEO
        title="Fresh Fruits, Juices & Salads Delivered in Vizag"
        description="Order the best fresh fruits, pure juices, fruit milkshakes & healthy salads in Visakhapatnam (Vizag). 100% natural, no preservatives. Farm-fresh delivery daily. Shop Frioo now!"
        canonical="/"
        keywords="fresh fruits vizag, best fruits in vizag, fruit delivery visakhapatnam, fresh juice vizag, buy fruits online vizag, best juice shop vizag, fruit milkshake vizag, healthy salad vizag"
        structuredData={homeSchema}
      />

      <h1 className="seo-h1">Frioo — Best Fresh Fruits, Juices & Salads Delivery in Vizag, Visakhapatnam</h1>

      <HomeHero />
      <TrustStrip />
      <CategoryRail />

      <ProductRail
        eyebrow="Fresh in today"
        title="Just off the morning run"
        description="What arrived from the market this morning, while it lasts."
        products={freshInProducts}
        onAdd={addToCart}
        loading={isLoadingProducts}
      />

      <PromoGrid />

      <StoryBand />

      {featuredProducts.length > 0 && (
        <ProductRail
          eyebrow="Our picks"
          title="Chosen by the people who pack your bag"
          products={featuredProducts}
          onAdd={addToCart}
          loading={false}
          tint
        />
      )}

      <NutritionPanel products={products} />

      <section className="fr-sec fr-offer" aria-label="First order offer">
        <div className="fr-wrap">
          <div className="fr-offer-panel fr-reveal" ref={offerRef}>
            <div className="fr-offer-text">
              <p className="fr-eyebrow fr-offer-eyebrow">First order</p>
              <h2 className="fr-offer-title">10% off your first basket</h2>
              <p className="fr-offer-body">No minimum spend. Use this code at checkout.</p>
            </div>
            <div className="fr-offer-action">
              <div className="fr-offer-code">
                <span className="fr-offer-code-text">{COUPON_CODE}</span>
                <button className="fr-offer-copy" onClick={copyCoupon}>{couponCopied ? 'Copied' : 'Copy'}</button>
              </div>
              <Link to="/shop" className="fr-offer-link">Start shopping &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {productsError && products.length === 0 && (
        <section className="fr-sec fr-sec-tight">
          <div className="fr-wrap">
            <FetchError message="We couldn't load our fresh picks right now. Please try again." onRetry={loadProducts} />
          </div>
        </section>
      )}

      {isEmpty && (
        <section className="fr-sec fr-sec-tight">
          <div className="fr-wrap">
            <div className="home-empty">
              <p className="home-empty-title">We couldn&apos;t load our products</p>
              <p className="home-empty-sub">Check your connection and try again.</p>
              <Link to="/shop" className="fr-offer-link">Browse the shop</Link>
            </div>
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="fr-sec fr-browse" aria-label="Browse by category">
          <div className="fr-wrap">
            <header className="fr-sec-head">
              <div>
                <p className="fr-eyebrow">Everything fresh</p>
                <h2 className="fr-sec-title">Browse the full range</h2>
              </div>
              <Link to="/shop" className="fr-sec-link">
                View all
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </Link>
            </header>
            <div className="fr-tabs" role="tablist">
              {PRODUCT_TABS.map((tab) => (
                <button
                  key={tab.slug}
                  role="tab"
                  aria-selected={activeProductTab === tab.slug}
                  className={`fr-tab${activeProductTab === tab.slug ? ' fr-tab-on' : ''}`}
                  onClick={() => setActiveProductTab(tab.slug)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="fr-browse-grid fr-reveal" ref={browseRef}>
              {activeTabProducts.map((product, index) => (
                <div key={product.id} style={{ '--fr-stagger': index % 4 }}>
                  <ProductCard product={product} onAdd={addToCart} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <ReasonsGrid />
      <ClosingBand />

      <style>{`
        .home-page { background: var(--fr-canvas); }

        .fr-offer { background: var(--fr-brand); }
        .fr-offer-panel { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s8); flex-wrap: wrap; }
        .fr-offer-eyebrow { color: #A8D5B5; }
        .fr-offer-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-headline); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-headline); color: #FFFFFF; margin: 0 0 var(--fr-s2); }
        .fr-offer-body { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: #C9DED2; margin: 0; }
        .fr-offer-action { display: flex; flex-direction: column; align-items: flex-start; gap: var(--fr-s3); }
        .fr-offer-code { display: flex; align-items: stretch; border-radius: var(--fr-r-control); overflow: hidden; }
        .fr-offer-code-text { display: flex; align-items: center; font-family: var(--fr-font-mono); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); letter-spacing: var(--fr-track-eyebrow); color: #FFFFFF; padding: 0 var(--fr-s5); background: rgba(255, 255, 255, 0.14); border: 1px dashed rgba(255, 255, 255, 0.5); border-right: none; }
        .fr-offer-copy { border: none; background: var(--fr-surface); color: var(--fr-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); min-height: 48px; padding: 0 var(--fr-s5); cursor: pointer; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-offer-copy:hover { background: #EAF3EC; }
        .fr-offer-copy:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 2px; }
        .fr-offer-link { font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: #FFFFFF; text-decoration: underline; text-underline-offset: 4px; }
        .fr-offer-link:hover { color: #C9DED2; }
        .fr-offer-link:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 3px; border-radius: var(--fr-r-control); }

        .fr-tabs { display: flex; gap: var(--fr-s2); margin-bottom: var(--fr-s6); border-bottom: 1px solid var(--fr-line); }
        .fr-tab { padding: var(--fr-s3) var(--fr-s4); min-height: 44px; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text-2); cursor: pointer; transition: color var(--fr-dur-quick) var(--fr-ease-standard), border-color var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-tab:hover { color: var(--fr-brand); }
        .fr-tab-on { color: var(--fr-brand); border-bottom-color: var(--fr-brand); }
        .fr-tab:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }

        .fr-browse-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fr-s5); }

        .home-empty { text-align: center; padding: var(--fr-s9) var(--fr-s5); display: flex; flex-direction: column; align-items: center; gap: var(--fr-s3); }
        .home-empty-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0; }
        .home-empty-sub { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0 0 var(--fr-s3); }
        .home-empty .fr-offer-link { color: var(--fr-brand); }

        @media (max-width: 900px) {
          .fr-browse-grid { grid-template-columns: repeat(2, 1fr); gap: var(--fr-s4); }
          .fr-offer-panel { gap: var(--fr-s6); }
          .fr-tabs { overflow-x: auto; scrollbar-width: none; }
          .fr-tabs::-webkit-scrollbar { display: none; }
          .fr-tab { white-space: nowrap; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fr-tab, .fr-offer-copy { transition: none; }
        }
      `}</style>
    </div>
  );
}
