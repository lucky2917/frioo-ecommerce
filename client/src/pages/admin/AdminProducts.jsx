import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { showToast } from '../../utils/toast';
import { logger } from '../../utils/logger';

const INITIAL_FORM = {
    id: null,
    title: '',
    category: 'Fresh Fruit',
    price: '',
    unit: 'kg',
    image_url: '',
    description: '',
    featured: false,
    nutrition: {
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
    }
};

const CATEGORIES = ["All", "Pure Fruit Juice", "Fruit Milkshake", "Salad", "Fresh Fruit"];

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            logger.error(err);
            showToast("Failed to fetch inventory", 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = activeTab === "All"
        ? products
        : products.filter(p => p.category === activeTab);

    // Calculate metrics
    const metrics = {
        total: products.length,
        featured: products.filter(p => p.featured).length,
        categories: CATEGORIES.filter(c => c !== "All").reduce((acc, cat) => {
            acc[cat] = products.filter(p => p.category === cat).length;
            return acc;
        }, {})
    };

    const handleAddNew = () => {
        setFormData(INITIAL_FORM);
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        let imageUrl = '';
        if (Array.isArray(product.images) && product.images.length > 0) {
            imageUrl = product.images[0];
        } else if (typeof product.images === 'string') {
            imageUrl = product.images;
        }

        let priceValue = '';
        if (typeof product.price_cents === 'number') {
            priceValue = (product.price_cents / 100).toString();
        } else if (typeof product.price_cents === 'string') {
            priceValue = (parseFloat(product.price_cents) / 100).toString();
        }

        setFormData({
            id: product.id,
            title: String(product.title || ''),
            category: String(product.category || 'Fresh Fruit'),
            price: priceValue,
            unit: String(product.unit || 'kg'),
            image_url: String(imageUrl),
            description: String(product.description || ''),
            featured: Boolean(product.featured),
            nutrition: {
                calories: product.nutrition?.calories?.toString() || '',
                protein: product.nutrition?.protein?.toString() || '',
                carbs: product.nutrition?.carbs?.toString() || '',
                fat: product.nutrition?.fat?.toString() || ''
            }
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const res = await fetch(`/api/admin/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await res.json();

            if (data.success) {
                showToast("Product deleted successfully", 'success');
                setProducts(prev => prev.filter(p => p.id !== id));
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            showToast(err.message || "Delete failed", 'error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const price_cents = Math.round(parseFloat(formData.price) * 100);
            const images = [formData.image_url];

            const payload = {
                title: formData.title,
                category: formData.category,
                price_cents,
                unit: formData.unit,
                images,
                description: formData.description,
                featured: formData.featured,
                nutrition: {
                    calories: parseFloat(formData.nutrition?.calories) || 0,
                    protein: parseFloat(formData.nutrition?.protein) || 0,
                    carbs: parseFloat(formData.nutrition?.carbs) || 0,
                    fat: parseFloat(formData.nutrition?.fat) || 0
                }
            };

            const url = formData.id
                ? `/api/admin/products/${formData.id}`
                : `/api/admin/products`;

            const method = formData.id ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data.success) {
                // Extract error message properly (data.error could be object or string)
                const errorMsg = typeof data.error === 'object'
                    ? (data.error.message || JSON.stringify(data.error))
                    : (data.error || 'Operation failed');
                throw new Error(errorMsg);
            }

            showToast(`Product ${formData.id ? 'updated' : 'created'} successfully!`, 'success');
            fetchProducts();
            setIsModalOpen(false);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast('Invalid file type. Please upload JPG, PNG, or WebP images only.', 'error');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showToast('File too large. Maximum size is 5MB.', 'error');
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            // Create FormData
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            // Simulate progress (since we can't track actual upload progress easily)
            setFormData(prev => ({ ...prev, uploadProgress: 10 }));

            // Upload to server
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formDataUpload
            });

            setFormData(prev => ({ ...prev, uploadProgress: 90 }));

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.error || 'Upload failed');
            }

            // Set the uploaded image URL
            setFormData(prev => ({
                ...prev,
                image_url: result.url,
                uploadProgress: null
            }));

            showToast('Image uploaded successfully!', 'success');

        } catch (err) {
            logger.error('Upload error:', err);
            showToast(err.message || 'Failed to upload image', 'error');
            setFormData(prev => ({ ...prev, uploadProgress: null }));
        }
    };

    if (loading) return <div className="loading-state">Loading inventory...</div>;

    return (
        <div className="inventory-page">
            {/* HEADER */}
            <div className="inventory-header">
                <div>
                    <h1 className="page-title">Product Inventory</h1>
                    <p className="page-subtitle">Manage products, pricing, and categories</p>
                </div>
                <button className="btn-add-product" onClick={handleAddNew}>
                    <span className="btn-icon">+</span>
                    Add Product
                </button>
            </div>

            {/* METRICS */}
            <div className="metrics-row">
                <div className="metric-card">
                    <div className="metric-label">Total Products</div>
                    <div className="metric-value">{metrics.total}</div>
                </div>
                <div className="metric-card featured">
                    <div className="metric-label">Featured Items</div>
                    <div className="metric-value">{metrics.featured}</div>
                </div>
                {Object.entries(metrics.categories).map(([cat, count]) => (
                    <div key={cat} className="metric-card category">
                        <div className="metric-label">{cat}</div>
                        <div className="metric-value">{count}</div>
                    </div>
                ))}
            </div>

            {/* CATEGORY TABS */}
            <div className="category-tabs">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`category-tab ${activeTab === cat ? 'active' : ''}`}
                        onClick={() => setActiveTab(cat)}
                    >
                        <span className="tab-label">{cat}</span>
                        <span className="tab-count">
                            {cat === "All" ? metrics.total : (metrics.categories[cat] || 0)}
                        </span>
                    </button>
                ))}
            </div>

            {/* PRODUCTS GRID */}
            <div className="products-grid">
                {filteredProducts.map(product => (
                    <div key={product.id} className={`product-card ${product.featured ? 'featured' : ''}`}>
                        <div className="product-image">
                            <img src={product.images?.[0] || '/placeholder.png'} alt={product.title} />
                            {product.featured && <div className="featured-indicator">Featured</div>}
                            <div className="product-category">{product.category}</div>
                        </div>

                        <div className="product-details">
                            <h3 className="product-name">{product.title}</h3>
                            <div className="product-meta">
                                <span className="product-unit">{product.unit}</span>
                            </div>
                            <div className="product-price-row">
                                <div className="product-price">
                                    <span className="currency">₹</span>
                                    <span className="amount">{(product.price_cents / 100).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="product-actions">
                            <button className="action-edit" onClick={() => handleEdit(product)}>
                                Edit
                            </button>
                            <button className="action-delete" onClick={() => handleDelete(product.id)}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}

                {filteredProducts.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-title">No products found</div>
                        <div className="empty-subtitle">
                            {activeTab === "All"
                                ? "Add your first product to get started"
                                : `No products in ${activeTab} category`}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setIsModalOpen(false)}>
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2 className="modal-title">{formData.id ? 'Edit Product' : 'New Product'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-grid">
                                <div className="form-field full">
                                    <label>Product Name</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Fresh Alphonso Mango"
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.filter(c => c !== "All").map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="kg">Kilogram (kg)</option>
                                        <option value="piece">Piece</option>
                                        <option value="box">Box</option>
                                        <option value="glass">Glass</option>
                                        <option value="bowl">Bowl</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Price (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="150.00"
                                        required
                                        min="0"
                                    />
                                </div>

                                <div className="form-field full">
                                    <label>Product Image</label>

                                    {/* Toggle between URL and Upload */}
                                    <div className="upload-tabs">
                                        <button
                                            type="button"
                                            className={`upload-tab ${formData.uploadMethod === 'url' || !formData.uploadMethod ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, uploadMethod: 'url' })}
                                        >
                                            📎 Image URL
                                        </button>
                                        <button
                                            type="button"
                                            className={`upload-tab ${formData.uploadMethod === 'upload' ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, uploadMethod: 'upload' })}
                                        >
                                            📤 Upload File
                                        </button>
                                    </div>

                                    {/* URL Input */}
                                    {(!formData.uploadMethod || formData.uploadMethod === 'url') && (
                                        <input
                                            type="url"
                                            value={formData.image_url}
                                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                            required
                                        />
                                    )}

                                    {/* File Upload */}
                                    {formData.uploadMethod === 'upload' && (
                                        <div
                                            className={`file-upload-zone ${formData.uploadDragging ? 'dragging' : ''}`}
                                            onDragEnter={e => { e.preventDefault(); setFormData({ ...formData, uploadDragging: true }); }}
                                            onDragLeave={e => { e.preventDefault(); setFormData({ ...formData, uploadDragging: false }); }}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={async (e) => {
                                                e.preventDefault();
                                                setFormData({ ...formData, uploadDragging: false });
                                                const file = e.dataTransfer.files[0];
                                                if (file) await handleFileUpload(file);
                                            }}
                                        >
                                            <input
                                                type="file"
                                                id="image-upload"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={e => handleFileUpload(e.target.files[0])}
                                                style={{ display: 'none' }}
                                            />
                                            <label htmlFor="image-upload" className="upload-label">
                                                {formData.uploadProgress ? (
                                                    <>
                                                        <div className="upload-spinner"></div>
                                                        <p>Uploading... {formData.uploadProgress}%</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="upload-icon">📁</div>
                                                        <p className="upload-title">Drag & drop an image or click to browse</p>
                                                        <p className="upload-subtitle">PNG, JPG, WebP • Max 5MB</p>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    )}

                                    {/* Image Preview */}
                                    {formData.image_url && (
                                        <div className="image-preview">
                                            <img src={formData.image_url} alt="Preview" onError={e => e.target.src = '/placeholder.png'} />
                                            <button
                                                type="button"
                                                className="remove-image"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-field full">
                                    <label>Description (Optional)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Product description..."
                                        rows="3"
                                    />
                                </div>

                                {/* NUTRITION FIELDS */}
                                <div className="form-field full" style={{ marginTop: '10px' }}>
                                    <label style={{ marginBottom: '12px', display: 'block', fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>Nutritional Information (per 100g/ml)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Calories (kcal)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.nutrition?.calories || ''}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    nutrition: { ...formData.nutrition, calories: e.target.value }
                                                })}
                                                placeholder="85"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Protein (g)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.nutrition?.protein || ''}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    nutrition: { ...formData.nutrition, protein: e.target.value }
                                                })}
                                                placeholder="1.5"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Carbs (g)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.nutrition?.carbs || ''}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    nutrition: { ...formData.nutrition, carbs: e.target.value }
                                                })}
                                                placeholder="20"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Fat (g)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.nutrition?.fat || ''}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    nutrition: { ...formData.nutrition, fat: e.target.value }
                                                })}
                                                placeholder="0.5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-field full">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.featured}
                                            onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                                        />
                                        <span>Mark as Featured Product</span>
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save" disabled={submitting}>
                                    {submitting ? 'Saving...' : (formData.id ? 'Update Product' : 'Create Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .inventory-page {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    padding-bottom: 60px;
                }

                /* HEADER */
                .inventory-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }

                .page-title {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0 0 4px;
                    letter-spacing: -0.025em;
                }

                .page-subtitle {
                    color: #64748b;
                    font-size: 0.95rem;
                    margin: 0;
                }

                .btn-add-product {
                    background: #0f172a;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .btn-add-product:hover {
                    background: #1e293b;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
                }

                .btn-icon {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                /* METRICS */
                .metrics-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .metric-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                    transition: all 0.2s;
                }

                .metric-card:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .metric-card.featured {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border: none;
                }

                .metric-card.featured .metric-label,
                .metric-card.featured .metric-value {
                    color: white;
                }

                .metric-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-bottom: 8px;
                }

                .metric-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                /* CATEGORY TABS */
                .category-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 24px;
                    border-bottom: 2px solid #e2e8f0;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .category-tab {
                    background: none;
                    border: none;
                    padding: 12px 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 3px solid transparent;
                    margin-bottom: -2px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                }

                .category-tab:hover {
                    color: #0f172a;
                }

                .category-tab.active {
                    color: #0f172a;
                    border-bottom-color: #0f172a;
                }

                .tab-count {
                    background: #f1f5f9;
                    color: #475569;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .category-tab.active .tab-count {
                    background: #0f172a;
                    color: white;
                }

                /* PRODUCTS GRID */
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 40px 30px;
                }

                .product-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                }

                .product-card:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }

                .product-card.featured {
                    border-left: 4px solid #0f172a;
                }

                .product-image {
                    position: relative;
                    height: 200px;
                    background: #f8fafc;
                    overflow: hidden;
                }

                .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .featured-indicator {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: #0f172a;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .product-category {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(8px);
                    color: #334155;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                .product-details {
                    padding: 16px;
                    flex: 1;
                }

                .product-name {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #0f172a;
                    margin: 0 0 8px;
                    line-height: 1.4;
                }

                .product-meta {
                    margin-bottom: 12px;
                }

                .product-unit {
                    font-size: 0.8rem;
                    color: #64748b;
                    text-transform: capitalize;
                }

                .product-price-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .product-price {
                    display: flex;
                    align-items: baseline;
                    gap: 2px;
                }

                .currency {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #64748b;
                }

                .amount {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .product-actions {
                    padding: 12px 16px;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    gap: 8px;
                }

                .action-edit,
                .action-delete {
                    flex: 1;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .action-edit {
                    background: #f8fafc;
                    color: #334155;
                }

                .action-edit:hover {
                    background: #e2e8f0;
                }

                .action-delete {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .action-delete:hover {
                    background: #fee2e2;
                }

                /* EMPTY STATE */
                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 80px 20px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                }

                .empty-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #334155;
                    margin-bottom: 8px;
                }

                .empty-subtitle {
                    font-size: 0.95rem;
                    color: #94a3b8;
                }

                /* MODAL */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .modal-container {
                    background: white;
                    border-radius: 16px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }

                .modal-header {
                    padding: 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    color: #94a3b8;
                    cursor: pointer;
                    line-height: 1;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .modal-close:hover {
                    background: #f1f5f9;
                    color: #334155;
                }

                .modal-form {
                    padding: 24px;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }

                .form-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-field.full {
                    grid-column: 1 / -1;
                }

                .form-field label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #475569;
                }

                .form-field input,
                .form-field select,
                .form-field textarea {
                    padding: 10px 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-family: inherit;
                    transition: all 0.2s;
                }

                .form-field input:focus,
                .form-field select:focus,
                .form-field textarea:focus {
                    outline: none;
                    border-color: #0f172a;
                    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
                }

                .image-preview {
                    margin-top: 12px;
                    width: 120px;
                    height: 120px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }

                .image-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .remove-image {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgba(220, 38, 38, 0.9);
                    color: white;
                    border: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .remove-image:hover {
                    background: #dc2626;
                    transform: scale(1.1);
                }

                /* UPLOAD TABS */
                .upload-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                    background: #f8fafc;
                    padding: 4px;
                    border-radius: 8px;
                }

                .upload-tab {
                    flex: 1;
                    padding: 8px 16px;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-size: 0.875rem;
                    font-weight: 600;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .upload-tab:hover {
                    color: #334155;
                }

                .upload-tab.active {
                    background: white;
                    color: #0f172a;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                /* FILE UPLOAD ZONE */
                .file-upload-zone {
                    border: 2px dashed #cbd5e1;
                    border-radius: 12px;
                    background: #f8fafc;
                    transition: all 0.3s;
                    cursor: pointer;
                }

                .file-upload-zone:hover {
                    border-color: #94a3b8;
                    background: #f1f5f9;
                }

                .file-upload-zone.dragging {
                    border-color: #0f172a;
                    background: #e2e8f0;
                    transform: scale(1.02);
                }

                .upload-label {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 48px 24px;
                    cursor: pointer;
                    text-align: center;
                }

                .upload-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.6;
                }

                .upload-title {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #334155;
                    margin: 0 0 8px;
                }

                .upload-subtitle {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    margin: 0;
                }

                /* UPLOAD PROGRESS */
                .upload-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e2e8f0;
                    border-top-color: #0f172a;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 16px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    font-size: 0.95rem;
                    color: #334155;
                    font-weight: 500;
                }

                .checkbox-label input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .modal-footer {
                    padding: 20px 24px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .btn-cancel,
                .btn-save {
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .btn-cancel {
                    background: #f1f5f9;
                    color: #475569;
                }

                .btn-cancel:hover {
                    background: #e2e8f0;
                }

                .btn-save {
                    background: #0f172a;
                    color: white;
                }

                .btn-save:hover:not(:disabled) {
                    background: #1e293b;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
                }

                .btn-save:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .loading-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    color: #64748b;
                    font-size: 1.1rem;
                }

                /* RESPONSIVE */
                @media (max-width: 768px) {
                    .inventory-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 16px;
                    }

                    .btn-add-product {
                        width: 100%;
                        justify-content: center;
                    }

                    .metrics-row {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .products-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 20px 10px;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }

                    .modal-footer {
                        flex-direction: column-reverse;
                    }

                    .btn-cancel,
                    .btn-save {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}