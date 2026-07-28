import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerText from '../components/animations/StaggerText';
import Footer from '../components/layout/Footer';
import SEO from '../components/SEO';
import FetchError from '../components/FetchError';
import { useProducts } from '../hooks/useProducts';
import { PRODUCT_CATEGORIES } from '../config/constants';
import previewVideo from '../assets/preview.mp4';

const CATEGORIES = [
  {
    slug: 'juices',
    label: 'Pure Juices',
    desc: 'Cold-pressed daily, no concentrates, no added sugar.',
    img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=700'
  },
  {
    slug: 'shakes',
    label: 'Fruit Shakes',
    desc: 'Rich, creamy shakes made to order with real fruit.',
    img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=700'
  },
  {
    slug: 'salads',
    label: 'Fresh Salads',
    desc: 'Seasonal fruit salads — crisp, clean, no dressing fillers.',
    img: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=700'
  },
  {
    slug: 'fruits',
    label: 'Fresh Fruits',
    desc: 'Hand-picked from local Vizag farms every morning.',
    img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=700'
  }
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
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 17.721086639920603,
    "longitude": 83.29694119604164
  }
};

const PRODUCT_TABS = PRODUCT_CATEGORIES.filter(c => c.dbValue !== null).slice(0, 3);

export default function Home() {
  const { products, error: productsError, refetch: loadProducts } = useProducts();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [couponCopied, setCouponCopied] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState(PRODUCT_TABS[0].slug);

  useEffect(() => {
    const getTarget = () => {
      const t = new Date();
      t.setHours(24, 0, 0, 0);
      return t;
    };
    let target = getTarget();
    const tick = () => {
      const now = new Date();
      let diff = target.getTime() - now.getTime();
      if (diff <= 0) { target = getTarget(); diff = target.getTime() - now.getTime(); }
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const featuredProducts = useMemo(() => products.filter(p => p.featured).slice(0, 6), [products]);

  const tabGroups = useMemo(() => {
    return PRODUCT_TABS.reduce((acc, tab) => {
      acc[tab.slug] = products.filter(p => p.category === tab.dbValue).slice(0, 6);
      return acc;
    }, {});
  }, [products]);

  const activeTabProducts = tabGroups[activeProductTab] ?? [];

  const copyCoupon = useCallback(() => {
    navigator.clipboard.writeText('FRESH10').then(() => {
      setCouponCopied(true);
      setTimeout(() => setCouponCopied(false), 2000);
    });
  }, []);

  return (
    <div className="home-page">
      <SEO
        title="Fresh Fruits, Juices & Salads Delivered in Vizag"
        description="Order the best fresh fruits, pure juices, fruit milkshakes & healthy salads in Visakhapatnam (Vizag). 100% natural, no preservatives. Farm-fresh delivery daily. Shop Frioo now!"
        canonical="/"
        keywords="fresh fruits vizag, best fruits in vizag, fruit delivery visakhapatnam, fresh juice vizag, buy fruits online vizag, best juice shop vizag, fruit milkshake vizag, healthy salad vizag"
        structuredData={homeSchema}
      />
      <Navbar />

      <h1 className="seo-h1">Frioo — Best Fresh Fruits, Juices & Salads Delivery in Vizag, Visakhapatnam</h1>

      <div className="hero-carousel">
        <video className="hero-video" autoPlay loop muted playsInline>
          <source src={previewVideo} type="video/mp4" />
        </video>
        <div className="hero-video-overlay" />
        <div className="hero-overlay-text">
          <StaggerText text="FRIOO" className="hero-main-title" stagger={0.08} delay={0.5} />
          <ScrollReveal delay={1.2} duration={0.8}>
            <p className="hero-sub-title">Fresh Fruits, Juices & Salads Delivered in Vizag.</p>
            <div className="hero-cta-group">
              <Link to="/shop" className="hero-cta-btn">Order Fresh Now</Link>
              <p className="hero-micro-trust">Trusted by 2,400+ families in Vizag</p>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <section className="home-categories-section" aria-label="Product categories">
        <div className="section-container">
          <ScrollReveal>
            <h2 className="section-title">WHAT WE MAKE</h2>
            <p className="section-subtitle">Four categories. One commitment — made fresh, delivered the same day.</p>
          </ScrollReveal>
          <div className="home-cat-carousel-wrap">
            <div className="home-categories-grid">
              {CATEGORIES.map((cat, i) => (
                <ScrollReveal key={cat.slug} delay={0.1 * i} direction="up">
                  <Link to={`/shop?category=${cat.slug}`} className="home-cat-card">
                    <div className="home-cat-img-wrap">
                      <img src={cat.img} alt={cat.label} className="home-cat-img" loading="lazy" />
                      <div className="home-cat-overlay" />
                    </div>
                    <div className="home-cat-body">
                      <h3 className="home-cat-title">{cat.label}</h3>
                      <p className="home-cat-desc">{cat.desc}</p>
                      <span className="home-cat-link">Shop {cat.label} &rarr;</span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="featured-section" aria-label="Featured fresh juices and fruits in Vizag">
          <div className="section-container">
            <ScrollReveal>
              <StaggerText text="FRESHLY MADE FAVORITES" className="section-title" />
              <p className="section-subtitle">Our most-loved items, freshly made daily with the finest local fruits.</p>
            </ScrollReveal>

            <div className="products-scroll">
              {featuredProducts.map((product, idx) => {
                const currentPrice = product.price_cents / 100;
                const hasDiscount = product.discount > 0;
                const originalPrice = hasDiscount
                  ? Math.round(currentPrice / (1 - product.discount / 100))
                  : null;

                return (
                  <ScrollReveal key={product.id} delay={0.1 * (idx + 1)} direction="up" className="inline-block">
                    <div className="product-card-mini">
                      {hasDiscount && (
                        <span className="product-badge product-badge-sale">{product.discount}% OFF</span>
                      )}
                      {!hasDiscount && idx === 0 && (
                        <span className="product-badge product-badge-bestseller">Bestseller</span>
                      )}
                      {!hasDiscount && idx === 1 && (
                        <span className="product-badge product-badge-popular">Popular</span>
                      )}
                      <Link to={`/product/${product.id}`} className="product-link">
                        <div className="product-image-wrapper">
                          <img src={product.images[0]} alt={product.title} className="product-image" />
                        </div>
                        <div className="product-info">
                          <div className="product-price-group">
                            <span className={`product-price${hasDiscount ? ' discounted' : ''}`}>
                              &#8377;{currentPrice.toFixed(0)}
                            </span>
                            {hasDiscount && (
                              <span className="product-original-price">&#8377;{originalPrice}</span>
                            )}
                          </div>
                          <h4 className="product-name">{product.title}</h4>
                          <div className="product-stock">
                            <span className="stock-dot" />
                            <span className="stock-text">In stock</span>
                          </div>
                          <p className="product-desc">{product.description?.substring(0, 50)}...</p>
                        </div>
                        <button className="product-cta">Choose options</button>
                      </Link>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="coupon-section" aria-label="Coupon offer">
        <div className="section-container">
          <ScrollReveal>
            <div className="coupon-wrapper">
              <div className="coupon-left">
                <span className="coupon-eyebrow">First order offer</span>
                <h2 className="coupon-headline">10% off your first order</h2>
                <p className="coupon-body">
                  Made fresh, delivered the same day. No minimum basket — just good food.
                </p>
                <div className="coupon-code-row">
                  <div className="coupon-code-box">
                    <span className="coupon-code-text">FRESH10</span>
                    <div className="coupon-divider-v" />
                    <button className="coupon-copy-btn" onClick={copyCoupon}>
                      {couponCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <Link to="/shop" className="coupon-shop-link">Shop Now &rarr;</Link>
                </div>
              </div>
              <div className="coupon-right">
                <p className="coupon-expires">Offer expires in</p>
                <div className="coupon-timer">
                  <div className="coupon-timer-item">
                    <span className="coupon-timer-val">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="coupon-timer-label">Hrs</span>
                  </div>
                  <span className="coupon-timer-sep">:</span>
                  <div className="coupon-timer-item">
                    <span className="coupon-timer-val">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="coupon-timer-label">Min</span>
                  </div>
                  <span className="coupon-timer-sep">:</span>
                  <div className="coupon-timer-item">
                    <span className="coupon-timer-val">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="coupon-timer-label">Sec</span>
                  </div>
                </div>
                <p className="coupon-fine-print">Resets daily at midnight</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {productsError && products.length === 0 && (
        <section className="all-products-section" aria-label="Product loading error">
          <div className="section-container">
            <FetchError
              message="We couldn't load our fresh picks right now. Please try again."
              onRetry={loadProducts}
            />
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="all-products-section" aria-label="All Frioo products">
          <div className="section-container">
            <ScrollReveal>
              <div className="ap-header">
                <div>
                  <h2 className="section-title">EVERYTHING FRESH</h2>
                  <p className="section-subtitle">Browse by category — 6 items at a glance</p>
                </div>
                <Link to="/shop" className="ap-view-all">View all &rarr;</Link>
              </div>
            </ScrollReveal>

            <div className="ap-tabs">
              {PRODUCT_TABS.map(tab => (
                <button
                  key={tab.slug}
                  className={`ap-tab-btn${activeProductTab === tab.slug ? ' active' : ''}`}
                  onClick={() => setActiveProductTab(tab.slug)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="ap-grid">
              {activeTabProducts.map((product) => {
                const price = product.price_cents / 100;
                const hasDiscount = product.discount > 0;
                const originalPrice = hasDiscount
                  ? Math.round(price / (1 - product.discount / 100))
                  : null;

                return (
                  <Link key={product.id} to={`/product/${product.id}`} className="ap-card">
                    <div className="ap-card-img-wrap">
                      <img src={product.images?.[0]} alt={product.title} className="ap-card-img" loading="lazy" />
                      {hasDiscount && (
                        <div className="ap-discount-badge">{product.discount}% OFF</div>
                      )}
                      {product.featured && !hasDiscount && (
                        <div className="ap-featured-badge">Popular</div>
                      )}
                    </div>
                    <div className="ap-card-body">
                      <p className="ap-card-title">{product.title}</p>
                      <div className="ap-card-pricing">
                        <span className={`ap-card-price${hasDiscount ? ' sale' : ''}`}>
                          &#8377;{price.toFixed(0)}
                        </span>
                        {hasDiscount && (
                          <span className="ap-card-original">&#8377;{originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />

      <style>{`
        .home-categories-section {
          padding: 80px 0;
          background: #FAFAFA;
        }

        .home-categories-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 50px;
        }

        .home-cat-card {
          display: block;
          text-decoration: none;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .home-cat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.1);
        }

        .home-cat-img-wrap {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .home-cat-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .home-cat-card:hover .home-cat-img {
          transform: scale(1.05);
        }

        .home-cat-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35));
        }

        .home-cat-body {
          padding: 20px;
        }

        .home-cat-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          color: #111;
          margin: 0 0 6px;
        }

        .home-cat-desc {
          font-size: 0.85rem;
          color: #888;
          margin: 0 0 14px;
          line-height: 1.5;
        }

        .home-cat-link {
          font-size: 0.8rem;
          font-weight: 700;
          color: #2F4F4F;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Featured section — discount enhancements */
        .product-price-group {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 4px;
        }

        .product-price.discounted {
          color: #D0483A;
          font-weight: 700;
        }

        .product-original-price {
          font-size: 0.8rem;
          color: #aaa;
          text-decoration: line-through;
        }

        .product-badge-sale {
          background: #D0483A;
          color: white;
        }

        /* Coupon section */
        .coupon-section {
          padding: 48px 0;
          background: #2F4F4F;
        }

        .coupon-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12);
          position: relative;
        }

        .coupon-wrapper::before {
          content: '';
          position: absolute;
          left: 60%;
          top: -20px;
          bottom: -20px;
          width: 1px;
          border-left: 2px dashed #e0e0e0;
        }

        .coupon-left {
          flex: 1;
          padding: 36px 44px;
        }

        .coupon-eyebrow {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #C5A065;
          background: #FFF8EF;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 12px;
        }

        .coupon-headline {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          color: #1a1a1a;
          margin: 0 0 8px;
          line-height: 1.2;
        }

        .coupon-body {
          font-size: 0.9rem;
          color: #777;
          margin: 0 0 22px;
          max-width: 380px;
          line-height: 1.55;
        }

        .coupon-code-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .coupon-code-box {
          display: flex;
          align-items: center;
          border: 2px dashed #C5A065;
          border-radius: 10px;
          overflow: hidden;
          background: #FDFAF5;
        }

        .coupon-code-text {
          font-family: 'Courier New', monospace;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 3px;
          color: #1a1a1a;
          padding: 10px 18px;
        }

        .coupon-divider-v {
          width: 1px;
          height: 42px;
          background: #e8d9c0;
        }

        .coupon-copy-btn {
          padding: 10px 16px;
          background: #C5A065;
          color: white;
          border: none;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          letter-spacing: 0.5px;
        }

        .coupon-copy-btn:hover {
          background: #b8904f;
        }

        .coupon-shop-link {
          font-size: 0.88rem;
          font-weight: 700;
          color: #2F4F4F;
          text-decoration: none;
          border-bottom: 1.5px solid #2F4F4F;
          padding-bottom: 2px;
          transition: color 0.2s;
        }

        .coupon-shop-link:hover {
          color: #C5A065;
          border-color: #C5A065;
        }

        .coupon-right {
          width: 40%;
          padding: 36px 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .coupon-expires {
          font-size: 0.75rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #999;
          margin: 0 0 12px;
        }

        .coupon-timer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .coupon-timer-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #2F4F4F;
          border-radius: 10px;
          padding: 10px 14px;
          min-width: 58px;
        }

        .coupon-timer-val {
          font-size: 1.6rem;
          font-weight: 700;
          color: white;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }

        .coupon-timer-label {
          font-size: 0.6rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          margin-top: 4px;
        }

        .coupon-timer-sep {
          font-size: 1.4rem;
          font-weight: 700;
          color: #2F4F4F;
          margin-bottom: 12px;
        }

        .coupon-fine-print {
          font-size: 0.72rem;
          color: #bbb;
          margin: 0;
        }

        /* Everything Fresh — tabbed grid */
        .all-products-section {
          padding: 80px 0;
          background: white;
        }

        .ap-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
        }

        .ap-view-all {
          font-size: 0.9rem;
          font-weight: 700;
          color: #2F4F4F;
          text-decoration: none;
          border-bottom: 1.5px solid #2F4F4F;
          padding-bottom: 2px;
          white-space: nowrap;
          transition: color 0.2s, border-color 0.2s;
        }

        .ap-view-all:hover {
          color: #C5A065;
          border-color: #C5A065;
        }

        .ap-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 32px;
          border-bottom: 1px solid #eee;
          padding-bottom: 0;
        }

        .ap-tab-btn {
          padding: 10px 24px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 0.9rem;
          font-weight: 600;
          color: #999;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
          margin-bottom: -1px;
          font-family: 'Inter', sans-serif;
        }

        .ap-tab-btn:hover {
          color: #2F4F4F;
        }

        .ap-tab-btn.active {
          color: #2F4F4F;
          border-bottom-color: #2F4F4F;
        }

        .ap-grid {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 8px;
          scrollbar-width: none;
        }

        .ap-grid::-webkit-scrollbar {
          display: none;
        }

        .ap-card {
          flex-shrink: 0;
          width: calc((100% - 5 * 16px) / 6);
          scroll-snap-align: start;
          text-decoration: none;
          color: inherit;
          background: white;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #f0f0f0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .ap-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }

        .ap-card-img-wrap {
          position: relative;
          height: 150px;
          background: #f7f7f7;
          overflow: hidden;
        }

        .ap-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .ap-card:hover .ap-card-img {
          transform: scale(1.04);
        }

        .ap-discount-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #D0483A;
          color: white;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 5px;
          letter-spacing: 0.3px;
        }

        .ap-featured-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #2F4F4F;
          color: white;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 5px;
        }

        .ap-card-body {
          padding: 12px;
        }

        .ap-card-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ap-card-pricing {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .ap-card-price {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .ap-card-price.sale {
          color: #D0483A;
        }

        .ap-card-original {
          font-size: 0.75rem;
          color: #bbb;
          text-decoration: line-through;
        }

        @media (max-width: 1024px) {
          .home-categories-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .coupon-wrapper::before { display: none; }
          .coupon-wrapper { flex-direction: column; }
          .coupon-left { padding: 28px 32px 16px; width: 100%; box-sizing: border-box; }
          .coupon-right { width: 100%; box-sizing: border-box; padding: 16px 32px 28px; flex-direction: row; justify-content: center; align-items: center; gap: 24px; text-align: left; }
          .coupon-expires { margin: 0; }
          .coupon-fine-print { display: none; }
        }

        @media (max-width: 768px) {
          .home-cat-carousel-wrap {
            position: relative;
            margin-top: 32px;
          }

          .home-cat-carousel-wrap::before,
          .home-cat-carousel-wrap::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            width: 14%;
            pointer-events: none;
            z-index: 2;
          }

          .home-cat-carousel-wrap::before {
            left: 0;
            background: linear-gradient(to right, #FAFAFA 20%, transparent);
          }

          .home-cat-carousel-wrap::after {
            right: 0;
            background: linear-gradient(to left, #FAFAFA 20%, transparent);
          }

          .home-categories-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 16px;
            padding: 10px 13% 24px;
            margin-top: 0;
            scrollbar-width: none;
          }

          .home-categories-grid::-webkit-scrollbar {
            display: none;
          }

          .home-categories-grid > * {
            flex-shrink: 0;
            width: 72%;
            scroll-snap-align: center;
          }

          .home-cat-card {
            display: block;
            width: 100%;
          }

          .home-cat-img-wrap {
            height: 180px;
          }

          .home-categories-section {
            padding: 50px 0;
          }
        }

        @media (max-width: 600px) {
          .coupon-section { padding: 24px 0; }
          .coupon-wrapper { border-radius: 14px; }
          .coupon-left { padding: 20px 16px 12px; }
          .coupon-right { padding: 12px 16px 20px; flex-direction: column; align-items: center; text-align: center; gap: 10px; }
          .coupon-headline { font-size: 1.35rem; margin-bottom: 6px; }
          .coupon-body { font-size: 0.82rem; margin-bottom: 14px; }
          .coupon-eyebrow { font-size: 0.68rem; margin-bottom: 8px; }
          .coupon-code-text { font-size: 0.95rem; padding: 8px 14px; letter-spacing: 2px; }
          .coupon-copy-btn { padding: 8px 13px; font-size: 0.78rem; }
          .coupon-divider-v { height: 36px; }
          .coupon-code-row { gap: 10px; }
          .coupon-shop-link { font-size: 0.82rem; }
          .coupon-expires { margin-bottom: 8px; }
          .coupon-timer-item { padding: 7px 10px; min-width: 44px; border-radius: 8px; }
          .coupon-timer-val { font-size: 1.2rem; }
          .coupon-timer-sep { font-size: 1.1rem; margin-bottom: 10px; }
          .coupon-timer-label { font-size: 0.55rem; }
          .ap-card { width: calc(50% - 8px); }
          .ap-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .ap-tabs { gap: 0; }
          .ap-tab-btn { padding: 10px 16px; font-size: 0.82rem; }
        }
      `}</style>
    </div>
  );
}
