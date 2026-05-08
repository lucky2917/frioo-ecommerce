import { useState } from 'react';
import { PRODUCT_CATEGORIES } from '../../config/constants';

export default function ShopFilters({
  activeTab,
  setActiveTab,
  tabs,
  products,
  priceRange,
  onPriceChange,
  maxPrice
}) {
  const [openSections, setOpenSections] = useState({ categories: true, price: true });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getCategoryCount = (tab) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.label === tab);
    if (!cat || cat.dbValue === null) return products.filter(p => p.featured).length;
    return products.filter(p => p.category === cat.dbValue).length;
  };

  return (
    <div className="shop-sidebar">
      <div className="filter-group">
        <button className="accordion-header" onClick={() => toggleSection('categories')}>
          <span>Category</span>
          <span className={`arrow ${openSections.categories ? 'open' : ''}`}>▼</span>
        </button>

        {openSections.categories && (
          <div className="accordion-content">
            {tabs.map(tab => (
              <label key={tab} className="filter-checkbox-row">
                <input
                  type="radio"
                  name="category"
                  checked={activeTab === tab}
                  onChange={() => setActiveTab(tab)}
                  className="custom-radio"
                />
                <span className="filter-label">{tab}</span>
                <span className="count-badge">{getCategoryCount(tab)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="divider"></div>

      <div className="filter-group">
        <button className="accordion-header" onClick={() => toggleSection('price')}>
          <span>Price</span>
          <span className={`arrow ${openSections.price ? 'open' : ''}`}>▼</span>
        </button>

        {openSections.price && (
          <div className="accordion-content">
            <p className="price-info">Up to ₹{maxPrice.toFixed(0)}</p>
            <div className="price-inputs">
              <div className="price-field">
                <span>₹</span>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={priceRange[0] || ''}
                  onChange={e => onPriceChange([Number(e.target.value) || 0, priceRange[1]])}
                />
              </div>
              <span className="to">to</span>
              <div className="price-field">
                <span>₹</span>
                <input
                  type="number"
                  placeholder={maxPrice.toFixed(0)}
                  value={priceRange[1] === maxPrice ? '' : priceRange[1]}
                  onChange={e => onPriceChange([priceRange[0], Number(e.target.value) || maxPrice])}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .shop-sidebar {
          width: 250px;
          padding-right: 30px;
        }

        .divider {
          height: 1px;
          background: #e5e5e5;
          margin: 15px 0;
        }

        .accordion-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: none;
          border: none;
          padding: 10px 0;
          cursor: pointer;
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .arrow {
          font-size: 0.7rem;
          transition: transform 0.3s ease;
          color: #666;
        }
        .arrow.open { transform: rotate(180deg); }

        .accordion-content {
          padding-bottom: 10px;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .filter-checkbox-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          color: #4a4a4a;
        }

        .filter-checkbox-row:hover .filter-label { color: #C5A065; }

        .custom-radio {
          accent-color: #C5A065;
          margin-right: 10px;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .filter-label { flex: 1; }

        .count-badge { color: #999; font-size: 0.85rem; }

        .price-info { font-size: 0.85rem; color: #666; margin-bottom: 15px; }

        .price-inputs {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .price-field {
          display: flex;
          align-items: center;
          background: #f5f5f5;
          padding: 8px 12px;
          border-radius: 8px;
          flex: 1;
        }

        .price-field span { color: #666; margin-right: 5px; }

        .price-field input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.9rem;
          color: #333;
        }

        .to { font-size: 0.9rem; color: #666; }
      `}</style>
    </div>
  );
}
