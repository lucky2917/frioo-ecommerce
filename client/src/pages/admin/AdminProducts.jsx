import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { notify } from '../../lib/feedbackStore';
import { logger } from '../../utils/logger';
import { API_BASE_URL, PRODUCT_CATEGORIES } from '../../config/constants';
import { AdminPage, MetricCard, AdminModal, ConfirmDialog, SearchInput, AdminErrorState } from '../../components/admin/ui';

const DB_CATEGORIES = PRODUCT_CATEGORIES.filter(c => c.dbValue !== null).map(c => c.dbValue);
const CATEGORIES = ['All', ...DB_CATEGORIES];

const INITIAL_FORM = {
    id: null,
    title: '',
    category: DB_CATEGORIES[3],
    price: '',
    unit: 'kg',
    stock: 'available',
    image_url: '',
    description: '',
    featured: false,
    discount: '',
    perfect_for: '',
    video_url: '',
    uploadMethod: 'url',
    nutrition: { calories: '', protein: '', carbs: '', fat: '' }
};

const NUTRITION_FIELDS = [
    { key: 'calories', label: 'Calories (kcal)', placeholder: '85' },
    { key: 'protein', label: 'Protein (g)', placeholder: '1.5' },
    { key: 'carbs', label: 'Carbs (g)', placeholder: '20' },
    { key: 'fat', label: 'Fat (g)', placeholder: '0.5' }
];

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const uploadInFlightRef = useRef(false);

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
            setLoadError('We could not load inventory. Check your connection and try again.');
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
            stock: product.stock === 0 ? 'unavailable' : 'available',
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

    const confirmDelete = async () => {
        if (deleting || !deleteId) return;
        setDeleting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const res = await fetch(`${API_BASE_URL}/api/admin/products/${deleteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const data = await res.json();

            if (data.success) {
                notify.success('Product deleted');
                setProducts(prev => prev.filter(p => p.id !== deleteId));
                setDeleteId(null);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            notify.error(err.message || 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (submitting || uploadInFlightRef.current) return;

        const parsedPrice = parseFloat(formData.price);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            notify.error('Enter a valid price before saving.');
            return;
        }

        setSubmitting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active session');

            const price_cents = Math.round(parsedPrice * 100);

            const payload = {
                title: formData.title,
                category: formData.category,
                price_cents,
                unit: formData.unit,
                stock: formData.stock === 'unavailable' ? 0 : null,
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

            const savedProduct = data.data.product;
            setProducts(prev =>
                formData.id
                    ? prev.map(p => p.id === savedProduct.id ? savedProduct : p)
                    : [savedProduct, ...prev]
            );
            notify.success(`Product ${formData.id ? 'updated' : 'created'}`);
            setIsModalOpen(false);
        } catch (err) {
            notify.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file || uploadInFlightRef.current) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setUploadError('That file type will not upload. Use a JPG, PNG or WebP image.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError('That image is over 5MB. Use a smaller file.');
            return;
        }

        uploadInFlightRef.current = true;

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
            setUploadError(null); notify.success('Image uploaded');
        } catch (err) {
            logger.error('Upload error:', err);
            setUploadError(err.message || 'The image did not upload. Try again.');
            setFormData(prev => ({ ...prev, uploadProgress: null }));
        } finally {
            uploadInFlightRef.current = false;
        }
    };

    const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
    const setNutrition = (key, value) => setFormData(prev => ({
        ...prev, nutrition: { ...prev.nutrition, [key]: value }
    }));

    const metricCards = (
        <>
            <MetricCard label="Total products" value={metrics.total} />
            <MetricCard tone="brand" label="Featured" value={metrics.featured} />
            {Object.entries(metrics.categories).map(([cat, count]) => (
                <MetricCard key={cat} label={cat} value={count} />
            ))}
        </>
    );

    const addButton = (
        <button className="adm-btn adm-btn-primary" onClick={handleAddNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add product
        </button>
    );

    if (loadError) {
        return (
            <AdminPage title="Products">
                <AdminErrorState message={loadError} onRetry={() => { setLoadError(null); setLoading(true); fetchProducts(); }} />
            </AdminPage>
        );
    }

    return (
        <AdminPage
            title="Inventory"
            subtitle="Manage products, pricing, and categories"
            actions={addButton}
            metrics={loading ? undefined : metricCards}
        >
            <div className="ap-toolbar">
                <div className="ap-tabs">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`ap-tab ${activeTab === cat ? 'active' : ''}`}
                            onClick={() => setActiveTab(cat)}
                        >
                            {cat}
                            <span className="ap-tab-count">{cat === 'All' ? metrics.total : (metrics.categories[cat] || 0)}</span>
                        </button>
                    ))}
                </div>
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search products" ariaLabel="Search products" />
            </div>

            {loading ? (
                <div className="ap-grid">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="ap-card">
                            <div className="ap-img adm-skel-line" style={{ height: 150, borderRadius: 0 }} />
                            <div className="ap-body">
                                <div className="adm-skel-line" style={{ width: '80%', marginBottom: 10 }} />
                                <div className="adm-skel-line" style={{ width: '50%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="adm-card adm-state">
                    <h2 className="adm-state-title">No products found</h2>
                    <p className="adm-state-text">
                        {searchQuery ? `No results for "${searchQuery}"` : activeTab === 'All' ? 'Add your first product to get started.' : `No products in ${activeTab}.`}
                    </p>
                </div>
            ) : (
                <div className="ap-grid">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="ap-card">
                            <div className="ap-img">
                                <img loading="lazy" decoding="async" src={product.images?.[0] || '/placeholder.png'} alt={product.title} onError={e => { e.target.src = '/placeholder.png'; }} />
                                {product.featured && <span className="ap-tag ap-tag-featured">Featured</span>}
                                {product.discount > 0 && <span className="ap-tag ap-tag-discount">{product.discount}% off</span>}
                            </div>
                            <div className="ap-body">
                                <div className="ap-cat">{product.category}</div>
                                <h3 className="ap-name">{product.title}</h3>
                                <div className="ap-meta">
                                    <span className="ap-unit">{product.unit}</span>
                                    <span className={`ap-stock ${product.stock === 0 ? 'ap-stock--out' : 'ap-stock--ok'}`}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            {product.stock === 0
                                                ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                                                : <path d="M20 6 9 17l-5-5" />}
                                        </svg>
                                        {product.stock === 0 ? 'Not available' : 'Available'}
                                    </span>
                                </div>
                                <div className="ap-price-row">
                                    <span className="ap-price">₹{(product.price_cents / 100).toFixed(2)}</span>
                                    {product.discount > 0 && (
                                        <span className="ap-price-orig">₹{Math.round((product.price_cents / 100) / (1 - product.discount / 100))}</span>
                                    )}
                                </div>
                            </div>
                            <div className="ap-actions">
                                <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => handleEdit(product)}>Edit</button>
                                <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setDeleteId(product.id)} aria-label={`Delete ${product.title}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AdminModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={formData.id ? 'Edit product' : 'New product'}
                size="lg"
            >
                <form onSubmit={handleSave} className="ap-form">
                    <div className="ap-form-grid">
                        <div className="adm-field ap-full">
                            <label className="adm-label" htmlFor="ap-title">Product name</label>
                            <input id="ap-title" className="adm-input" type="text" value={formData.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Fresh Alphonso Mango" required />
                        </div>

                        <div className="adm-field">
                            <label className="adm-label" htmlFor="ap-category">Category</label>
                            <select id="ap-category" className="adm-select" value={formData.category} onChange={e => setField('category', e.target.value)}>
                                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="adm-field">
                            <label className="adm-label" htmlFor="ap-unit">Unit</label>
                            <select id="ap-unit" className="adm-select" value={formData.unit} onChange={e => setField('unit', e.target.value)}>
                                <option value="kg">Kilogram (kg)</option>
                                <option value="piece">Piece</option>
                                <option value="box">Box</option>
                                <option value="glass">Glass</option>
                                <option value="bowl">Bowl</option>
                            </select>
                        </div>

                        <div className="adm-field">
                            <label className="adm-label" htmlFor="ap-price">Price (₹)</label>
                            <input id="ap-price" className="adm-input" type="number" step="0.01" value={formData.price} onChange={e => setField('price', e.target.value)} placeholder="150.00" required min="0" />
                        </div>

                        <div className="adm-field">
                            <label className="adm-label" htmlFor="ap-discount">Discount (%)</label>
                            <input id="ap-discount" className="adm-input" type="number" step="1" value={formData.discount} onChange={e => setField('discount', e.target.value)} placeholder="0" min="0" max="100" />
                        </div>

                        <div className="adm-field ap-full">
                            <span className="adm-label">Availability</span>
                            <div className="ap-toggle" role="group" aria-label="Availability">
                                <button type="button" className={`ap-toggle-btn ${formData.stock === 'available' ? 'active' : ''}`} onClick={() => setField('stock', 'available')} aria-pressed={formData.stock === 'available'}>Available</button>
                                <button type="button" className={`ap-toggle-btn ${formData.stock === 'unavailable' ? 'active ap-toggle-off' : ''}`} onClick={() => setField('stock', 'unavailable')} aria-pressed={formData.stock === 'unavailable'}>Not available</button>
                            </div>
                        </div>

                        <div className="adm-field ap-full">
                            <span className="adm-label">Product image</span>
                            <div className="ap-upload-tabs">
                                <button type="button" className={`ap-upload-tab ${formData.uploadMethod !== 'upload' ? 'active' : ''}`} onClick={() => setField('uploadMethod', 'url')}>Image URL</button>
                                <button type="button" className={`ap-upload-tab ${formData.uploadMethod === 'upload' ? 'active' : ''}`} onClick={() => setField('uploadMethod', 'upload')}>Upload file</button>
                            </div>

                            {formData.uploadMethod !== 'upload' && (
                                <input className="adm-input" type="url" value={formData.image_url} onChange={e => setField('image_url', e.target.value)} placeholder="https://example.com/image.jpg" required={!formData.id} aria-label="Image URL" />
                            )}

                            {formData.uploadMethod === 'upload' && (
                                <div
                                    className={`ap-dropzone ${formData.uploadDragging ? 'dragging' : ''}`}
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
                                    <input type="file" id="image-upload" accept="image/jpeg,image/png,image/webp" onChange={e => handleFileUpload(e.target.files[0])} style={{ display: 'none' }} />
                                    <label htmlFor="image-upload" className="ap-upload-label">
                                        {formData.uploadProgress ? (
                                            <>
                                                <span className="adm-spin" style={{ borderTopColor: 'var(--fr-brand)', borderColor: 'var(--adm-border)' }} aria-hidden="true" />
                                                <p>Uploading {formData.uploadProgress}%</p>
                                            </>
                                        ) : (
                                            <>
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                <p className="ap-upload-title">Drag and drop or click to browse</p>
                                                <p className="ap-upload-sub">PNG, JPG, WebP · Max 5MB</p>
                                            </>
                                        )}
                                    {uploadError && <p className="ap-upload-error" role="alert">{uploadError}</p>}
                                    </label>
                                </div>
                            )}

                            {formData.image_url && (
                                <div className="ap-preview">
                                    <img loading="lazy" decoding="async" src={formData.image_url} alt="Product preview" onError={e => { e.target.src = '/placeholder.png'; }} />
                                    <button type="button" className="ap-preview-remove" onClick={() => setField('image_url', '')} aria-label="Remove image">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="adm-field ap-full">
                            <label className="adm-label" htmlFor="ap-desc">Description (optional)</label>
                            <textarea id="ap-desc" className="adm-textarea" value={formData.description} onChange={e => setField('description', e.target.value)} placeholder="Product description" rows="3" />
                        </div>

                        <div className="adm-field ap-full">
                            <label className="adm-label" htmlFor="ap-perfect">Perfect for (optional)</label>
                            <input id="ap-perfect" className="adm-input" type="text" value={formData.perfect_for} onChange={e => setField('perfect_for', e.target.value)} placeholder="e.g. Weight loss, Energy boost, Post-workout" />
                        </div>

                        <div className="adm-field ap-full">
                            <label className="adm-label" htmlFor="ap-video">Video URL (optional)</label>
                            <input id="ap-video" className="adm-input" type="url" value={formData.video_url} onChange={e => setField('video_url', e.target.value)} placeholder="https://youtube.com/..." />
                        </div>

                        <div className="adm-field ap-full">
                            <span className="adm-label">Nutrition (per 100g/ml)</span>
                            <div className="ap-nutrition">
                                {NUTRITION_FIELDS.map(({ key, label, placeholder }) => (
                                    <div key={key} className="adm-field">
                                        <label className="ap-nutrition-label" htmlFor={`nut-${key}`}>{label}</label>
                                        <input id={`nut-${key}`} className="adm-input" type="number" step="0.01" value={formData.nutrition?.[key] || ''} onChange={e => setNutrition(key, e.target.value)} placeholder={placeholder} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="adm-field ap-full">
                            <label className="ap-checkbox">
                                <input type="checkbox" checked={formData.featured} onChange={e => setField('featured', e.target.checked)} />
                                <span>Mark as featured product</span>
                            </label>
                        </div>
                    </div>

                    <div className="ap-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting} aria-busy={submitting}>
                            {submitting && <span className="adm-spin" aria-hidden="true" />}
                            {submitting ? 'Saving' : (formData.id ? 'Update product' : 'Create product')}
                        </button>
                    </div>
                </form>
            </AdminModal>

            <ConfirmDialog
                open={deleteId !== null}
                title="Delete product?"
                message="This product will be permanently removed from the catalogue. This cannot be undone."
                confirmLabel="Delete product"
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />

            <style>{`
                .ap-toolbar { display: flex; justify-content: space-between; gap: var(--fr-s4); flex-wrap: wrap; align-items: center; margin-bottom: var(--fr-s5); }
                .ap-tabs { display: flex; gap: var(--fr-s1); flex-wrap: wrap; }
                .ap-tab { background: var(--adm-surface); border: 1px solid var(--adm-border); padding: var(--fr-s2) var(--fr-s3); border-radius: var(--fr-r-pill); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); color: var(--adm-text-2); cursor: pointer; display: inline-flex; align-items: center; gap: var(--fr-s2); transition: background var(--fr-dur-quick) var(--fr-ease-standard), color var(--fr-dur-quick) var(--fr-ease-standard), border-color var(--fr-dur-quick) var(--fr-ease-standard); }
                .ap-tab:hover { border-color: var(--adm-border-strong); }
                .ap-tab.active { background: var(--fr-brand); border-color: var(--fr-brand); color: var(--fr-on-brand); }
                .ap-tab-count { font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); opacity: 0.85; }

                .ap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--fr-s4); }
                .ap-card { background: var(--adm-surface); border: 1px solid var(--adm-border); border-radius: var(--fr-r-card); overflow: hidden; display: flex; flex-direction: column; }
                .ap-img { position: relative; aspect-ratio: 4 / 3; background: var(--adm-surface-2); }
                .ap-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .ap-tag { position: absolute; top: var(--fr-s2); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); padding: 2px var(--fr-s2); border-radius: var(--fr-r-pill); }
                .ap-tag-featured { left: var(--fr-s2); background: var(--fr-brand); color: var(--fr-on-brand); }
                .ap-tag-discount { right: var(--fr-s2); background: var(--fr-warm); color: #fff; }
                .ap-body { padding: var(--fr-s3) var(--fr-s4); flex: 1; }
                .ap-cat { font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); text-transform: uppercase; letter-spacing: var(--fr-track-eyebrow); color: var(--adm-text-3); margin-bottom: var(--fr-s1); }
                .ap-name { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-normal); letter-spacing: var(--fr-track-headline); color: var(--adm-text); margin: 0 0 var(--fr-s2); }
                .ap-meta { display: flex; align-items: center; gap: var(--fr-s2); margin-bottom: var(--fr-s2); }
                .ap-unit { font-size: var(--fr-fs-label); color: var(--adm-text-2); }
                .ap-stock { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); padding: 1px var(--fr-s2); border-radius: var(--fr-r-pill); font-variant-numeric: tabular-nums; }
                .ap-stock--ok { background: var(--fr-brand-tint); color: var(--fr-success); }
                .ap-stock--out { background: var(--fr-warm-tint); color: var(--fr-danger); }
                .ap-price-row { display: flex; align-items: baseline; gap: var(--fr-s2); }
                .ap-price { font-size: var(--fr-fs-lead); font-weight: var(--fr-fw-bold); color: var(--adm-text); font-variant-numeric: tabular-nums; }
                .ap-price-orig { font-size: var(--fr-fs-caption); color: var(--adm-text-3); text-decoration: line-through; font-variant-numeric: tabular-nums; }
                .ap-actions { display: flex; gap: var(--fr-s2); padding: var(--fr-s3) var(--fr-s4); border-top: 1px solid var(--adm-border); align-items: center; }
                .ap-actions .adm-btn { flex: 1; }

                .ap-form { display: flex; flex-direction: column; }
                .ap-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fr-s4); }
                .ap-full { grid-column: 1 / -1; }

                .ap-toggle, .ap-upload-tabs { display: flex; gap: var(--fr-s2); }
                .ap-toggle-btn, .ap-upload-tab { flex: 1; padding: var(--fr-s2) var(--fr-s3); border: 1px solid var(--adm-border-strong); background: var(--adm-surface); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); color: var(--adm-text-2); cursor: pointer; transition: background var(--fr-dur-quick) var(--fr-ease-standard), border-color var(--fr-dur-quick) var(--fr-ease-standard); }
                .ap-toggle-btn.active { background: var(--fr-brand); border-color: var(--fr-brand); color: var(--fr-on-brand); }
                .ap-toggle-btn.ap-toggle-off { background: var(--fr-danger); border-color: var(--fr-danger); }
                .ap-upload-tab.active { border-color: var(--fr-brand); color: var(--fr-brand); }

                .ap-dropzone { margin-top: var(--fr-s2); border: 1.5px dashed var(--adm-border-strong); border-radius: var(--fr-r-card); background: var(--adm-surface-2); transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), background var(--fr-dur-quick) var(--fr-ease-standard); }
                .ap-dropzone.dragging { border-color: var(--fr-brand); background: var(--fr-brand-tint); }
                .ap-upload-label { display: flex; flex-direction: column; align-items: center; gap: var(--fr-s2); padding: var(--fr-s6); cursor: pointer; color: var(--adm-text-2); text-align: center; }
                .ap-upload-title { font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); color: var(--adm-text); margin: 0; }
                .ap-upload-error { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-danger); margin: var(--fr-s2) 0 0; }
                .ap-upload-sub { font-size: var(--fr-fs-label); color: var(--adm-text-3); margin: 0; }

                .ap-preview { position: relative; margin-top: var(--fr-s3); width: 120px; height: 120px; border-radius: var(--fr-r-card); overflow: hidden; border: 1px solid var(--adm-border); }
                .ap-preview img { width: 100%; height: 100%; object-fit: cover; }
                .ap-preview-remove { position: absolute; top: var(--fr-s1); right: var(--fr-s1); width: 24px; height: 24px; border: none; border-radius: 50%; background: rgba(22,33,27,0.7); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }

                .ap-nutrition { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--fr-s3); }
                .ap-nutrition-label { font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); color: var(--adm-text-2); }

                .ap-checkbox { display: flex; align-items: center; gap: var(--fr-s2); font-size: var(--fr-fs-caption); color: var(--adm-text); cursor: pointer; }
                .ap-checkbox input { width: 16px; height: 16px; accent-color: var(--fr-brand); }

                .ap-form-actions { display: flex; justify-content: flex-end; gap: var(--fr-s3); margin-top: var(--fr-s5); padding-top: var(--fr-s4); border-top: 1px solid var(--adm-border); }

                @media (prefers-reduced-motion: reduce) {
                    .ap-tab, .ap-toggle-btn, .ap-upload-tab, .ap-dropzone { transition: none; }
                }

                @media (max-width: 560px) {
                    .ap-form-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </AdminPage>
    );
}
