import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { showToast } from '../../utils/toast';

const INITIAL_FORM = {
    code: '',
    value: '',
    type: 'percentage',
    min_order: '',
    description: '',
    expires_at: ''
};

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (err) {
            showToast('Error fetching coupons: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    const metrics = useMemo(() => {
        const total = coupons.length;
        const active = coupons.filter(c => c.is_active).length;
        const expired = coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length;
        const percentage = coupons.filter(c => c.discount_type === 'percentage').length;
        const fixed = coupons.filter(c => c.discount_type === 'fixed').length;
        return { total, active, expired, percentage, fixed };
    }, [coupons]);

    const filteredCoupons = useMemo(() => {
        if (!searchQuery) return coupons;
        const q = searchQuery.toLowerCase();
        return coupons.filter(c =>
            c.code?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        );
    }, [coupons, searchQuery]);

    const handleAddNew = () => {
        setForm(INITIAL_FORM);
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (coupon) => {
        setForm({
            code: coupon.code || '',
            value: coupon.value?.toString() || '',
            type: coupon.discount_type || 'percentage',
            min_order: coupon.min_order_value?.toString() || '',
            description: coupon.description || '',
            expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : ''
        });
        setEditingId(coupon.id);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                code: form.code.toUpperCase().trim(),
                discount_type: form.type,
                value: parseFloat(form.value),
                min_order_value: parseFloat(form.min_order) || 0,
                description: form.description.trim() || null,
                expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null
            };

            const { data: saved, error } = editingId
                ? await supabase.from('coupons').update(payload).eq('id', editingId).select().single()
                : await supabase.from('coupons').insert([{ ...payload, is_active: true }]).select().single();

            if (error) throw error;

            setCoupons(prev =>
                editingId
                    ? prev.map(c => c.id === editingId ? saved : c)
                    : [saved, ...prev]
            );

            showToast(`Coupon ${editingId ? 'updated' : 'created'} successfully!`, 'success');
            setIsModalOpen(false);
            setForm(INITIAL_FORM);
            setEditingId(null);
        } catch (err) {
            showToast(err.message || 'Operation failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this coupon?')) return;

        try {
            const { error } = await supabase.from('coupons').delete().eq('id', id);
            if (error) throw error;
            setCoupons(prev => prev.filter(c => c.id !== id));
            showToast('Coupon deleted successfully', 'success');
        } catch (err) {
            showToast('Error deleting coupon: ' + err.message, 'error');
        }
    };

    const toggleActive = async (coupon) => {
        const { error } = await supabase
            .from('coupons')
            .update({ is_active: !coupon.is_active })
            .eq('id', coupon.id);

        if (error) {
            showToast('Failed to update coupon status', 'error');
        } else {
            setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
        }
    };

    const isExpired = (coupon) => coupon.expires_at && new Date(coupon.expires_at) < new Date();

    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    if (loading) return <div className="loading-state">Loading coupons...</div>;

    return (
        <div className="coupons-page">
            <div className="coupons-header">
                <div>
                    <h1 className="page-title">Coupon Management</h1>
                    <p className="page-subtitle">Create and manage discount coupons</p>
                </div>
                <button className="btn-add-coupon" onClick={handleAddNew}>
                    <span className="btn-icon">+</span>
                    Create Coupon
                </button>
            </div>

            <div className="metrics-row">
                <div className="metric-card">
                    <div className="metric-label">Total Coupons</div>
                    <div className="metric-value">{metrics.total}</div>
                </div>
                <div className="metric-card active-card">
                    <div className="metric-label">Active</div>
                    <div className="metric-value">{metrics.active}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Expired</div>
                    <div className="metric-value expired-val">{metrics.expired}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">% Discounts</div>
                    <div className="metric-value">{metrics.percentage}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Fixed Discounts</div>
                    <div className="metric-value">{metrics.fixed}</div>
                </div>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by code or description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <span className="result-count">{filteredCoupons.length} coupon{filteredCoupons.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="coupons-grid">
                {filteredCoupons.map(coupon => {
                    const expired = isExpired(coupon);
                    return (
                        <div key={coupon.id} className={`coupon-card ${coupon.is_active && !expired ? 'active' : 'inactive'}`}>
                            <div className="coupon-header">
                                <div className="coupon-code">{coupon.code}</div>
                                <div className="coupon-status-badges">
                                    {expired ? (
                                        <span className="badge expired">Expired</span>
                                    ) : coupon.is_active ? (
                                        <span className="badge active">Active</span>
                                    ) : (
                                        <span className="badge inactive">Inactive</span>
                                    )}
                                </div>
                            </div>

                            {coupon.description && (
                                <p className="coupon-description">{coupon.description}</p>
                            )}

                            <div className="coupon-details">
                                <div className="discount-value">
                                    {coupon.discount_type === 'percentage'
                                        ? `${coupon.value}% OFF`
                                        : `₹${coupon.value} OFF`}
                                </div>
                                <div className="discount-meta">
                                    {coupon.discount_type === 'percentage' ? 'Percentage Discount' : 'Fixed Amount'}
                                </div>
                                <div className="coupon-info-row">
                                    <span className="info-chip">Min ₹{coupon.min_order_value || 0}</span>
                                </div>
                                {coupon.expires_at && (
                                    <div className={`expiry-row ${expired ? 'expired-text' : ''}`}>
                                        Expires: {new Date(coupon.expires_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="coupon-actions">
                                <button
                                    className={`action-toggle ${coupon.is_active ? 'deactivate' : 'activate'}`}
                                    onClick={() => toggleActive(coupon)}
                                    disabled={expired}
                                    title={expired ? 'Coupon is expired' : coupon.is_active ? 'Deactivate' : 'Activate'}
                                >
                                    {coupon.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button className="action-edit" onClick={() => handleEdit(coupon)}>Edit</button>
                                <button className="action-delete" onClick={() => handleDelete(coupon.id)}>Delete</button>
                            </div>
                        </div>
                    );
                })}

                {filteredCoupons.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-title">No coupons found</div>
                        <div className="empty-subtitle">
                            {searchQuery ? `No results for "${searchQuery}"` : 'Create your first coupon to get started'}
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={e => e.target.className === 'modal-overlay' && setIsModalOpen(false)}>
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-grid">
                                <div className="form-field full">
                                    <label>Coupon Code</label>
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={e => setField('code', e.target.value)}
                                        placeholder="e.g. SAVE20"
                                        required
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                </div>

                                <div className="form-field full">
                                    <label>Description (Optional)</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={e => setField('description', e.target.value)}
                                        placeholder="e.g. 20% off on orders above ₹200"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Discount Type</label>
                                    <select value={form.type} onChange={e => setField('type', e.target.value)}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Discount Value</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.value}
                                        onChange={e => setField('value', e.target.value)}
                                        placeholder={form.type === 'percentage' ? '20' : '100'}
                                        required
                                        min="0"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Min Order Value (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.min_order}
                                        onChange={e => setField('min_order', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={form.expires_at}
                                        onChange={e => setField('expires_at', e.target.value)}
                                        min={new Date().toISOString().slice(0, 10)}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-save" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingId ? 'Update Coupon' : 'Create Coupon')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .coupons-page {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    padding-bottom: 60px;
                }

                .coupons-header {
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

                .btn-add-coupon {
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

                .btn-add-coupon:hover {
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

                .metric-card.active-card {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border: none;
                }

                .metric-card.active-card .metric-label,
                .metric-card.active-card .metric-value { color: white; }

                .metric-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-bottom: 8px;
                }

                .metric-value { font-size: 2rem; font-weight: 700; color: #0f172a; }
                .expired-val { color: #dc2626; }

                .search-bar {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                    align-items: center;
                }

                .search-input {
                    flex: 1;
                    padding: 10px 16px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #0f172a;
                    box-shadow: 0 0 0 3px rgba(15,23,42,0.1);
                }

                .result-count { font-size: 0.9rem; color: #64748b; white-space: nowrap; }

                .coupons-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                }

                .coupon-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 24px;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                }

                .coupon-card:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 8px 16px -4px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }

                .coupon-card.active { border-left: 4px solid #16a34a; }
                .coupon-card.inactive { opacity: 0.65; }

                .coupon-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                    gap: 8px;
                }

                .coupon-code {
                    background: #dbeafe;
                    color: #1e40af;
                    padding: 8px 14px;
                    border-radius: 6px;
                    font-weight: 700;
                    font-family: 'Monaco', 'Courier New', monospace;
                    font-size: 0.95rem;
                    letter-spacing: 0.5px;
                    border: 1px dashed #93c5fd;
                }

                .coupon-status-badges { display: flex; gap: 6px; align-items: center; }

                .badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                }

                .badge.active { background: #dcfce7; color: #166534; }
                .badge.inactive { background: #f1f5f9; color: #64748b; }
                .badge.expired { background: #fee2e2; color: #991b1b; }

                .coupon-description {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin: 0 0 14px;
                    line-height: 1.4;
                }

                .coupon-details { flex: 1; margin-bottom: 16px; }

                .discount-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 4px;
                }

                .discount-meta { font-size: 0.8rem; color: #64748b; margin-bottom: 12px; }

                .coupon-info-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 10px;
                }

                .info-chip {
                    padding: 4px 10px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    color: #475569;
                    font-weight: 500;
                }

                .expiry-row {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .expiry-row.expired-text { color: #dc2626; font-weight: 600; }

                .coupon-actions {
                    display: flex;
                    gap: 6px;
                    margin-top: auto;
                    padding-top: 16px;
                    border-top: 1px solid #f1f5f9;
                }

                .action-toggle, .action-edit, .action-delete {
                    flex: 1;
                    padding: 7px 10px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .action-toggle.activate { background: #dcfce7; color: #166534; }
                .action-toggle.activate:hover { background: #bbf7d0; }
                .action-toggle.deactivate { background: #fef3c7; color: #92400e; }
                .action-toggle.deactivate:hover { background: #fde68a; }
                .action-toggle:disabled { opacity: 0.4; cursor: not-allowed; }

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
                    max-width: 500px;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                    max-height: 90vh;
                    overflow-y: auto;
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
                    margin-bottom: 0;
                }

                .form-field { display: flex; flex-direction: column; gap: 8px; }
                .form-field.full { grid-column: 1 / -1; }

                .form-field label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #475569;
                }

                .form-field input,
                .form-field select {
                    padding: 10px 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-family: inherit;
                    transition: all 0.2s;
                }

                .form-field input:focus,
                .form-field select:focus {
                    outline: none;
                    border-color: #0f172a;
                    box-shadow: 0 0 0 3px rgba(15,23,42,0.1);
                }

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

                @media (max-width: 900px) {
                    .coupons-grid { grid-template-columns: repeat(2, 1fr); }
                }

                @media (max-width: 768px) {
                    .coupons-header { flex-direction: column; align-items: stretch; gap: 16px; }
                    .btn-add-coupon { width: 100%; justify-content: center; }
                    .metrics-row { grid-template-columns: repeat(2, 1fr); }
                    .coupons-grid { grid-template-columns: 1fr !important; }
                    .form-grid { grid-template-columns: 1fr; }
                    .modal-footer { flex-direction: column-reverse; }
                    .btn-cancel, .btn-save { width: 100%; }
                }
            `}</style>
        </div>
    );
}
