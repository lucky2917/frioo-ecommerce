import { useState, useEffect, useMemo } from 'react';
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

const TESTIMONIALS = [
  {
    name: "Priya Kondapalli",
    location: "MVP Colony, Vizag",
    stars: 5,
    text: "The watermelon juice arrived still cold and tasted exactly like it was just pressed. Nothing else in Vizag comes close to this freshness."
  },
  {
    name: "Ravi Naidu",
    location: "Dwaraka Nagar, Vizag",
    stars: 5,
    text: "Ordered the fruit salad on a Sunday morning and it was at my door in under an hour. The mango was perfectly ripe — not a single bite was disappointing."
  },
  {
    name: "Divya Rao",
    location: "Rushikonda, Vizag",
    stars: 5,
    text: "I switched from a big supermarket to Frioo three months ago and I cannot go back. The difference in freshness is honestly embarrassing for the competition."
  }
];

const GUARANTEES = [
  { title: "100% Natural", desc: "No artificial flavors, colors, or preservatives. Guaranteed on every order." },
  { title: "Same-Day Delivery", desc: "Order before 5 PM and receive it the same day anywhere in Vizag." },
  { title: "Freshness Promise", desc: "Not fresh? We refund or replace. No questions asked, no hassle." },
  { title: "Sourced Daily", desc: "Every item is picked from local Vizag farms and markets each morning." }
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categorySlide, setCategorySlide] = useState(0);
  const [activeTab, setActiveTab] = useState('juices');
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

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

  const activeProducts = useMemo(() => {
    if (activeTab === 'shakes') return filteredProducts.shakes;
    if (activeTab === 'salads') return filteredProducts.salads;
    return filteredProducts.juices;
  }, [activeTab, filteredProducts]);

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

      <h1 className="seo-h1">Frioo — Best Fresh Fruits, Juices & Salads Delivery in Vizag, Visakhapatnam</h1>

      <div className="hero-carousel">
        <video className="hero-video" autoPlay loop muted playsInline>
          <source src={previewVideo} type="video/mp4" />
        </video>
        <div className="hero-video-overlay" />
        <div className="hero-overlay-text">
          <StaggerText
            text="FRIOO"
            className="hero-main-title"
            stagger={0.08}
            delay={0.5}
          />
          <ScrollReveal delay={1.2} duration={0.8}>
            <p className="hero-sub-title">Fresh Fruits, Juices & Salads Delivered in Vizag.</p>
            <div className="hero-cta-group">
              <Link to="/shop" className="hero-cta-btn">Order Fresh Now</Link>
              <p className="hero-micro-trust">Trusted by 2,400+ families in Vizag</p>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <section className="trust-stats-bar" aria-label="Why choose Frioo">
        <div className="trust-stats-inner">
          <div className="trust-stat-item">
            <span className="trust-stat-number">2,400+</span>
            <span className="trust-stat-label">Happy Customers</span>
          </div>
          <div className="trust-stat-sep" />
          <div className="trust-stat-item">
            <span className="trust-stat-number">100%</span>
            <span className="trust-stat-label">Natural, No Preservatives</span>
          </div>
          <div className="trust-stat-sep" />
          <div className="trust-stat-item">
            <span className="trust-stat-number">Same Day</span>
            <span className="trust-stat-label">Delivery in Vizag</span>
          </div>
          <div className="trust-stat-sep" />
          <div className="trust-stat-item">
            <span className="trust-stat-number">Daily Fresh</span>
            <span className="trust-stat-label">From Local Farms</span>
          </div>
        </div>
      </section>

      <section className="featured-section" aria-label="Featured fresh juices and fruits in Vizag">
        <div className="section-container">
          <ScrollReveal>
            <StaggerText text="FRESHLY MADE FAVORITES" className="section-title" />
            <p className="section-subtitle">Our most-loved fresh juices in Vizag, freshly made daily with the finest fruits from local farms.</p>
          </ScrollReveal>

          <div className="products-scroll-wrapper">
            <ScrollReveal direction="left" delay={0.2}>
              <div className="feature-card">
                <div className="feature-content">
                  <h3 className="feature-title">Sweet Moments, One Sip at a Time</h3>
                  <p className="feature-text">Any lightness of a vanilla chiffon</p>
                  <Link to="/shop" className="feature-btn">Shop Juices</Link>
                </div>
              </div>
            </ScrollReveal>

            <div className="products-scroll">
              {filteredProducts.featured.map((product, idx) => (
                <ScrollReveal key={product.id} delay={0.1 * (idx + 1)} direction="up" className="inline-block">
                  <div className="product-card-mini">
                    {idx === 0 && <span className="product-badge product-badge-bestseller">Bestseller</span>}
                    {idx === 1 && <span className="product-badge product-badge-popular">Popular</span>}
                    <Link to={`/product/${product.id}`} className="product-link">
                      <div className="product-image-wrapper">
                        <img src={product.images[0]} alt={product.title} className="product-image" />
                      </div>
                      <div className="product-info">
                        <div className="product-price">&#8377;{(product.price_cents / 100).toFixed(2)}</div>
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
              ))}
            </div>
          </div>

          <div className="promo-banner">
            <div className="promo-banner-content">
              <span className="promo-banner-eyebrow">First order?</span>
              <span className="promo-banner-text">
                10% off with code <strong>FRESH10</strong> — made fresh, delivered the same day.
              </span>
              <Link to="/shop" className="promo-banner-link">Shop Now</Link>
            </div>
            <div className="promo-timer">
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
                    <p className="category-desc">A shake is not just dessert — it is the centerpiece of celebration</p>
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

            <button className="category-nav-btn category-prev" onClick={() => setCategorySlide(prev => (prev - 1 + 4) % 4)}>&#8249;</button>
            <button className="category-nav-btn category-next" onClick={() => setCategorySlide(prev => (prev + 1) % 4)}>&#8250;</button>

            <div className="category-dots">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  className={`category-dot${categorySlide === i ? ' active' : ''}`}
                  onClick={() => setCategorySlide(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials-section" aria-label="Customer reviews for Frioo Vizag">
        <div className="section-container">
          <ScrollReveal>
            <div className="section-header-center">
              <span className="section-badge">Real Customers, Real Vizag</span>
              <h2 className="section-title-center">WHAT OUR CUSTOMERS SAY</h2>
              <p className="section-subtitle-center">
                From MVP Colony to Rushikonda, Vizag trusts Frioo for their daily dose of freshness.
              </p>
            </div>
          </ScrollReveal>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <ScrollReveal key={i} delay={0.15 * i} direction="up">
                <div className="testimonial-card">
                  <div className="tc-stars">{'★'.repeat(t.stars)}</div>
                  <p className="tc-body">"{t.text}"</p>
                  <div className="tc-author">
                    <span className="tc-name">{t.name}</span>
                    <span className="tc-location">{t.location}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="product-carousel-section">
        <div className="section-container">
          <div className="carousel-header">
            <ScrollReveal direction="right">
              <div>
                <h2 className="section-title-main">PICK YOUR FRESH PLEASURE</h2>
                <p className="section-subtitle-main">Our most-loved choices, freshly made daily with the finest ingredients.</p>
              </div>
            </ScrollReveal>
            <Link to="/shop" className="shop-link-main">Shop All</Link>
          </div>

          <div className="product-tabs">
            <button className={`tab-btn${activeTab === 'juices' ? ' active' : ''}`} onClick={() => setActiveTab('juices')}>Juices</button>
            <button className={`tab-btn${activeTab === 'shakes' ? ' active' : ''}`} onClick={() => setActiveTab('shakes')}>Shakes</button>
            <button className={`tab-btn${activeTab === 'salads' ? ' active' : ''}`} onClick={() => setActiveTab('salads')}>Salads</button>
          </div>

          <div className="carousel-products">
            {activeProducts.map((product, idx) => (
              <ScrollReveal key={product.id} delay={0.1 * idx} direction="up" className="carousel-product-card-wrapper">
                <div className="carousel-product-card">
                  <Link to={`/product/${product.id}`}>
                    <div className="carousel-product-image-wrapper">
                      <img src={product.images[0]} alt={product.title} className="carousel-product-image" />
                    </div>
                    <div className="carousel-product-info">
                      <div className="carousel-product-price">&#8377;{(product.price_cents / 100).toFixed(2)}</div>
                      <h4 className="carousel-product-name">{product.title}</h4>
                      <div className="product-stock">
                        <span className="stock-dot" />
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

      <section className="hiw-section" aria-label="How Frioo works">
        <div className="section-container">
          <ScrollReveal>
            <div className="section-header-center">
              <span className="section-badge">Simple by Design</span>
              <h2 className="section-title-center">FRESH IN THREE STEPS</h2>
              <p className="section-subtitle-center">From your first browse to your first sip — it takes minutes.</p>
            </div>
          </ScrollReveal>
          <div className="hiw-grid">
            <ScrollReveal delay={0.1} direction="up">
              <div className="hiw-step">
                <div className="hiw-step-num">01</div>
                <h3 className="hiw-step-title">Browse the Menu</h3>
                <p className="hiw-step-desc">Explore our daily range of fresh juices, shakes, salads, and seasonal fruits — all made to order.</p>
              </div>
            </ScrollReveal>
            <div className="hiw-connector" aria-hidden="true" />
            <ScrollReveal delay={0.2} direction="up">
              <div className="hiw-step">
                <div className="hiw-step-num">02</div>
                <h3 className="hiw-step-title">Place Your Order</h3>
                <p className="hiw-step-desc">Quick checkout, secure payment. Your order goes straight to our kitchen the moment you confirm.</p>
              </div>
            </ScrollReveal>
            <div className="hiw-connector" aria-hidden="true" />
            <ScrollReveal delay={0.3} direction="up">
              <div className="hiw-step">
                <div className="hiw-step-num">03</div>
                <h3 className="hiw-step-title">Delivered Fresh</h3>
                <p className="hiw-step-desc">Made fresh after your order, at your door within hours. Still cold, still perfect.</p>
              </div>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.4}>
            <div className="hiw-cta-row">
              <Link to="/shop" className="hiw-cta-btn">Start Your Order</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="guarantee-section" aria-label="Frioo freshness guarantee">
        <div className="section-container">
          <ScrollReveal>
            <div className="section-header-center">
              <h2 className="guarantee-section-title">OUR PROMISE TO YOU</h2>
              <p className="guarantee-section-sub">Four commitments we make with every order we take.</p>
            </div>
          </ScrollReveal>
          <div className="guarantee-grid">
            {GUARANTEES.map((item, i) => (
              <ScrollReveal key={i} delay={0.1 * i} direction="up">
                <div className="guarantee-item">
                  <div className="guarantee-item-num">{String(i + 1).padStart(2, '0')}</div>
                  <h3 className="guarantee-item-title">{item.title}</h3>
                  <p className="guarantee-item-desc">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="story-section" aria-label="Our story - Frioo Vizag">
        <video className="story-video" autoPlay loop muted playsInline>
          <source src={preview2Video} type="video/mp4" />
        </video>
        <div className="story-overlay" />
        <div className="story-content">
          <div className="story-badge">ESTD. 2024 &nbsp;&middot;&nbsp; VIZAG</div>
          <h2 className="story-title">ONE DREAM. ONE BLENDER. ENDLESS FRESHNESS IN VIZAG.</h2>
          <p className="story-text">
            Born in Visakhapatnam, our story began with a simple dream and a deep love for the craft of fresh juicing. We believed that the best fruits and drinks in Vizag should be made from scratch — with patience, passion, and a sprinkle of creativity. What started in a humble kitchen in Allipuram has grown into Vizag's most-loved fruit destination, where every blend, smoothie, and juice still carries the same care and dedication.
          </p>
        </div>
      </section>

      <div className="text-banner">
        <div className="text-banner-scroll">
          {[...Array(12)].map((_, i) => (
            <span key={i} className="banner-text-item">
              <span className="banner-dot" />
              Farm-Fresh &nbsp;&middot;&nbsp; Made Daily &nbsp;&middot;&nbsp; No Preservatives &nbsp;&middot;&nbsp; Delivered in Hours
            </span>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
