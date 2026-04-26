import React, { useState, useMemo } from 'react';

const BUNDLE_DEFINITIONS = [
  {
    id: 'juice-trio',
    title: 'Juice Trio',
    description: 'Three pure fruit juices — refreshing and natural',
    category: 'Pure Fruit Juice',
    count: 3,
    color: '#FF9500'
  },
  {
    id: 'shake-pack',
    title: 'Shake Pack',
    description: 'Power up with three of our best milkshakes',
    category: 'Fruit Milkshake',
    count: 3,
    color: '#9C27B0'
  },
  {
    id: 'salad-duo',
    title: 'Salad Duo',
    description: 'Two fresh salad bowls for the wellness pair',
    category: 'Salad',
    count: 2,
    color: '#2E7D32'
  }
];

export default function BundleDeals({ products, onAddBundle }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const bundles = useMemo(() => {
    return BUNDLE_DEFINITIONS.reduce((acc, def) => {
      const picks = products.filter(p => p.category === def.category).slice(0, def.count);
      if (picks.length < 2) return acc;
      acc.push({
        ...def,
        products: picks,
        totalPrice: picks.reduce((sum, p) => sum + p.price_cents / 100, 0)
      });
      return acc;
    }, []);
  }, [products]);

  if (bundles.length === 0) return null;

  const nextSlide = () => setActiveSlide(prev => (prev + 1) % bundles.length);
  const prevSlide = () => setActiveSlide(prev => (prev - 1 + bundles.length) % bundles.length);

  return (
    <div className="bundle-deals">
      <div className="section-header">
        <h2>Popular Combos</h2>
        <p>Add a curated combo to your cart in one click</p>
      </div>

      <div className="carousel-container">
        <button className="nav-btn prev" onClick={prevSlide}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="carousel-track">
          {bundles.map((bundle, index) => {
            const offset = (index - activeSlide + bundles.length) % bundles.length;
            const isActive = offset === 0;
            const isPrev = offset === bundles.length - 1;
            const isNext = offset === 1;

            return (
              <div
                key={bundle.id}
                className={`bundle-card ${isActive ? 'active' : ''} ${isPrev ? 'prev' : ''} ${isNext ? 'next' : ''}`}
                style={{ '--accent-color': bundle.color }}
              >
                <div className="bundle-images">
                  {bundle.products.map(p => (
                    <img key={p.id} src={p.images?.[0]} alt={p.title} className="bundle-thumb" />
                  ))}
                </div>

                <div className="bundle-content">
                  <h3>{bundle.title}</h3>
                  <p className="bundle-desc">{bundle.description}</p>

                  <div className="products-list">
                    {bundle.products.map(p => (
                      <span key={p.id} className="product-tag">{p.title}</span>
                    ))}
                  </div>

                  <div className="pricing">
                    <div className="price-row main">
                      <span className="label">Combo total:</span>
                      <span className="new-price">₹{bundle.totalPrice.toFixed(0)}</span>
                    </div>
                  </div>

                  <button className="add-bundle-btn" onClick={() => onAddBundle(bundle.products)}>
                    Add Combo to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button className="nav-btn next" onClick={nextSlide}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="carousel-dots">
        {bundles.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === activeSlide ? 'active' : ''}`}
            onClick={() => setActiveSlide(index)}
          />
        ))}
      </div>

      <style jsx>{`
        .bundle-deals {
          margin: 60px 0 40px;
          padding: 40px 20px;
          background: #fafaf8;
          border-radius: 24px;
          border: 1px solid #eee;
        }

        .section-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .section-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          margin: 0 0 10px 0;
          color: #2F4F4F;
        }

        .section-header p {
          color: #666;
          font-size: 1rem;
        }

        .carousel-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 60px;
          min-height: 420px;
        }

        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          border: 1px solid #e0e0e0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          border-color: var(--accent-color, #C5A065);
          color: var(--accent-color, #C5A065);
        }

        .nav-btn.prev { left: 0; }
        .nav-btn.next { right: 0; }

        .carousel-track {
          position: relative;
          width: 100%;
          max-width: 380px;
          height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bundle-card {
          position: absolute;
          width: 100%;
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          transform: translateX(100%) scale(0.85);
          pointer-events: none;
        }

        .bundle-card.active {
          opacity: 1;
          transform: translateX(0) scale(1);
          pointer-events: all;
          z-index: 3;
        }

        .bundle-card.prev {
          opacity: 0.25;
          transform: translateX(-45%) scale(0.9);
          z-index: 1;
        }

        .bundle-card.next {
          opacity: 0.25;
          transform: translateX(45%) scale(0.9);
          z-index: 1;
        }

        .bundle-images {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          justify-content: center;
        }

        .bundle-thumb {
          width: 72px;
          height: 72px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid #eee;
        }

        .bundle-content h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          margin: 0 0 6px 0;
          color: var(--accent-color, #C5A065);
        }

        .bundle-desc {
          color: #777;
          font-size: 0.9rem;
          margin: 0 0 16px 0;
          line-height: 1.4;
        }

        .products-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }

        .product-tag {
          padding: 4px 10px;
          background: #f5f5f5;
          border-radius: 20px;
          font-size: 0.8rem;
          color: #555;
        }

        .pricing {
          background: #fafaf8;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .price-row.main { font-size: 1.1rem; font-weight: 700; }

        .label { color: #888; font-size: 0.85rem; font-weight: 400; }

        .new-price { color: var(--accent-color, #C5A065); }

        .add-bundle-btn {
          width: 100%;
          padding: 12px;
          background: var(--accent-color, #C5A065);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }

        .add-bundle-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ddd;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          padding: 0;
        }

        .dot.active {
          width: 24px;
          border-radius: 4px;
          background: #C5A065;
        }

        @media (max-width: 768px) {
          .carousel-container { padding: 0 40px; min-height: 480px; }
          .carousel-track { height: 480px; }
          .bundle-card.prev, .bundle-card.next { display: none; }
        }
      `}</style>
    </div>
  );
}
