import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from '../OptimizedImage';
import VideoModal from './VideoModal';

const FALLBACK_IMAGE = "https://via.placeholder.com/400x300?text=Frioo+Fresh";

export default function ProductCard({ product, onAdd }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const [showCustomize, setShowCustomize] = useState(false);
  const [selectedExclusions, setSelectedExclusions] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);

  const isWeightBased = product.category === 'Fresh Fruit' && product.unit === 'kg';
  const WEIGHT_OPTIONS = [
    { label: '250g', multiplier: 0.25 },
    { label: '500g', multiplier: 0.50 },
    { label: '1kg', multiplier: 1.0 }
  ];
  const [selectedWeight, setSelectedWeight] = useState(WEIGHT_OPTIONS[2]);

  const hasOptions = (product.nutrition?.exclusions?.length > 0 || product.nutrition?.ingredients?.length > 0);

  const basePrice = product.price_cents / 100;
  const hasDiscount = product.discount > 0;
  const originalPrice = hasDiscount
    ? Math.round(basePrice / (1 - product.discount / 100))
    : null;

  let finalPrice, variantLabel;
  if (isWeightBased) {
    finalPrice = basePrice * selectedWeight.multiplier;
    variantLabel = selectedWeight.label;
  } else {
    finalPrice = basePrice;
    variantLabel = product.unit ? product.unit.charAt(0).toUpperCase() + product.unit.slice(1) : 'Standard';
  }

  const imageSrc = product.images?.[0] || FALLBACK_IMAGE;

  const handleActionClick = () => {
    if (hasOptions || isWeightBased) {
      setShowCustomize(true);
    } else {
      onAdd(product, variantLabel, finalPrice);
    }
  };

  const handleConfirmCustomization = () => {
    const preferences = {
      exclusions: selectedExclusions,
      removedIngredients: removedIngredients
    };
    onAdd(product, variantLabel, finalPrice, preferences);
    setShowCustomize(false);
    setSelectedExclusions([]);
    setRemovedIngredients([]);
    setSelectedWeight(WEIGHT_OPTIONS[2]);
  };

  const toggleExclusion = (item) => {
    setSelectedExclusions(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleIngredient = (item) => {
    setRemovedIngredients(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  return (
    <>
      <div
        className="patisserie-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="card-image-wrapper">
          <Link to={`/product/${product.id}`} className="card-image-link">
            <OptimizedImage
              src={imageSrc}
              alt={product.title}
              className="card-image"
            />
            {hasDiscount
            ? <span className="badge-pop badge-sale">{product.discount}% OFF</span>
            : product.featured && <span className="badge-pop">Popular</span>
          }
          </Link>

          {product.video_url && (
            <button
              className={`play-btn ${isHovered ? 'visible' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setShowVideo(true);
              }}
              title="Watch Prep Video"
            >
              ▶
            </button>
          )}
        </div>

        <div className="card-content">
          <div className="card-price-group">
            <span className={`card-price${hasDiscount ? ' card-price-sale' : ''}`}>
              &#8377;{basePrice.toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="card-price-original">&#8377;{originalPrice}</span>
            )}
          </div>

          <h3 className="card-title">
            <Link to={`/product/${product.id}`}>{product.title}</Link>
          </h3>

          <p className="card-desc">
            {product.description?.substring(0, 40)}...
          </p>

          <button className="action-btn" onClick={handleActionClick}>
            {hasOptions || isWeightBased ? 'Choose options' : 'Add to cart'}
          </button>
        </div>
      </div>

      {showCustomize && (
        <div className="cust-overlay">
          <div className="cust-modal">
            <div className="cust-header">
              <h4>Customize {product.title}</h4>
              <button className="close-btn" onClick={() => setShowCustomize(false)}>×</button>
            </div>

            <div className="cust-body">
              {isWeightBased && (
                <div className="cust-section">
                  <label>Select Quantity</label>
                  <div className="weight-grid">
                    {WEIGHT_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        className={`opt-chip ${selectedWeight.label === opt.label ? 'active' : ''}`}
                        onClick={() => setSelectedWeight(opt)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="price-preview">Price: ₹{finalPrice.toFixed(0)}</div>
                </div>
              )}

              {product.nutrition?.exclusions?.length > 0 && (
                <div className="cust-section">
                  <label>Exclusions (No extra cost)</label>
                  <div className="chip-grid">
                    {product.nutrition.exclusions.map(item => (
                      <button
                        key={item}
                        className={`opt-chip ${selectedExclusions.includes(item) ? 'active' : ''}`}
                        onClick={() => toggleExclusion(item)}
                      >
                        {selectedExclusions.includes(item) ? '✓ ' : ''}{item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.nutrition?.ingredients?.length > 0 && (
                <div className="cust-section">
                  <label>Remove Ingredients</label>
                  <div className="chip-grid">
                    {product.nutrition.ingredients.map(item => (
                      <button
                        key={item}
                        className={`opt-chip ${removedIngredients.includes(item) ? 'active' : ''}`}
                        onClick={() => toggleIngredient(item)}
                      >
                        {removedIngredients.includes(item) ? '✓ ' : ''} No {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="cust-footer">
              <button className="confirm-btn" onClick={handleConfirmCustomization}>
                Add to Cart - ₹{finalPrice.toFixed(0)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideo && <VideoModal videoUrl={product.video_url} onClose={() => setShowVideo(false)} />}

      <style jsx>{`
        .patisserie-card {
           display: flex;
           flex-direction: column;
           height: 100%;
        }

        .card-image-wrapper {
          position: relative;
          aspect-ratio: 1;
          background: #f7f7f7;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .card-image-link {
          display: block;
          width: 100%;
          height: 100%;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .patisserie-card:hover .card-image {
          transform: scale(1.05); /* Smooth zoom */
        }

        .badge-pop {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #FF9800;
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 50px;
          z-index: 2;
        }

        .badge-sale {
          background: #D0483A;
        }

        .play-btn {
          position: absolute;
          bottom: 15px;
          right: 15px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          color: #1a1a1a;
          border: none;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 5;
        }

        .play-btn:hover {
          background: #4CAF50;
          color: white;
          transform: scale(1.1) !important;
        }

        .patisserie-card:hover .play-btn {
          opacity: 1;
          transform: translateY(0);
        }

        .card-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-price-group {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 6px;
        }

        .card-price {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #2F4F4F;
        }

        .card-price-sale {
          color: #D0483A;
        }

        .card-price-original {
          font-size: 0.85rem;
          color: #bbb;
          text-decoration: line-through;
        }

        .card-title {
          margin: 0 0 8px 0;
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 500;
          line-height: 1.3;
        }
        .card-title a { color: #1a1a1a; text-decoration: none; transition: color 0.2s; }
        .card-title a:hover { color: #4CAF50; }

        .card-desc {
          font-size: 0.85rem;
          color: #888;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .action-btn {
          width: 100%;
          padding: 14px;
          background: #C5A065;
          color: white;
          border: none;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 4px;
          margin-top: auto;
        }
        .action-btn:hover { background: #1a1a1a; }

        .cust-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s;
        }

        .cust-modal {
          background: white;
          width: 90%;
          max-width: 450px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .product-card-shop {
          background: #FFFFFF;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); /* Framer's expo out */
          cursor: pointer;
          position: relative;
          will-change: transform;
          transform: translateZ(0);
        }

        .product-card-shop:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        }

        .product-card-shop:active {
          transform: translateY(-2px) scale(0.99);
          transition-duration: 0.1s;
        }

        .cust-header {
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9f9f9;
        }
        .cust-header h4 { margin: 0; font-family: 'Playfair Display', serif; }
        .close-btn { border: none; background: none; font-size: 1.5rem; cursor: pointer; }

        .cust-body { padding: 20px; max-height: 60vh; overflow-y: auto; }

        .cust-section { margin-bottom: 20px; }
        .cust-section label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 10px; color: #333; }

        .chip-grid, .weight-grid { display: flex; flex-wrap: wrap; gap: 8px; }

        .opt-chip {
          padding: 8px 16px;
          border: 1px solid #e0e0e0;
          background: white;
          border-radius: 50px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .opt-chip:hover { border-color: #4CAF50; color: #4CAF50; }
        .opt-chip.active { background: #4CAF50; color: white; border-color: #4CAF50; }

        .price-preview { margin-top: 10px; font-weight: 700; color: #C5A065; text-align: right; }

        .cust-footer { padding: 15px 20px; border-top: 1px solid #eee; }
        .confirm-btn {
          width: 100%;
          padding: 14px;
          background: #1a1a1a;
          color: white;
          border: none;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
        }
        .confirm-btn:hover { background: #333; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </>
  );
}
