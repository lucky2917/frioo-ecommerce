import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerText from '../components/animations/StaggerText';
import Footer from '../components/layout/Footer';
import { logger } from '../utils/logger';
import SEO from '../components/SEO';
import { API_BASE_URL } from '../config/constants';
import previewVideo from '../assets/preview.mp4';
import preview2Video from '../assets/preview2.mp4';

export default function Home() {
  const [products, setProducts] = useState([]);

  const [categorySlide, setCategorySlide] = useState(0);
  const [activeTab, setActiveTab] = useState('juices');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Target: Midnight tonight
    const getTargetTime = () => {
      const target = new Date();
      target.setHours(24, 0, 0, 0);
      return target;
    };

    let target = getTargetTime();

    const interval = setInterval(() => {
      const now = new Date();
      let difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        // Reset for next day
        target = getTargetTime();
        difference = target.getTime() - now.getTime();
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const response = await res.json();
        const data = response.data || {};
        setProducts(data.items || []);
      } catch (err) {
        logger.error('Failed to fetch products:', err);
      }
    };
    loadProducts();
  }, []);





  const filteredProducts = useMemo(() => ({
    featured: products.filter(p => p.featured).slice(0, 6),
    juices: products.filter(p => p.category === 'Pure Fruit Juice').slice(0, 6),
    shakes: products.filter(p => p.category === 'Fruit Milkshake').slice(0, 6),
    salads: products.filter(p => p.category === 'Salad').slice(0, 6)
  }), [products]);

  const getActiveProducts = () => {
    switch (activeTab) {
      case 'shakes': return filteredProducts.shakes;
      case 'salads': return filteredProducts.salads;
      default: return filteredProducts.juices;
    }
  };



  // Structured Data for Home Page
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

      {/* SEO H1 — visually hidden but read by crawlers */}
      <h1 className="seo-h1">Frioo — Best Fresh Fruits, Juices & Salads Delivery in Vizag, Visakhapatnam</h1>

      {/* ===== HERO VIDEO ===== */}
      <div className="hero-carousel">
        <video className="hero-video" autoPlay loop muted playsInline>
          <source src={previewVideo} type="video/mp4" />
        </video>

        {/* [NEW] Hero Text Overlay */}
        <div className="hero-overlay-text">
          <StaggerText
            text="FRIOO AI"
            className="hero-main-title"
            stagger={0.08}
            delay={0.5}
          />
          <ScrollReveal delay={1.2} duration={0.8}>
            <p className="hero-sub-title">Advanced Nutrition, Decoded for Your Biology.</p>
            <Link to="/ai-nutritionist" className="hero-cta-btn">Experience AI Nutrition</Link>
          </ScrollReveal>
        </div>
      </div>

      {/* ===== FRESHLY MADE FAVORITES ===== */}
      <section className="featured-section" aria-label="Featured fresh juices and fruits in Vizag">
        <div className="section-container">
          <ScrollReveal>
            <StaggerText text="FRESHLY MADE FAVORITES" className="section-title" />
            <p className="section-subtitle">Our most-loved fresh juices in Vizag, freshly made daily with the finest fruits from local farms.</p>
          </ScrollReveal>

          <div className="products-scroll-wrapper">
            {/* Feature Card */}
            <ScrollReveal direction="left" delay={0.2}>
              <div className="feature-card">
                <div className="feature-content">
                  <h3 className="feature-title">Sweet Moments, One Sip at a Time</h3>
                  <p className="feature-text">Any lightness of a vanilla chiffon</p>
                  <Link to="/shop" className="feature-btn">Shop Juices</Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Product Cards */}
            <div className="products-scroll">
              {filteredProducts.featured.map((product, idx) => (
                <ScrollReveal key={product.id} delay={0.1 * (idx + 1)} direction="up" className="inline-block">
                  <div className="product-card-mini">
                    <Link to={`/product/${product.id}`} className="product-link">
                      <div className="product-image-wrapper">
                        <img src={product.images[0]} alt={product.title} className="product-image" />
                      </div>
                      <div className="product-info">
                        <div className="product-price">₹{(product.price_cents / 100).toFixed(2)}</div>
                        <h4 className="product-name">{product.title}</h4>
                        <div className="product-stock">
                          <span className="stock-dot"></span>
                          <span className="stock-text">In stock</span>
                        </div>
                        <p className="product-desc">{product.description?.substring(0, 50)}...</p>
                      </div>
                      <button className="product-cta">Choose options</button>
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Promo Banner */}
          <div className="promo-banner">
            <div className="promo-banner-content">
              <span className="promo-banner-icon">🎉</span>
              <span className="promo-banner-text">Enjoy 10% Off Your Next Order With Code: FRESH10</span>
              <Link to="/shop" className="promo-banner-link">Shop Now</Link>
            </div>
            <div className="promo-timer">
              <div className="timer-item">
                <div className="timer-value">{String(timeLeft.days).padStart(2, '0')}</div>
                <div className="timer-label">Days</div>
              </div>
              <div className="timer-divider">:</div>
              <div className="timer-item">
                <div className="timer-value">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="timer-label">Hours</div>
              </div>
              <div className="timer-divider">:</div>
              <div className="timer-item">
                <div className="timer-value">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="timer-label">Mins</div>
              </div>
              <div className="timer-divider">:</div>
              <div className="timer-item">
                <div className="timer-value">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="timer-label">Secs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FROM OUR KITCHEN TO YOU (Categories) ===== */}
      <section className="categories-section" aria-label="Fresh fruit categories available in Vizag">
        <div className="section-container">
          <ScrollReveal direction="up">
            <div className="section-header-center">
              <span className="section-badge">Treat Yourself in Vizag</span>
              <h2 className="section-title-center">FROM OUR KITCHEN TO YOU IN VIZAG</h2>
              <p className="section-subtitle-center">
                At our Visakhapatnam store, every sip is a labor of love. From our kitchen to you is our promise to deliver the freshest, most delicious fruits and juices in Vizag, straight from our blender to your table.
              </p>
            </div>
          </ScrollReveal>

          <div className="category-carousel-wrapper">
            <ScrollReveal delay={0.2} duration={0.8}>
              <div className="category-carousel" style={{ transform: `translateX(-${categorySlide * 100}%)` }}>
                <Link to="/shop?category=juices" className="category-card" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600)' }}>
                  <div className="category-overlay">
                    <h3 className="category-title">PURE JUICES</h3>
                    <p className="category-desc">Perfect for refreshing, energizing, or enjoying on their own</p>
                    <span className="category-link-text">Shop Juices</span>
                  </div>
                </Link>

                <Link to="/shop?category=shakes" className="category-card" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600)' }}>
                  <div className="category-overlay">
                    <h3 className="category-title">FRUIT SHAKES</h3>
                    <p className="category-desc">A shake isn't just dessert—it's the centerpiece of celebration!</p>
                    <span className="category-link-text">Custom Shakes</span>
                  </div>
                </Link>

                <Link to="/shop?category=salads" className="category-card" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600)' }}>
                  <div className="category-overlay">
                    <h3 className="category-title">FRESH SALADS</h3>
                    <p className="category-desc">Crispy, fresh, and irresistibly healthy — salads are the ultimate indulgence</p>
                    <span className="category-link-text">Shop Salads</span>
                  </div>
                </Link>

                <Link to="/shop?category=fruits" className="category-card" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600)' }}>
                  <div className="category-overlay">
                    <h3 className="category-title">FRESH FRUITS</h3>
                    <p className="category-desc">From farm to table, every fruit is a moment of pure delight</p>
                    <span className="category-link-text">Shop Fruits</span>
                  </div>
                </Link>
              </div>
            </ScrollReveal>

            {/* Navigation Arrows */}
            <button className="category-nav-btn category-prev" onClick={() => setCategorySlide(prev => (prev - 1 + 4) % 4)}>‹</button>
            <button className="category-nav-btn category-next" onClick={() => setCategorySlide(prev => (prev + 1) % 4)}>›</button>

            {/* Dot Indicators */}
            <div className="category-dots">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  className={`category-dot ${categorySlide === index ? 'active' : ''}`}
                  onClick={() => setCategorySlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PICK YOUR FRESH PLEASURE (Product Carousel) ===== */}
      <section className="product-carousel-section">
        <div className="section-container">
          <div className="carousel-header">
            <ScrollReveal direction="right">
              <div>
                <h2 className="section-title-main">PICK YOUR FRESH PLEASURE</h2>
                <p className="section-subtitle-main">Our most-loved juices, freshly made daily with the finest ingredients.</p>
              </div>
            </ScrollReveal>
            <Link to="/shop" className="shop-link-main">Shop All</Link>
          </div>

          <div className="product-tabs">
            <button className={`tab-btn ${activeTab === 'juices' ? 'active' : ''}`} onClick={() => setActiveTab('juices')}>Juices</button>
            <button className={`tab-btn ${activeTab === 'shakes' ? 'active' : ''}`} onClick={() => setActiveTab('shakes')}>Shakes</button>
            <button className={`tab-btn ${activeTab === 'salads' ? 'active' : ''}`} onClick={() => setActiveTab('salads')}>Salads</button>
          </div>

          <div className="carousel-products">
            {getActiveProducts().map((product, idx) => (
              <ScrollReveal key={product.id} delay={0.1 * idx} direction="up" className="carousel-product-card-wrapper">
                <div className="carousel-product-card">
                  <Link to={`/product/${product.id}`}>
                    <div className="carousel-product-image-wrapper">
                      <img src={product.images[0]} alt={product.title} className="carousel-product-image" />
                    </div>
                    <div className="carousel-product-info">
                      <div className="carousel-product-price">₹{(product.price_cents / 100).toFixed(2)}</div>
                      <h4 className="carousel-product-name">{product.title}</h4>
                      <div className="product-stock">
                        <span className="stock-dot"></span>
                        <span className="stock-text">In stock</span>
                      </div>
                      <p className="carousel-product-desc">{product.description?.substring(0, 60)}...</p>
                    </div>
                    <button className="carousel-product-cta">Choose options</button>
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STORY SECTION ===== */}
      <section className="story-section" aria-label="Our story - Frioo Vizag">
        <video
          className="story-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={preview2Video} type="video/mp4" />
        </video>
        <div className="story-overlay"></div>
        <div className="story-content">
          <div className="story-badge">ESTD. 2024 • VIZAG</div>
          <h2 className="story-title">ONE DREAM. ONE BLENDER. ENDLESS FRESHNESS IN VIZAG.</h2>
          <p className="story-text">
            Born in Visakhapatnam, our story began with a simple dream and a deep love for the craft of fresh juicing. We believed that the best fruits and drinks in Vizag should be made from scratch—with patience, passion, and a sprinkle of creativity. What started in a humble kitchen in Allipuram has grown into Vizag's most-loved fruit destination, where every blend, smoothie, and juice still carries the same care and dedication.
          </p>
        </div>
      </section>

      {/* ===== REPEATING TEXT BANNER ===== */}
      <div className="text-banner">
        <div className="text-banner-scroll">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="banner-text-item">
              <span className="banner-emoji">🍊</span>
              Delight in Every Sip
            </span>
          ))}
        </div>
      </div>


      {/* Footer */}
      <Footer />

    </div>
  );
}