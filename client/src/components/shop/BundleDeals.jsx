// Bundle Deals Carousel - "Buy 3 Get 20% Off"
import React, { useState } from 'react';

export default function BundleDeals({ onAddBundle }) {
    const [activeSlide, setActiveSlide] = useState(0);

    const bundles = [
        {
            id: 1,
            title: "Juice Power Pack",
            description: "Buy 3 Pure Juices, Save 20%",
            products: ["Orange Juice", "Apple Juice", "Carrot Juice"],
            originalPrice: 450,
            discountedPrice: 360,
            savings: 90,
            image: "🍊",
            color: "#FF9500"
        },
        {
            id: 2,
            title: "Breakfast Combo",
            description: "Juice + Salad + Fruit Bowl",
            products: ["Morning Juice", "Fresh Salad", "Mixed Fruits"],
            originalPrice: 380,
            discountedPrice: 300,
            savings: 80,
            image: "🥗",
            color: "#4CAF50"
        },
        {
            id: 3,
            title: "Protein Power",
            description: "3 High-Protein Shakes",
            products: ["Banana Shake", "Mango Shake", "Berry Blast"],
            originalPrice: 420,
            discountedPrice: 335,
            savings: 85,
            image: "💪",
            color: "#9C27B0"
        },
        {
            id: 4,
            title: "Family Pack",
            description: "5 Items, Save ₹150",
            products: ["2 Juices", "2 Salads", "1 Fruit Bowl"],
            originalPrice: 650,
            discountedPrice: 500,
            savings: 150,
            image: "👨‍👩‍👧‍👦",
            color: "#FF5722"
        }
    ];

    const nextSlide = () => {
        setActiveSlide((prev) => (prev + 1) % bundles.length);
    };

    const prevSlide = () => {
        setActiveSlide((prev) => (prev - 1 + bundles.length) % bundles.length);
    };

    return (
        <div className="bundle-deals">
            <div className="section-header">
                <h2>🎁 Bundle Deals</h2>
                <p>Save more when you buy together</p>
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
                                <div className="bundle-icon">{bundle.image}</div>

                                <div className="bundle-content">
                                    <h3>{bundle.title}</h3>
                                    <p className="bundle-desc">{bundle.description}</p>

                                    <div className="products-list">
                                        {bundle.products.map((product, idx) => (
                                            <span key={idx} className="product-tag">
                                                {product}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="pricing">
                                        <div className="price-row">
                                            <span className="label">Original:</span>
                                            <span className="old-price">₹{bundle.originalPrice}</span>
                                        </div>
                                        <div className="price-row main">
                                            <span className="label">Deal Price:</span>
                                            <span className="new-price">₹{bundle.discountedPrice}</span>
                                        </div>
                                        <div className="savings-badge">
                                            💰 Save ₹{bundle.savings}
                                        </div>
                                    </div>

                                    <button
                                        className="add-bundle-btn"
                                        onClick={() => onAddBundle(bundle)}
                                    >
                                        Add Bundle to Cart
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

            {/* Dots */}
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
          margin: 40px 0;
          padding: 40px 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 20%);
          border-radius: 24px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .section-header h2 {
          font-size: 2.5rem;
          margin: 0 0 10px 0;
          background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .section-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .carousel-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 60px;
          min-height: 450px;
        }

        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          border: 2px solid #e0e0e0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s ease;
        }

        .nav-btn:hover {
          border-color: #4CAF50;
          background: #4CAF50;
          color: white;
          transform: translateY(-50%) scale(1.1);
        }

        .nav-btn.prev {
          left: 0;
        }

        .nav-btn.next {
          right: 0;
        }

        .carousel-track {
          position: relative;
          width: 100%;
          max-width: 400px;
          height: 450px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bundle-card {
          position: absolute;
          width: 100%;
          background: white;
          border-radius: 24px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          transform: translateX(100%) scale(0.8);
          pointer-events: none;
        }

        .bundle-card.active {
          opacity: 1;
          transform: translateX(0) scale(1);
          pointer-events: all;
          z-index: 3;
        }

        .bundle-card.prev {
          opacity: 0.3;
          transform: translateX(-50%) scale(0.9);
          z-index: 1;
        }

        .bundle-card.next {
          opacity: 0.3;
          transform: translateX(50%) scale(0.9);
          z-index: 1;
        }

        .bundle-icon {
          font-size: 4rem;
          text-align: center;
          margin-bottom: 20px;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .bundle-content h3 {
          font-size: 1.8rem;
          margin: 0 0 10px 0;
          color: var(--accent-color, #4CAF50);
        }

        .bundle-desc {
          color: #666;
          margin: 0 0 20px 0;
        }

        .products-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .product-tag {
          padding: 6px 12px;
          background: #f5f5f5;
          border-radius: 20px;
          font-size: 0.85rem;
          color: #666;
        }

        .pricing {
          background: #f9f9f9;
          padding: 16px;
          border-radius: 12px;
          margin: 20px 0;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .price-row.main {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--accent-color, #4CAF50);
        }

        .old-price {
          text-decoration: line-through;
          color: #999;
        }

        .savings-badge {
          display: inline-block;
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 50px;
          font-weight: 700;
          margin-top: 10px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .add-bundle-btn {
          width: 100%;
          padding: 14px;
          background: var(--accent-color, #4CAF50);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .add-bundle-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 30px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ccc;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dot.active {
          width: 30px;
          border-radius: 5px;
          background: #4CAF50;
        }

        @media (max-width: 768px) {
          .carousel-container {
            padding: 0 40px;
          }

          .bundle-card.prev,
          .bundle-card.next {
            display: none;
          }
        }
      `}</style>
        </div>
    );
}
