import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import VideoModal from '../components/shop/VideoModal';
import ProductCard from '../components/shop/ProductCard';
import OptimizedImage from '../components/OptimizedImage'; // Assuming this exists or standard img
import { showToast } from '../utils/toast';
import { logger } from '../utils/logger';
import ScrollReveal from '../components/animations/ScrollReveal';
import StaggerText from '../components/animations/StaggerText';

import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config/constants';

const WEIGHT_OPTIONS = [
  { label: '250g', multiplier: 0.25 },
  { label: '500g', multiplier: 0.50 },
  { label: '1kg', multiplier: 1.0 }
];

export default function ProductDetails() {
  const { addToCart } = useCart();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [showPrepVideo, setShowPrepVideo] = useState(false);

  const [qty, setQty] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(null); // { label: '1kg', multiplier: 1 }
  const [selectedExclusions, setSelectedExclusions] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);



  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const response = await res.json();
        const data = response.data || {};
        const items = data.items || [];
        const found = items.find(p => p.id === parseInt(id));

        if (found) {
          setProduct(found);
          setQty(1);
          setSelectedExclusions([]);
          setRemovedIngredients([]);

          if (found.category === 'Fresh Fruit' && found.unit === 'kg') {
            setSelectedWeight(WEIGHT_OPTIONS[2]); // Default 1kg
          } else {
            setSelectedWeight(null);
          }

          const others = items.filter(p => p.id !== found.id);
          const sameCat = others.filter(p => p.category === found.category);
          const randomMix = others.filter(p => p.category !== found.category).sort(() => 0.5 - Math.random());
          setRelatedProducts([...sameCat, ...randomMix].slice(0, 4)); // Show 4 related
        }
      } catch (err) {
        logger.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    let finalPrice = product.price_cents / 100;
    let variantLabel = 'Standard';

    if (selectedWeight) {
      finalPrice = finalPrice * selectedWeight.multiplier;
      variantLabel = selectedWeight.label;
    }

    const customization = {
      exclusions: selectedExclusions,
      removedIngredients: removedIngredients
    };

    for (let i = 0; i < qty; i++) {
      addToCart(product, variantLabel, finalPrice, customization);
    }

    showToast(`Added ${qty} x ${product.title} to cart`, 'success');
  };

  const toggleExclusion = (item) => {
    setSelectedExclusions(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleIngredient = (item) => {
    setRemovedIngredients(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    let base = product.price_cents / 100;
    if (selectedWeight) base *= selectedWeight.multiplier;
    return base;
  }, [product, selectedWeight]);

  if (loading) return (
    <div className="pd-page">
      <Navbar />
      <div className="pd-loading"><LoadingSpinner /></div>
    </div>
  );

  if (!product) return (
    <div className="pd-page">
      <Navbar />
      <div className="pd-error">
        <h2>Product not found</h2>
        <Link to="/shop" className="back-link">Return to Shop</Link>
      </div>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : ['https://via.placeholder.com/600?text=Frioo'];

  return (
    <div className="pd-page">
      <SEO
        title={product ? `${product.title} — Fresh ${product.category} in Vizag` : 'Product Details'}
        description={product ? `Order ${product.title} from Frioo in Visakhapatnam. ${product.description?.substring(0, 120)}. Fresh, 100% natural. Delivery in Vizag.` : 'Fresh product details from Frioo Vizag.'}
        canonical={product ? `/product/${product.id}` : '/shop'}
        keywords={product ? `${product.title} vizag, ${product.category} vizag, buy ${product.title} online vizag, fresh ${product.category} visakhapatnam` : ''}
        structuredData={product ? {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.title,
          "description": product.description,
          "image": product.images?.[0],
          "brand": { "@type": "Brand", "name": "Frioo" },
          "offers": {
            "@type": "Offer",
            "price": (product.price_cents / 100).toFixed(2),
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
            "seller": { "@type": "Organization", "name": "Frioo Vizag" },
            "areaServed": { "@type": "City", "name": "Visakhapatnam" }
          },
          "category": product.category
        } : undefined}
      />
      <Navbar />

      <main className="pd-main">
        <div className="pd-breadcrumb">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span>{product.title}</span>
        </div>

        <div className="pd-grid">
          <div className="pd-gallery">
            <ScrollReveal direction="fade" duration={0.8}>
              <div className="pd-main-image-frame">
                <img src={images[selectedImage]} alt={product.title} className="pd-main-img" />
                {product.discount && <span className="pd-badge-sale">Save {product.discount}%</span>}
              </div>
            </ScrollReveal>

            {images.length > 1 && (
              <ScrollReveal delay={0.2} direction="up">
                <div className="pd-thumbnails">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      className={`pd-thumb ${selectedImage === idx ? 'active' : ''}`}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img src={img} alt={`Thumb ${idx}`} />
                    </button>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {product.video_url && (
              <button className="pd-watch-btn" onClick={() => setShowPrepVideo(true)}>
                <span className="icon">▶</span>
                <div className="text">
                  <strong>Watch Preparation</strong>
                  <span>See fresh creation</span>
                </div>
              </button>
            )}
          </div>

          <div className="pd-details">
            <div className="pd-header">
              <ScrollReveal delay={0.1}>
                <span className="pd-cat-tag">{product.category}</span>
              </ScrollReveal>
              <StaggerText text={product.title} className="pd-title" stagger={0.05} />

              <ScrollReveal delay={0.2}>
                <div className="pd-price-row">
                  <span className="pd-price">₹{currentPrice.toFixed(0)}</span>
                  {product.discount && (
                    <span className="pd-old-price">₹{(currentPrice * 1.2).toFixed(0)}</span>
                  )}
                  <span className="pd-unit-label">
                    {selectedWeight ? `/ ${selectedWeight.label}` : '/ item'}
                  </span>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={0.3}>
              <p className="pd-desc">{product.description}</p>
            </ScrollReveal>

            <div className="pd-options">

              {selectedWeight && (
                <div className="pd-option-group">
                  <label>Pack Size</label>
                  <div className="pd-pill-row">
                    {WEIGHT_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        className={`pd-pill ${selectedWeight.label === opt.label ? 'active' : ''}`}
                        onClick={() => setSelectedWeight(opt)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.nutrition?.exclusions?.length > 0 && (
                <div className="pd-option-group">
                  <label>Want to remove any?</label>
                  <div className="pd-pill-row">
                    {product.nutrition.exclusions.map(item => (
                      <button
                        key={item}
                        className={`pd-pill ${selectedExclusions.includes(item) ? 'active' : ''}`}
                        onClick={() => toggleExclusion(item)}
                      >
                        {selectedExclusions.includes(item) ? '✓ No ' : ''}{item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.nutrition?.ingredients?.length > 0 && (
                <div className="pd-option-group">
                  <label>Customize Ingredients</label>
                  <div className="pd-pill-row">
                    {product.nutrition.ingredients.map(item => (
                      <button
                        key={item}
                        className={`pd-pill glass-red ${removedIngredients.includes(item) ? 'active' : ''}`}
                        onClick={() => toggleIngredient(item)}
                      >
                        {removedIngredients.includes(item) ? '✕ ' : ''}No {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pd-actions">
              <div className="pd-qty-control">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <button className="pd-add-btn" onClick={handleAddToCart}>
                Add to Cart • ₹{(currentPrice * qty).toFixed(0)}
              </button>
            </div>

            <div className="pd-info-sections">
              <div className="pd-info-block">
                <h3>Description</h3>
                <p>{product.description}</p>
                <p><strong>Perfect for:</strong> {product.perfect_for || 'Any time of day snack or boost.'}</p>
                <p className="small-text">Made fresh specifically for your order.</p>
              </div>

              <div className="pd-info-block">
                <h3>Nutrition Facts</h3>
                <div className="pd-nutri-grid">
                  <div className="nutri-item">
                    <strong>{product.nutrition?.calories || 120}</strong>
                    <span>Calories</span>
                  </div>
                  <div className="nutri-item">
                    <strong>{product.nutrition?.protein || '2g'}</strong>
                    <span>Protein</span>
                  </div>
                  <div className="nutri-item">
                    <strong>{product.nutrition?.carbs || '15g'}</strong>
                    <span>Carbs</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <section className="pd-related">
          <ScrollReveal>
            <h2 className="section-title">You might also like</h2>
          </ScrollReveal>
          <div className="pd-related-grid">
            {relatedProducts.map((p, idx) => (
              <ScrollReveal key={p.id} delay={0.1 * idx} direction="fade" className="related-item-reveal">
                <ProductCard product={p} onAdd={addToCart} />
              </ScrollReveal>
            ))}
          </div>
        </section>

      </main>

      {showPrepVideo && product.video_url && (
        <VideoModal videoUrl={product.video_url} onClose={() => setShowPrepVideo(false)} />
      )}

      <style>{`
        .pd-page {
            background: #fff;
            min-height: 100vh;
            color: #1a1a1a;
            padding-top: var(--navbar-height-mobile); /* Responsive navbar clearance */
        }
        .pd-main {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .pd-breadcrumb {
            font-size: 0.9rem;
            color: #888;
            margin-bottom: 30px;
            padding-top: 10px;
        }
        .pd-breadcrumb a {
            color: #1a1a1a;
            text-decoration: none;
            transition: color 0.2s;
        }
        .pd-breadcrumb a:hover { color: #C5A065; }

        .pd-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            margin-bottom: 80px;
        }

        .pd-gallery {
            position: sticky;
            top: 120px;
            height: fit-content;
        }
        .pd-main-image-frame {
            width: 100%;
            aspect-ratio: 1;
            background: #f9f9f9;
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid #eee;
            position: relative;
        }
        .pd-main-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        }
        .pd-main-img:hover { transform: scale(1.05); }

        .pd-badge-sale {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #FF5252;
            color: white;
            padding: 6px 14px;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 700;
        }

        .pd-thumbnails {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }
        .pd-thumb {
            width: 80px;
            height: 80px;
            border: 2px solid transparent;
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            padding: 0;
            background: #f9f9f9;
            transition: all 0.2s;
        }
        .pd-thumb.active { border-color: #C5A065; }
        .pd-thumb img { width: 100%; height: 100%; object-fit: cover; }

        .pd-watch-btn {
            width: 100%;
            margin-top: 25px;
            padding: 15px;
            background: #fdfbf7;
            border: 1px solid #eaeaea;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 15px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .pd-watch-btn:hover { border-color: #C5A065; background: #fffdf5; }
        .pd-watch-btn .icon {
            width: 40px;
            height: 40px;
            background: #C5A065;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
        }
        .pd-watch-btn .text { display: flex; flex-direction: column; text-align: left; }
        .pd-watch-btn .text strong { color: #2F4F4F; font-size: 1rem; }
        .pd-watch-btn .text span { color: #888; font-size: 0.85rem; }

        .pd-details { display: flex; flex-direction: column; }
        .pd-cat-tag {
            display: inline-block;
            color: #C5A065;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.8rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .pd-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            line-height: 1.1;
            margin-bottom: 15px;
            color: #2F4F4F;
        }
        .pd-price-row {
            display: flex;
            align-items: baseline;
            gap: 15px;
            margin-bottom: 30px;
            padding-bottom: 30px;
            border-bottom: 1px solid #eee;
        }
        .pd-price { font-size: 2rem; font-weight: 700; color: #1a1a1a; }
        .pd-old-price { font-size: 1.2rem; color: #ccc; text-decoration: line-through; }
        .pd-unit-label { font-size: 1rem; color: #888; }
        
        .pd-desc {
            font-size: 1.05rem;
            line-height: 1.6;
            color: #555;
            margin-bottom: 30px;
        }

        .pd-options { margin-bottom: 30px; }
        .pd-option-group { margin-bottom: 25px; }
        .pd-option-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 12px;
            color: #333;
            font-size: 0.95rem;
        }
        .pd-pill-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .pd-pill {
            padding: 10px 20px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 50px;
            font-size: 0.9rem;
            color: #555;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: 'Inter', sans-serif;
        }
        .pd-pill:hover {
            border-color: #C5A065;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(197, 160, 101, 0.2);
        }
        .pd-pill.active {
            border-color: #C5A065;
            background: #C5A065;
            color: white;
            transform: translateY(-1px);
        }
        .pd-pill.glass-red:hover {
            border-color: #e57373;
            box-shadow: 0 4px 12px rgba(229, 115, 115, 0.2);
        }
        .pd-pill.glass-red.active {
            border-color: #e57373;
            background: #e57373;
            color: white;
        }

        .pd-actions {
            display: flex;
            gap: 15px;
            margin-bottom: 40px;
        }
        .pd-qty-control {
            display: flex;
            align-items: center;
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 5px;
        }
        .pd-qty-control button {
            width: 40px;
            height: 40px;
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: #2F4F4F;
        }
        .pd-qty-control span {
            width: 30px;
            text-align: center;
            font-weight: 600;
        }
        .pd-add-btn {
            flex: 1;
            background: #2F4F4F;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); /* Framer's expo out */
            will-change: transform;
            transform: translateZ(0);
        }
        .pd-add-btn:hover {
            background: #1a1a1a;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        .pd-add-btn:active {
            transform: translateY(0px) scale(0.98);
            transition-duration: 0.1s;
        }

        .pd-info-sections {
            display: flex;
            flex-direction: column;
            gap: 30px;
            border-top: 1px solid #eee;
            padding-top: 30px;
        }
        .pd-info-block h3 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: #2F4F4F;
            margin-bottom: 15px;
        }
        .pd-info-block p {
            color: #666;
            line-height: 1.7;
            margin-bottom: 10px;
        }
        .pd-nutri-grid {
            display: flex;
            gap: 30px;
        }
        .nutri-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #f9f9f9;
            padding: 15px 25px;
            border-radius: 12px;
            min-width: 100px;
        }
        .nutri-item strong { color: #C5A065; font-size: 1.5rem; }
        .nutri-item span { color: #888; font-size: 0.9rem; margin-top: 5px; }

        .pd-related {
            border-top: 1px solid #eee;
            padding-top: 50px;
            margin-top: 40px;
            overflow: hidden; 
        }
        .section-title {
            text-align: center;
            font-family: 'Playfair Display', serif;
            font-size: 2rem; /* Slightly smaller title */
            margin-bottom: 30px;
            color: #2F4F4F;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .pd-related-grid {
            display: flex;
            overflow-x: auto;
            gap: 15px; /* Tighter gap */
            padding: 10px 20px 30px 20px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
        }
        .pd-related-grid::-webkit-scrollbar { display: none; }
        
        .pd-related-grid > * {
            flex: 0 0 190px; /* Mini Card Width from Home.jsx */
            scroll-snap-align: start;
        }

        .pd-related-grid .patisserie-card .card-price { font-size: 1rem; }
        .pd-related-grid .patisserie-card .card-title { font-size: 0.95rem; }
        .pd-related-grid .patisserie-card .action-btn { padding: 10px; font-size: 0.8rem; }
        .pd-related-grid .patisserie-card .card-desc { display: none; } /* Hide desc for mini look */
        .pd-related-grid .patisserie-card .badge-pop { font-size: 0.6rem; padding: 2px 8px; }

        @media (max-width: 900px) {
            .pd-page { 
                padding-top: var(--navbar-height-desktop); /* Desktop navbar with secondary nav */ 
            }
            .pd-grid { grid-template-columns: 1fr; gap: 40px; }
            .pd-gallery { position: static; }
            .pd-title { font-size: 2.2rem; }
            
            .pd-actions {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                padding: 15px 20px;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
                margin: 0;
                z-index: 100;
            }
            .pd-page { padding-bottom: 120px; } 

            .pd-related-grid {
                gap: 12px;
                padding-left: 15px;
            }
            .pd-related-grid > * {
                flex: 0 0 160px; /* Even smaller for mobile to show more context */
            }
        }
      `}</style>
    </div>
  );
}