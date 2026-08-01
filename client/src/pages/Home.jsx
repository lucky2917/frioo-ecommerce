import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notify } from '../lib/feedbackStore';
import SEO from '../components/SEO';
import FetchError from '../components/FetchError';
import ProductCard from '../components/shop/ProductCard';
import ProductCardSkeleton from '../components/shop/ProductCardSkeleton';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { PRODUCT_CATEGORIES } from '../config/constants';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1400&q=80';

const CATEGORIES = [
  { slug: 'juices', label: 'Pure Juices', desc: 'Cold-pressed daily, no concentrates, no added sugar.', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=700' },
  { slug: 'shakes', label: 'Fruit Shakes', desc: 'Rich, creamy shakes made to order with real fruit.', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=700' },
  { slug: 'salads', label: 'Fresh Salads', desc: 'Seasonal fruit salads, crisp and clean.', img: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=700' },
  { slug: 'fruits', label: 'Fresh Fruits', desc: 'Hand-picked from local Vizag markets every morning.', img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=700' },
];

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

  const featuredProducts = useMemo(() => products.filter(p => p.featured).slice(0, 8), [products]);

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

      <section className="home-hero">
        <div className="home-hero-media">
          <img loading="lazy" decoding="async" src={HERO_IMAGE} alt="Fresh fruit, ready at Frioo" className="home-hero-img" />
        </div>
        <div className="home-hero-panel">
          <p className="home-hero-eyebrow">Fresh in Visakhapatnam</p>
          <h2 className="home-hero-title">Fruit, juices &amp; salads, made the same day.</h2>
          <p className="home-hero-sub">Hand-picked each morning and delivered across Vizag, within 6&nbsp;km.</p>
          <Link to="/shop" className="home-hero-cta">Shop fresh</Link>
        </div>
      </section>

      <section className="home-section" aria-label="Product categories">
        <div className="home-container">
          <header className="home-head">
            <p className="home-eyebrow">What we make</p>
            <h2 className="home-title">Four things, done properly</h2>
          </header>
          <div className="home-cats">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} to={`/shop?category=${cat.slug}`} className="home-cat">
                <div className="home-cat-media"><img decoding="async" src={cat.img} alt={cat.label} loading="lazy" /></div>
                <div className="home-cat-body">
                  <h3 className="home-cat-title">{cat.label}</h3>
                  <p className="home-cat-desc">{cat.desc}</p>
                  <span className="home-cat-link">Shop {cat.label} &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {isLoadingProducts && (
        <section className="home-section">
          <div className="home-container">
            <div className="home-grid">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="home-section" aria-label="Featured products">
          <div className="home-container">
            <header className="home-head">
              <p className="home-eyebrow">Freshly made</p>
              <h2 className="home-title">Today's favourites</h2>
            </header>
            <div className="home-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="home-section home-offer-section" aria-label="First order offer">
        <div className="home-container">
          <div className="home-offer">
            <div className="home-offer-text">
              <p className="home-eyebrow">First order</p>
              <h2 className="home-offer-title">10% off your first order</h2>
              <p className="home-offer-body">Made fresh, delivered the same day. No minimum basket.</p>
            </div>
            <div className="home-offer-action">
              <div className="home-offer-code">
                <span className="home-offer-code-text">{COUPON_CODE}</span>
                <button className="home-offer-copy" onClick={copyCoupon}>{couponCopied ? 'Copied' : 'Copy'}</button>
              </div>
              <Link to="/shop" className="home-offer-link">Shop now &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {productsError && products.length === 0 && (
        <section className="home-section">
          <div className="home-container">
            <FetchError message="We couldn't load our fresh picks right now. Please try again." onRetry={loadProducts} />
          </div>
        </section>
      )}

      {isEmpty && (
        <section className="home-section">
          <div className="home-container">
            <div className="home-empty">
              <p className="home-empty-title">We couldn't load our products</p>
              <p className="home-empty-sub">Check your connection and try again.</p>
              <Link to="/shop" className="home-hero-cta">Browse the shop</Link>
            </div>
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="home-section" aria-label="All products">
          <div className="home-container">
            <header className="home-head home-head-row">
              <div>
                <p className="home-eyebrow">Everything fresh</p>
                <h2 className="home-title">Browse by category</h2>
              </div>
              <Link to="/shop" className="home-viewall">View all &rarr;</Link>
            </header>
            <div className="home-tabs" role="tablist">
              {PRODUCT_TABS.map((tab) => (
                <button
                  key={tab.slug}
                  role="tab"
                  aria-selected={activeProductTab === tab.slug}
                  className={`home-tab${activeProductTab === tab.slug ? ' home-tab-on' : ''}`}
                  onClick={() => setActiveProductTab(tab.slug)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="home-grid">
              {activeTabProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          </div>
        </section>
      )}

      <style>{`
        .home-page { background: var(--fr-canvas); }

        .home-hero { display: grid; grid-template-columns: 1.1fr 0.9fr; min-height: 520px; }
        .home-hero-media { overflow: hidden; background: var(--fr-surface-2); }
        .home-hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .home-hero-panel { display: flex; flex-direction: column; justify-content: center; padding: var(--fr-s10) var(--fr-s9); background: var(--fr-canvas); }
        .home-hero-eyebrow { font-family: var(--fr-font-mono); font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-eyebrow); text-transform: uppercase; color: var(--fr-brand); margin: 0 0 var(--fr-s4); }
        .home-hero-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-display); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-display); color: var(--fr-text); margin: 0 0 var(--fr-s4); max-width: 16ch; }
        .home-hero-sub { font-family: var(--fr-font-sans); font-size: var(--fr-fs-lead); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0 0 var(--fr-s6); max-width: 40ch; }
        .home-hero-cta { align-self: flex-start; display: inline-flex; align-items: center; height: 52px; padding: 0 var(--fr-s6); background: var(--fr-brand); color: var(--fr-on-brand); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); text-decoration: none; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .home-hero-cta:hover { background: var(--fr-brand-press); }
        .home-hero-cta:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

        .home-section { padding: var(--fr-s9) 0; }
        .home-container { max-width: var(--fr-container); margin: 0 auto; padding: 0 var(--fr-s7); }
        .home-head { margin-bottom: var(--fr-s6); }
        .home-head-row { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--fr-s4); }
        .home-eyebrow { font-family: var(--fr-font-mono); font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-eyebrow); text-transform: uppercase; color: var(--fr-brand); margin: 0 0 var(--fr-s2); }
        .home-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-headline); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0; }
        .home-viewall { font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-brand); text-decoration: none; white-space: nowrap; }
        .home-viewall:hover { color: var(--fr-brand-press); }
        .home-viewall:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }

        .home-cats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fr-s5); }
        .home-cat { display: flex; flex-direction: column; background: var(--fr-surface); border-radius: var(--fr-r-card); overflow: hidden; box-shadow: var(--fr-elev-1); text-decoration: none; transition: box-shadow var(--fr-dur-base) var(--fr-ease-standard), transform var(--fr-dur-base) var(--fr-ease-standard); }
        .home-cat:hover { box-shadow: var(--fr-elev-2); transform: translateY(-2px); }
        .home-cat:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .home-cat-media { aspect-ratio: 4 / 3; overflow: hidden; background: var(--fr-surface-2); }
        .home-cat-media img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--fr-dur-base) var(--fr-ease-standard); }
        .home-cat:hover .home-cat-media img { transform: scale(1.03); }
        .home-cat-body { padding: var(--fr-s4); display: flex; flex-direction: column; gap: var(--fr-s2); }
        .home-cat-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); letter-spacing: var(--fr-track-headline); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0; }
        .home-cat-desc { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }
        .home-cat-link { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); color: var(--fr-brand); margin-top: var(--fr-s1); }

        .home-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fr-s5); }

        .home-tabs { display: flex; gap: var(--fr-s2); margin-bottom: var(--fr-s6); border-bottom: 1px solid var(--fr-line); }
        .home-tab { padding: var(--fr-s3) var(--fr-s4); background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text-2); cursor: pointer; transition: color var(--fr-dur-quick) var(--fr-ease-standard), border-color var(--fr-dur-quick) var(--fr-ease-standard); }
        .home-tab:hover { color: var(--fr-brand); }
        .home-tab-on { color: var(--fr-brand); border-bottom-color: var(--fr-brand); }
        .home-tab:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }

        .home-offer-section { background: var(--fr-surface-2); }
        .home-offer { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s7); flex-wrap: wrap; background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-surface); padding: var(--fr-s7) var(--fr-s8); }
        .home-offer-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-headline); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: var(--fr-s1) 0; }
        .home-offer-body { color: var(--fr-text-2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); margin: 0; }
        .home-offer-action { display: flex; flex-direction: column; align-items: flex-start; gap: var(--fr-s3); }
        .home-offer-code { display: flex; align-items: stretch; border: 1px dashed var(--fr-brand); border-radius: var(--fr-r-control); overflow: hidden; }
        .home-offer-code-text { display: flex; align-items: center; font-family: var(--fr-font-mono); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); letter-spacing: var(--fr-track-eyebrow); color: var(--fr-text); padding: 0 var(--fr-s4); background: var(--fr-brand-tint); }
        .home-offer-copy { border: none; background: var(--fr-brand); color: var(--fr-on-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); padding: var(--fr-s3) var(--fr-s4); cursor: pointer; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .home-offer-copy:hover { background: var(--fr-brand-press); }
        .home-offer-copy:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .home-offer-link { font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-brand); text-decoration: none; }
        .home-offer-link:hover { color: var(--fr-brand-press); }

        .home-empty { text-align: center; padding: var(--fr-s9) var(--fr-s5); display: flex; flex-direction: column; align-items: center; gap: var(--fr-s3); }
        .home-empty-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0; }
        .home-empty-sub { color: var(--fr-text-2); margin: 0 0 var(--fr-s3); } }

        @media (max-width: 900px) {
          .home-hero { grid-template-columns: 1fr; min-height: 0; }
          .home-hero-media { aspect-ratio: 16 / 10; }
          .home-hero-panel { padding: var(--fr-s7) var(--fr-s5) var(--fr-s8); }
          .home-cats { grid-template-columns: repeat(2, 1fr); gap: var(--fr-s4); }
          .home-grid { grid-template-columns: repeat(2, 1fr); gap: var(--fr-s4); }
          .home-container { padding: 0 var(--fr-s4); }
          .home-section { padding: var(--fr-s8) 0; }
          .home-offer { padding: var(--fr-s6); gap: var(--fr-s5); }
        }
        @media (max-width: 520px) {
          .home-cats { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-cat, .home-cat-media img, .home-hero-cta, .home-tab { transition: none; }
        }
      `}</style>
    </div>
  );
}
