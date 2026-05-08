import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { showToast } from '../../utils/toast';
import { logger } from '../../utils/logger';
import { API_BASE_URL, PRODUCT_CATEGORIES } from '../../config/constants';

const DB_CATEGORIES = PRODUCT_CATEGORIES.filter(c => c.dbValue !== null).map(c => c.dbValue);
const CATEGORIES = ['All', ...DB_CATEGORIES];

const INITIAL_FORM = {
    id: null,
    title: '',
    category: DB_CATEGORIES[3],
    price: '',
    unit: 'kg',
    stock: '',
    image_url: '',
    description: '',
    featured: false,
    discount: '',
    perfect_for: '',
    video_url: '',
    uploadMethod: 'url',
    nutrition: { calories: '', protein: '', carbs: '', fat: '' }
};

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
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
            showToast('Failed to fetch inventory', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const filteredProducts = useMemo(() => {
        let base = activeTab === 'All' ? products : products.filter(p => p.category === activeTab);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            base = base.filter(p => p.title.toLowerCase().includes(q));
        }
        return base;
    }, [products, activeTab, searchQuery]);

    const metrics = useMemo(() => ({
        total: products.length,
        featured: products.filter(p => p.featured).length,
        categories: CATEGORIES.filter(c => c !== 'All').reduce((acc, cat) => {
            acc[cat] = products.filter(p => p.category === cat).length;
            return acc;
        }, {})
    }), [products]);

    const handleAddNew = () => {
        setFormData(INITIAL_FORM);
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        let imageUrl = '';
        if (Array.isArray(product.images) && product.images.length > 0) imageUrl = product.images[0];
        else if (typeof product.images === 'string') imageUrl = product.images;

        setFormData({
            id: product.id,
            title: String(product.title || ''),
            category: String(product.category || 'Fresh Fruit'),
            price: typeof product.price_cents === 'number' ? (product.price_cents / 100).toString() : '',
            unit: String(product.unit || 'kg'),
            stock: product.stock != null ? String(product.stock) : '',
            image_url: String(imageUrl),
            description: String(product.description || ''),
            featured: Boolean(product.featured),
            discount: product.discount != null ? String(product.discount) : '',
            perfect_for: String(product.perfect_for || ''),
            video_url: String(product.video_url || ''),
            uploadMethod: 'url',
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
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const data = await res.json();

            if (data.success) {
                showToast('Product deleted successfully', 'success');
                setProducts(prev => prev.filter(p => p.id !== id));
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            showToast(err.message || 'Delete failed', 'error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const price_cents = Math.round(parseFloat(formData.price) * 100);

            const payload = {
                title: formData.title,
                category: formData.category,
                price_cents,
                unit: formData.unit,
                stock: formData.stock !== '' ? parseInt(formData.stock, 10) : 0,
                images: [formData.image_url],
                description: formData.description || '',
                featured: formData.featured,
                discount: formData.discount !== '' ? parseInt(formData.discount, 10) : 0,
                perfect_for: formData.perfect_for || '',
                video_url: formData.video_url || '',
                nutrition: {
                    calories: parseFloat(formData.nutrition?.calories) || 0,
                    protein: parseFloat(formData.nutrition?.protein) || 0,
                    carbs: parseFloat(formData.nutrition?.carbs) || 0,
                    fat: parseFloat(formData.nutrition?.fat) || 0
                }
            };

            const url = formData.id
                ? `${API_BASE_URL}/api/admin/products/${formData.id}`
                : `${API_BASE_URL}/api/admin/products`;

            const res = await fetch(url, {
                method: formData.id ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data.success) {
                const msg = typeof data.error === 'object'
                    ? (data.error.message || JSON.stringify(data.error))
                    : (data.error || 'Operation failed');
                throw new Error(msg);
            }

            setProducts(prev =>
                formData.id
                    ? prev.map(p => p.id === data.product.id ? data.product : p)
                    : [data.product, ...prev]
            );
            showToast(`Product ${formData.id ? 'updated' : 'created'} successfully!`, 'success');
            setIsModalOpen(false);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            showToast('Invalid file type. Please upload JPG, PNG, or WebP images only.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('File too large. Maximum size is 5MB.', 'error');
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            setFormData(prev => ({ ...prev, uploadProgress: 10 }));

            const res = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}` },
                body: formDataUpload
            });

            setFormData(prev => ({ ...prev, uploadProgress: 90 }));
            const result = await res.json();

            if (!result.success) throw new Error(result.error || 'Upload failed');

            setFormData(prev => ({ ...prev, image_url: result.url, uploadProgress: null }));
            showToast('Image uploaded successfully!', 'success');
        } catch (err) {
            logger.error('Upload error:', err);
            showToast(err.message || 'Failed to upload image', 'error');
            setFormData(prev => ({ ...prev, uploadProgress: null }));
        }
    };

    const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
    const setNutrition = (key, value) => setFormData(prev => ({
        ...prev, nutrition: { ...prev.nutrition, [key]: value }
    }));

    if (loading) return <div className="loading-state">Loading inventory...</div>;

    return (
        <div className="inventory-page">
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

            <div className="toolbar">
                <div className="category-tabs">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`category-tab ${activeTab === cat ? 'active' : ''}`}
                            onClick={() => setActiveTab(cat)}
                        >
                            <span className="tab-label">{cat}</span>
                            <span className="tab-count">
                                {cat === 'All' ? metrics.total : (metrics.categories[cat] || 0)}
                            </span>
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    className="product-search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="products-grid">
                {filteredProducts.map(product => (
                    <div key={product.id} className={`product-card ${product.featured ? 'featured' : ''}`}>
                        <div className="product-image">
                            <img src={product.images?.[0] || '/placeholder.png'} alt={product.title} />
                            {product.featured && <div className="featured-indicator">Featured</div>}
                            {product.discount > 0 && (
                                <div className="discount-indicator">{product.discount}% OFF</div>
                            )}
                            <div className="product-category">{product.category}</div>
                        </div>

                        <div className="product-details">
                            <h3 className="product-name">{product.title}</h3>
                            <div className="product-meta">
                                <span className="product-unit">{product.unit}</span>
                                {product.stock != null && (
                                    <span className={`stock-badge ${product.stock === 0 ? 'out' : product.stock <= 5 ? 'low' : 'ok'}`}>
                                        {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                                    </span>
                                )}
                            </div>
                            <div className="product-price-row">
                                <div className="product-price">
                                    <span className="currency">₹</span>
                                    <span className="amount">{(product.price_cents / 100).toFixed(2)}</span>
                                </div>
                                {product.discount > 0 && (
                                    <span className="original-price">
                                        ₹{Math.round((product.price_cents / 100) / (1 - product.discount / 100))}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="product-actions">
                            <button className="action-edit" onClick={() => handleEdit(product)}>Edit</button>
                            <button className="action-delete" onClick={() => handleDelete(product.id)}>Delete</button>
                        </div>
                    </div>
                ))}

                {filteredProducts.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-title">No products found</div>
                        <div className="empty-subtitle">
                            {searchQuery
                                ? `No results for "${searchQuery}"`
                                : activeTab === 'All'
                                    ? 'Add your first product to get started'
                                    : `No products in ${activeTab} category`}
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={e => e.target.className === 'modal-overlay' && setIsModalOpen(false)}>
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
                                        onChange={e => setField('title', e.target.value)}
                                        placeholder="e.g. Fresh Alphonso Mango"
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Category</label>
                                    <select value={formData.category} onChange={e => setField('category', e.target.value)}>
                                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Unit</label>
                                    <select value={formData.unit} onChange={e => setField('unit', e.target.value)}>
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
                                        onChange={e => setField('price', e.target.value)}
                                        placeholder="150.00"
                                        required
                                        min="0"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Discount (%)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={formData.discount}
                                        onChange={e => setField('discount', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Stock Quantity</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={formData.stock}
                                        onChange={e => setField('stock', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>

                                <div className="form-field full">
                                    <label>Product Image</label>
                                    <div className="upload-tabs">
                                        <button
                                            type="button"
                                            className={`upload-tab ${formData.uploadMethod !== 'upload' ? 'active' : ''}`}
                                            onClick={() => setField('uploadMethod', 'url')}
                                        >
                                            Image URL
                                        </button>
                                        <button
                                            type="button"
                                            className={`upload-tab ${formData.uploadMethod === 'upload' ? 'active' : ''}`}
                                            onClick={() => setField('uploadMethod', 'upload')}
                                        >
                                            Upload File
                                        </button>
                                    </div>

                                    {formData.uploadMethod !== 'upload' && (
                                        <input
                                            type="url"
                                            value={formData.image_url}
                                            onChange={e => setField('image_url', e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            required={!formData.id}
                                        />
                                    )}

                                    {formData.uploadMethod === 'upload' && (
                                        <div
                                            className={`file-upload-zone ${formData.uploadDragging ? 'dragging' : ''}`}
                                            onDragEnter={e => { e.preventDefault(); setField('uploadDragging', true); }}
                                            onDragLeave={e => { e.preventDefault(); setField('uploadDragging', false); }}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={async e => {
                                                e.preventDefault();
                                                setField('uploadDragging', false);
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
                                                        <p className="upload-title">Drag & drop or click to browse</p>
                                                        <p className="upload-subtitle">PNG, JPG, WebP · Max 5MB</p>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    )}

                                    {formData.image_url && (
                                        <div className="image-preview-wrap">
                                            <img src={formData.image_url} alt="Preview" onError={e => { e.target.src = '/placeholder.png'; }} />
                                            <button
                                                type="button"
                                                className="remove-image"
                                                onClick={() => setField('image_url', '')}
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
                                        onChange={e => setField('description', e.target.value)}
                                        placeholder="Product description..."
                                        rows="3"
                                    />
                                </div>

                                <div className="form-field full">
                                    <label>Perfect For (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.perfect_for}
                                        onChange={e => setField('perfect_for', e.target.value)}
                                        placeholder="e.g. Weight loss, Energy boost, Post-workout"
                                    />
                                </div>

                                <div className="form-field full">
                                    <label>Video URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={formData.video_url}
                                        onChange={e => setField('video_url', e.target.value)}
                                        placeholder="https://youtube.com/..."
                                    />
                                </div>

                                <div className="form-field full">
                                    <label className="section-sub-label">Nutritional Info (per 100g/ml)</label>
                                    <div className="nutrition-grid">
                                        {[
                                            { key: 'calories', label: 'Calories (kcal)', placeholder: '85' },
                                            { key: 'protein', label: 'Protein (g)', placeholder: '1.5' },
                                            { key: 'carbs', label: 'Carbs (g)', placeholder: '20' },
                                            { key: 'fat', label: 'Fat (g)', placeholder: '0.5' }
                                        ].map(({ key, label, placeholder }) => (
                                            <div key={key} className="nutrition-field">
                                                <label>{label}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.nutrition?.[key] || ''}
                                                    onChange={e => setNutrition(key, e.target.value)}
                                                    placeholder={placeholder}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-field full">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.featured}
                                            onChange={e => setField('featured', e.target.checked)}
                                        />
                                        <span>Mark as Featured Product</span>
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
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

                .page-subtitle { color: #64748b; font-size: 0.95rem; margin: 0; }

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
                    box-shadow: 0 4px 12px rgba(15,23,42,0.2);
                }

                .btn-icon { font-size: 1.25rem; font-weight: 700; }

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
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }

                .metric-card.featured {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border: none;
                }

                .metric-card.featured .metric-label,
                .metric-card.featured .metric-value { color: white; }

                .metric-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-bottom: 8px;
                }

                .metric-value { font-size: 2rem; font-weight: 700; color: #0f172a; }

                .toolbar {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 24px;
                    border-bottom: 2px solid #e2e8f0;
                }

                .category-tabs {
                    display: flex;
                    gap: 8px;
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

                .category-tab:hover { color: #0f172a; }
                .category-tab.active { color: #0f172a; border-bottom-color: #0f172a; }

                .tab-count {
                    background: #f1f5f9;
                    color: #475569;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .category-tab.active .tab-count { background: #0f172a; color: white; }

                .product-search {
                    padding: 9px 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    outline: none;
                    transition: all 0.2s;
                    min-width: 220px;
                    margin-bottom: 4px;
                }

                .product-search:focus {
                    border-color: #0f172a;
                    box-shadow: 0 0 0 3px rgba(15,23,42,0.1);
                }

                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
                    gap: 24px;
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
                    box-shadow: 0 8px 16px -4px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }

                .product-card.featured { border-left: 4px solid #0f172a; }

                .product-image {
                    position: relative;
                    height: 200px;
                    background: #f8fafc;
                    overflow: hidden;
                }

                .product-image img { width: 100%; height: 100%; object-fit: cover; }

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

                .discount-indicator {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: #dc2626;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                }

                .product-category {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    background: rgba(255,255,255,0.95);
                    backdrop-filter: blur(8px);
                    color: #334155;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                .product-details { padding: 16px; flex: 1; }

                .product-name {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #0f172a;
                    margin: 0 0 8px;
                    line-height: 1.4;
                }

                .product-meta { margin-bottom: 12px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
                .product-unit { font-size: 0.8rem; color: #64748b; text-transform: capitalize; }

                .stock-badge {
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 4px;
                }
                .stock-badge.ok { background: #dcfce7; color: #166534; }
                .stock-badge.low { background: #fef3c7; color: #92400e; }
                .stock-badge.out { background: #fee2e2; color: #991b1b; }

                .product-price-row {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                }

                .product-price { display: flex; align-items: baseline; gap: 2px; }
                .currency { font-size: 0.9rem; font-weight: 600; color: #64748b; }
                .amount { font-size: 1.5rem; font-weight: 700; color: #0f172a; }

                .original-price {
                    font-size: 0.875rem;
                    color: #94a3b8;
                    text-decoration: line-through;
                }

                .product-actions {
                    padding: 12px 16px;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    gap: 8px;
                }

                .action-edit, .action-delete {
                    flex: 1;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .action-edit { background: #f8fafc; color: #334155; }
                .action-edit:hover { background: #e2e8f0; }
                .action-delete { background: #fef2f2; color: #dc2626; }
                .action-delete:hover { background: #fee2e2; }

                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 80px 20px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                }

                .empty-title { font-size: 1.25rem; font-weight: 600; color: #334155; margin-bottom: 8px; }
                .empty-subtitle { font-size: 0.95rem; color: #94a3b8; }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
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
                    max-width: 620px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                }

                .modal-header {
                    padding: 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    background: white;
                    z-index: 1;
                }

                .modal-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }

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

                .modal-close:hover { background: #f1f5f9; color: #334155; }

                .modal-form { padding: 24px; }

                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }

                .form-field { display: flex; flex-direction: column; gap: 8px; }
                .form-field.full { grid-column: 1 / -1; }

                .form-field label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #475569;
                }

                .section-sub-label {
                    font-size: 0.95rem !important;
                    font-weight: 700 !important;
                    color: #0f172a !important;
                    display: block;
                    margin-bottom: 12px;
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
                    box-shadow: 0 0 0 3px rgba(15,23,42,0.1);
                }

                .nutrition-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                }

                .nutrition-field { display: flex; flex-direction: column; gap: 6px; }
                .nutrition-field label { font-size: 0.8rem; color: #64748b; font-weight: 500; }

                .nutrition-field input {
                    padding: 8px 12px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-family: inherit;
                    transition: all 0.2s;
                }

                .nutrition-field input:focus {
                    outline: none;
                    border-color: #0f172a;
                    box-shadow: 0 0 0 3px rgba(15,23,42,0.1);
                }

                .image-preview-wrap {
                    position: relative;
                    display: inline-block;
                    margin-top: 12px;
                    width: 120px;
                    height: 120px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }

                .image-preview-wrap img { width: 100%; height: 100%; object-fit: cover; }

                .remove-image {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    background: rgba(220,38,38,0.9);
                    color: white;
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .remove-image:hover { background: #dc2626; transform: scale(1.1); }

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

                .upload-tab:hover { color: #334155; }
                .upload-tab.active { background: white; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

                .file-upload-zone {
                    border: 2px dashed #cbd5e1;
                    border-radius: 12px;
                    background: #f8fafc;
                    transition: all 0.3s;
                    cursor: pointer;
                }

                .file-upload-zone:hover { border-color: #94a3b8; background: #f1f5f9; }
                .file-upload-zone.dragging { border-color: #0f172a; background: #e2e8f0; transform: scale(1.02); }

                .upload-label {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 36px 24px;
                    cursor: pointer;
                    text-align: center;
                }

                .upload-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.6; }
                .upload-title { font-size: 0.95rem; font-weight: 600; color: #334155; margin: 0 0 6px; }
                .upload-subtitle { font-size: 0.8rem; color: #94a3b8; margin: 0; }

                .upload-spinner {
                    width: 36px;
                    height: 36px;
                    border: 4px solid #e2e8f0;
                    border-top-color: #0f172a;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 12px;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    font-size: 0.95rem;
                    color: #334155;
                    font-weight: 500;
                }

                .checkbox-label input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }

                .modal-footer {
                    padding: 20px 24px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .btn-cancel, .btn-save {
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .btn-cancel { background: #f1f5f9; color: #475569; }
                .btn-cancel:hover { background: #e2e8f0; }
                .btn-save { background: #0f172a; color: white; }

                .btn-save:hover:not(:disabled) {
                    background: #1e293b;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(15,23,42,0.2);
                }

                .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

                .loading-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    color: #64748b;
                    font-size: 1.1rem;
                }

                @media (max-width: 768px) {
                    .inventory-header { flex-direction: column; align-items: stretch; gap: 16px; }
                    .btn-add-product { width: 100%; justify-content: center; }
                    .metrics-row { grid-template-columns: repeat(2, 1fr); }
                    .toolbar { flex-direction: column; align-items: stretch; border-bottom: none; }
                    .category-tabs { border-bottom: 2px solid #e2e8f0; }
                    .product-search { width: 100%; }
                    .products-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
                    .form-grid { grid-template-columns: 1fr; }
                    .nutrition-grid { grid-template-columns: 1fr; }
                    .modal-footer { flex-direction: column-reverse; }
                    .btn-cancel, .btn-save { width: 100%; }
                }
            `}</style>
        </div>
    );
}
