import React, { useEffect, useState, useMemo } from 'react';
import { useCommitFeedback } from '../hooks/useCommitFeedback';
import { getStockState, getUnitPrice } from '../utils/productFacts';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import FetchError from '../components/FetchError';
import VideoModal from '../components/shop/VideoModal';
import ProductCard from '../components/shop/ProductCard';

import { useCart } from '../context/cart-context';
import { useProduct } from '../hooks/useProduct';

const WEIGHT_OPTIONS = [
  { label: '250g', multiplier: 0.25 },
  { label: '500g', multiplier: 0.50 },
  { label: '1kg', multiplier: 1.0 }
];

const rotateByOffset = (items, offset) => {
  if (items.length === 0) return items;
  const shift = offset % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
};

const gram = (v) => (typeof v === 'number' ? `${v}g` : v);
const isMeaningful = (v) => {
  if (v === null || v === undefined || v === '') return false;
  const num = typeof v === 'number' ? v : parseFloat(v);
  return Number.isNaN(num) ? String(v).trim().length > 0 : num > 0;
};

export default function ProductDetails() {
  const { addToCart } = useCart();
  const { id } = useParams();
  const { product, products, loading, error, refetch } = useProduct(id);

  const [selectedImage, setSelectedImage] = useState(0);
  const [showPrepVideo, setShowPrepVideo] = useState(false);

  const [qty, setQty] = useState(1);
  const { committed, commit } = useCommitFeedback();
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedExclusions, setSelectedExclusions] = useState([]);
  const [removedIngredients, setRemovedIngredients] = useState([]);

  const [initializedProductId, setInitializedProductId] = useState(null);
  if (product && product.id !== initializedProductId) {
    setInitializedProductId(product.id);
    setQty(1);
    setSelectedExclusions([]);
    setRemovedIngredients([]);
    setSelectedWeight(product.category === 'Fresh Fruit' && product.unit === 'kg' ? WEIGHT_OPTIONS[2] : null);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const others = products.filter(p => p.id !== product.id);
    const sameCategory = others.filter(p => p.category === product.category);
    const otherCategories = others
      .filter(p => p.category !== product.category)
      .sort((a, b) => a.id - b.id);
    const variedOthers = rotateByOffset(otherCategories, product.id);
    return [...sameCategory, ...variedOthers].slice(0, 4);
  }, [products, product]);

  const handleAddToCart = () => {
    if (stockState?.available === false) return;
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

    commit();
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
      <div className="pd-shell">
        <div className="pd-grid">
          <div className="pd-skel-media" />
          <div className="pd-skel-lines">
            <div className="pd-skel-line pd-skel-40" />
            <div className="pd-skel-line pd-skel-70" />
            <div className="pd-skel-line pd-skel-30" />
            <div className="pd-skel-line" />
            <div className="pd-skel-line" />
            <div className="pd-skel-btn" />
          </div>
        </div>
      </div>
      <style>{pdSkeletonStyles}</style>
    </div>
  );

  if (error) return (
    <div className="pd-page">
      <div className="pd-message">
        <FetchError message="We couldn't load this product. Please check your connection and try again." onRetry={refetch} />
        <Link to="/shop" className="pd-back">Return to shop</Link>
      </div>
      <style>{pdMessageStyles}</style>
    </div>
  );

  if (!product) return (
    <div className="pd-page">
      <div className="pd-message">
        <h2 className="pd-notfound">Product not found</h2>
        <Link to="/shop" className="pd-back">Return to shop</Link>
      </div>
      <style>{pdMessageStyles}</style>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [];
  const oldPrice = product.discount > 0 ? Math.round(currentPrice / (1 - product.discount / 100)) : null;
  const unitSuffix = product.unit === 'kg' ? '/ kg' : product.unit === 'item' ? 'each' : product.unit ? `/ ${product.unit}` : '';
  const unitPrice = getUnitPrice(product);
  const stockState = getStockState(product);

  const nutrition = product.nutrition || {};
  const nutritionItems = [
    { label: 'Calories', display: nutrition.calories, raw: nutrition.calories },
    { label: 'Protein', display: gram(nutrition.protein), raw: nutrition.protein },
    { label: 'Carbs', display: gram(nutrition.carbs), raw: nutrition.carbs },
    { label: 'Fat', display: gram(nutrition.fat), raw: nutrition.fat },
  ].filter(n => isMeaningful(n.raw));

  return (
    <div className="pd-page">
      <SEO
        title={product ? `${product.title} — Fresh ${product.category} in Vizag` : 'Product Details'}
        description={product ? `Order ${product.title} from Frioo in Visakhapatnam. ${product.description?.substring(0, 120)}. Fresh, 100% natural. Delivery in Vizag.` : 'Fresh product details from Frioo Vizag.'}
        canonical={product ? `/product/${product.id}` : '/shop'}
        keywords={product ? `${product.title} vizag, ${product.category} vizag, buy ${product.title} online vizag, fresh ${product.category} visakhapatnam` : ''}
        structuredData={product ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              "name": product.title,
              "description": product.description,
              "image": product.images?.[0],
              "url": `https://frioo.in/product/${product.id}`,
              "sku": `FRIOO-${product.id}`,
              "brand": { "@type": "Brand", "name": "Frioo" },
              "category": product.category,
              "offers": {
                "@type": "Offer",
                "price": (product.price_cents / 100).toFixed(2),
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "url": `https://frioo.in/product/${product.id}`,
                "seller": { "@type": "Organization", "name": "Frioo" },
                "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
              }
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://frioo.in/" },
                { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://frioo.in/shop" },
                { "@type": "ListItem", "position": 3, "name": product.title, "item": `https://frioo.in/product/${product.id}` }
              ]
            }
          ]
        } : undefined}
      />

      <main className="pd-shell">
        <nav className="pd-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><span className="pd-crumb-current">{product.title}</span>
        </nav>

        <div className="pd-grid">
          <div className="pd-gallery">
            <div className="pd-gallery-sticky">
              <div className="pd-frame">
                {images[selectedImage]
                  ? <img loading="lazy" decoding="async" src={images[selectedImage]} alt={product.title} className="pd-frame-img" />
                  : <span className="pd-noimg">No photo yet</span>}
                {product.discount > 0 && <span className="pd-badge">Save {product.discount}%</span>}
              </div>

              {images.length > 1 && (
                <div className="pd-thumbs">
                  {images.map((img, idx) => (
                    <button key={idx} className={`pd-thumb${selectedImage === idx ? ' pd-thumb-on' : ''}`} onClick={() => setSelectedImage(idx)} aria-label={`View image ${idx + 1}`} aria-pressed={selectedImage === idx}>
                      <img loading="lazy" decoding="async" src={img} alt="" />
                    </button>
                  ))}
                </div>
              )}

              {product.video_url && (
                <button className="pd-watch" onClick={() => setShowPrepVideo(true)}>
                  <span className="pd-watch-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                  <span className="pd-watch-text">
                    <strong>Watch how it's made</strong>
                    <span>Exactly what you'll receive</span>
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="pd-details">
            <p className="pd-cat">{product.category}</p>
            <h1 className="pd-title">{product.title}</h1>

            <div className="pd-price-block">
              <div className="pd-price-row">
                <span className="pd-price">&#8377;{currentPrice.toFixed(0)}</span>
                {oldPrice && <span className="pd-old">&#8377;{oldPrice}</span>}
                <span className="pd-unit">{selectedWeight ? `/ ${selectedWeight.label}` : unitSuffix}</span>
              </div>
              {unitPrice && <div className="pd-measure">{unitPrice.label}</div>}
              {stockState && (
                <div className={`pd-stock pd-stock--${stockState.code}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {stockState.available ? <path d="M20 6 9 17l-5-5" /> : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>}
                  </svg>
                  {stockState.label}
                </div>
              )}
            </div>

            <p className="pd-delivery">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg>
              Delivered fresh in Visakhapatnam, within 6&nbsp;km
            </p>

            {product.description && <p className="pd-desc">{product.description}</p>}
            {(product.perfect_for || nutritionItems.length > 0) && (
              <div className="pd-support">
                {product.perfect_for && (
                  <div className="pd-support-block">
                    <h2 className="pd-support-title">Good for</h2>
                    <p className="pd-support-text">{product.perfect_for}</p>

            <div className="pd-options">
              {selectedWeight && (
                <div className="pd-opt-group">
                  <span className="pd-opt-label">Pack size</span>
                  <div className="pd-opt-pills">
                    {WEIGHT_OPTIONS.map(opt => (
                      <button key={opt.label} className={`pd-pill${selectedWeight.label === opt.label ? ' pd-pill-on' : ''}`} onClick={() => setSelectedWeight(opt)} aria-pressed={selectedWeight.label === opt.label}>{opt.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {product.nutrition?.exclusions?.length > 0 && (
                <div className="pd-opt-group">
                  <span className="pd-opt-label">Want to remove any?</span>
                  <div className="pd-opt-pills">
                    {product.nutrition.exclusions.map(item => (
                      <button key={item} className={`pd-pill${selectedExclusions.includes(item) ? ' pd-pill-on' : ''}`} onClick={() => toggleExclusion(item)} aria-pressed={selectedExclusions.includes(item)}>{selectedExclusions.includes(item) ? 'No ' : ''}{item}</button>
                    ))}
                  </div>
                </div>
              )}

              {product.nutrition?.ingredients?.length > 0 && (
                <div className="pd-opt-group">
                  <span className="pd-opt-label">Customize ingredients</span>
                  <div className="pd-opt-pills">
                    {product.nutrition.ingredients.map(item => (
                      <button key={item} className={`pd-pill${removedIngredients.includes(item) ? ' pd-pill-on' : ''}`} onClick={() => toggleIngredient(item)} aria-pressed={removedIngredients.includes(item)}>No {item}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pd-actions">
              <div className="pd-qty">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">&minus;</button>
                <span aria-live="polite">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} aria-label="Increase quantity">+</button>
              </div>
              <button className={`pd-add${committed ? ' pd-add-done' : ''}`} onClick={handleAddToCart} aria-disabled={stockState?.available === false}>
                {committed ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                    Added
                  </>
                ) : <>Add to cart &middot; &#8377;{(currentPrice * qty).toFixed(0)}</>}
              </button>
              <span className="fr-sr-only" aria-live="polite">{committed ? `${qty} ${product.title} added to cart.` : ''}</span>
            </div>

                  </div>
                )}
                {nutritionItems.length > 0 && (
                  <div className="pd-support-block">
                    <h2 className="pd-support-title">Nutrition</h2>
                    <div className="pd-nutri">
                      {nutritionItems.map(n => (
                        <div key={n.label} className="pd-nutri-item">
                          <strong>{n.display}</strong>
                          <span>{n.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="pd-related" aria-label="Related products">
            <h2 className="pd-related-title">These also go well</h2>
            <div className="pd-related-grid">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
            </div>
          </section>
        )}
      </main>

      {showPrepVideo && product.video_url && <VideoModal videoUrl={product.video_url} onClose={() => setShowPrepVideo(false)} />}

      <style>{`
        .pd-page { background: var(--fr-canvas); min-height: 100vh; padding-top: var(--navbar-height-mobile); }
        @media (min-width: 901px) { .pd-page { padding-top: var(--navbar-height-desktop); } }
        .pd-shell { max-width: 1200px; margin: 0 auto; padding: var(--fr-s6) var(--fr-s7) var(--fr-s10); }

        .pd-crumbs { display: flex; align-items: center; gap: var(--fr-s2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-3); margin-bottom: var(--fr-s6); flex-wrap: wrap; }
        .pd-crumbs a { color: var(--fr-text-2); text-decoration: none; }
        .pd-crumbs a:hover { color: var(--fr-brand); }
        .pd-crumbs a:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }
        .pd-crumb-current { color: var(--fr-text); }

        .pd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fr-s9); align-items: start; }

        .pd-gallery-sticky { position: sticky; top: calc(var(--navbar-height-desktop) + var(--fr-s5)); display: flex; flex-direction: column; gap: var(--fr-s4); }
        .pd-frame { position: relative; aspect-ratio: 4 / 5; background: var(--fr-surface-2); border-radius: var(--fr-r-surface); overflow: hidden; box-shadow: var(--fr-elev-1); }
        .pd-noimg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); color: var(--fr-text-3); }
        .pd-frame-img { width: 100%; height: 100%; object-fit: cover; }
        .pd-badge { position: absolute; top: var(--fr-s4); right: var(--fr-s4); background: var(--fr-warm); color: var(--fr-on-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); text-transform: uppercase; padding: 5px 11px; border-radius: var(--fr-r-control); }
        .pd-thumbs { display: flex; gap: var(--fr-s3); flex-wrap: wrap; }
        .pd-thumb { width: 72px; height: 72px; padding: 0; border: 2px solid transparent; border-radius: var(--fr-r-control); overflow: hidden; background: var(--fr-surface-2); cursor: pointer; }
        .pd-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .pd-thumb-on { border-color: var(--fr-brand); }
        .pd-thumb:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .pd-watch { display: flex; align-items: center; gap: var(--fr-s3); padding: var(--fr-s3) var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); cursor: pointer; text-align: left; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard); }
        .pd-watch:hover { border-color: var(--fr-brand); }
        .pd-watch:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
        .pd-watch-icon { width: 40px; height: 40px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; background: var(--fr-brand-tint); color: var(--fr-brand); border-radius: var(--fr-r-pill); }
        .pd-watch-text { display: flex; flex-direction: column; }
        .pd-watch-text strong { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); color: var(--fr-text); }
        .pd-watch-text span { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); }

        .pd-details { display: flex; flex-direction: column; }
        .pd-cat { font-family: var(--fr-font-mono); font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-eyebrow); text-transform: uppercase; color: var(--fr-brand); margin: 0 0 var(--fr-s2); }
        .pd-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-headline); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-headline); color: var(--fr-text); margin: 0 0 var(--fr-s5); }
        .pd-price-block { display: flex; flex-direction: column; gap: var(--fr-s1); padding-bottom: var(--fr-s5); border-bottom: 1px solid var(--fr-line); margin-bottom: var(--fr-s5); }
        .pd-price-row { display: flex; align-items: baseline; gap: var(--fr-s3); }
        .pd-price { font-family: var(--fr-font-sans); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text); font-variant-numeric: tabular-nums; }
        .pd-old { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-3); text-decoration: line-through; font-variant-numeric: tabular-nums; }
        .pd-unit { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); }
        .pd-stock { display: inline-flex; align-items: center; gap: var(--fr-s2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); margin-top: var(--fr-s2); }
        .pd-stock--in { color: var(--fr-success); }
        .pd-stock--out { color: var(--fr-text-3); }
        .pd-add[aria-disabled="true"] { opacity: 0.55; cursor: not-allowed; }
        .pd-measure { font-family: var(--fr-font-mono); font-size: var(--fr-fs-measure); font-weight: var(--fr-fw-regular); color: var(--fr-text-2); font-variant-numeric: tabular-nums; }
        .pd-delivery { display: flex; align-items: center; gap: var(--fr-s2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0 0 var(--fr-s5); }
        .pd-delivery svg { color: var(--fr-brand); flex-shrink: 0; }
        .pd-desc { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0 0 var(--fr-s6); max-width: 52ch; }

        .pd-options { display: flex; flex-direction: column; gap: var(--fr-s5); margin-bottom: var(--fr-s6); }
        .pd-opt-group { display: flex; flex-direction: column; gap: var(--fr-s3); }
        .pd-opt-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); color: var(--fr-text); }
        .pd-opt-pills { display: flex; flex-wrap: wrap; gap: var(--fr-s2); }
        .pd-pill { min-height: 44px; padding: 0 var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-pill); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), background var(--fr-dur-quick) var(--fr-ease-standard); }
        .pd-pill:hover { border-color: var(--fr-brand); color: var(--fr-brand); }
        .pd-pill-on { background: var(--fr-brand); border-color: var(--fr-brand); color: var(--fr-on-brand); }
        .pd-pill-on:hover { color: var(--fr-on-brand); }
        .pd-pill:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

        .pd-actions { display: flex; gap: var(--fr-s3); margin-bottom: var(--fr-s7); }
        .pd-qty { display: flex; align-items: center; border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); overflow: hidden; }
        .pd-qty button { width: 48px; height: 52px; background: var(--fr-surface); border: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-title); line-height: var(--fr-lh-control); color: var(--fr-text); cursor: pointer; }
        .pd-qty button:hover { background: var(--fr-surface-2); }
        .pd-qty button:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: -2px; }
        .pd-qty span { min-width: 44px; text-align: center; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); font-variant-numeric: tabular-nums; }
        .pd-add { flex: 1; height: 52px; background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); cursor: pointer; font-variant-numeric: tabular-nums; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .pd-add { display: inline-flex; align-items: center; justify-content: center; gap: var(--fr-s2); }
        .pd-add:hover { background: var(--fr-brand-press); }
        .pd-add-done { background: var(--fr-success); }
        .pd-add:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

        .pd-support { display: flex; flex-direction: column; gap: var(--fr-s5); border-top: 1px solid var(--fr-line); padding-top: var(--fr-s6); }
        .pd-support-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); letter-spacing: var(--fr-track-headline); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0 0 var(--fr-s3); }
        .pd-support-text { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0; }
        .pd-nutri { display: flex; flex-wrap: wrap; gap: var(--fr-s3); }
        .pd-nutri-item { display: flex; flex-direction: column; align-items: center; gap: 2px; background: var(--fr-surface-2); border-radius: var(--fr-r-card); padding: var(--fr-s3) var(--fr-s5); min-width: 92px; }
        .pd-nutri-item strong { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-brand); font-variant-numeric: tabular-nums; }
        .pd-nutri-item span { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); }

        .pd-related { border-top: 1px solid var(--fr-line); margin-top: var(--fr-s9); padding-top: var(--fr-s8); }
        .pd-related-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); letter-spacing: var(--fr-track-headline); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0 0 var(--fr-s5); }
        .pd-related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fr-s5); }

        @media (max-width: 900px) {
          .pd-shell { padding: var(--fr-s4) var(--fr-s4) calc(var(--fr-s9) + 80px); }
          .pd-grid { grid-template-columns: 1fr; gap: var(--fr-s6); }
          .pd-gallery-sticky { position: static; }
          .pd-related-grid { grid-template-columns: repeat(2, 1fr); gap: var(--fr-s4); }
          .pd-actions { position: fixed; bottom: 0; left: 0; right: 0; z-index: var(--fr-z-cta); background: var(--fr-surface); border-top: 1px solid var(--fr-line); padding: var(--fr-s3) var(--fr-s4); padding-bottom: calc(var(--fr-s3) + env(safe-area-inset-bottom)); margin: 0; box-shadow: var(--fr-elev-2); }
        }

        @media (prefers-reduced-motion: reduce) {
          .pd-watch, .pd-pill, .pd-add { transition: none; }
        }
      `}</style>
    </div>
  );
}

const pdSkeletonStyles = `
  .pd-page { background: var(--fr-canvas); min-height: 100vh; padding-top: var(--navbar-height-mobile); }
  @media (min-width: 901px) { .pd-page { padding-top: var(--navbar-height-desktop); } }
  .pd-shell { max-width: 1200px; margin: 0 auto; padding: var(--fr-s7); }
  .pd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fr-s9); }
  @media (max-width: 900px) { .pd-grid { grid-template-columns: 1fr; gap: var(--fr-s6); } }
  .pd-skel-media { aspect-ratio: 4 / 5; background: var(--fr-surface-2); border-radius: var(--fr-r-surface); }
  .pd-skel-lines { display: flex; flex-direction: column; gap: var(--fr-s4); padding-top: var(--fr-s3); }
  .pd-skel-line { height: 16px; border-radius: var(--fr-r-control); background: var(--fr-surface-2); }
  .pd-skel-40 { width: 40%; } .pd-skel-70 { width: 70%; height: 34px; } .pd-skel-30 { width: 30%; }
  .pd-skel-btn { height: 52px; border-radius: var(--fr-r-control); background: var(--fr-surface-2); margin-top: var(--fr-s3); }
  @media (prefers-reduced-motion: no-preference) { .pd-skel-media, .pd-skel-line, .pd-skel-btn { animation: pd-shimmer 1.4s var(--fr-ease-standard) infinite; } }
  @keyframes pd-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
`;

const pdMessageStyles = `
  .pd-page { background: var(--fr-canvas); min-height: 100vh; padding-top: var(--navbar-height-mobile); }
  @media (min-width: 901px) { .pd-page { padding-top: var(--navbar-height-desktop); } }
  .pd-message { max-width: 520px; margin: 0 auto; padding: var(--fr-s10) var(--fr-s5); text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--fr-s4); }
  .pd-notfound { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); letter-spacing: var(--fr-track-headline); line-height: var(--fr-lh-snug); color: var(--fr-text); margin: 0; }
  .pd-back { color: var(--fr-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); text-decoration: none; }
  .pd-back:hover { color: var(--fr-brand-press); }
  .pd-back:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; border-radius: var(--fr-r-control); }
`;
