import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { showToast } from '../../utils/toast';

const INITIAL_FORM = {
    code: '',
    value: '',
    type: 'percentage',
    min_order: ''
};

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
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
            showToast("Error fetching coupons: " + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    // Calculate metrics
    const metrics = useMemo(() => {
        const total = coupons.length;
        const active = coupons.filter(c => c.is_active).length;
        const percentage = coupons.filter(c => c.discount_type === 'percentage').length;
        const fixed = coupons.filter(c => c.discount_type === 'fixed').length;

        return { total, active, percentage, fixed };
    }, [coupons]);

    // Filter coupons
    const filteredCoupons = useMemo(() => {
        if (!searchQuery) return coupons;

        const query = searchQuery.toLowerCase();
        return coupons.filter(c =>
            c.code?.toLowerCase().includes(query)
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
            min_order: coupon.min_order_value?.toString() || ''
        });
        setEditingId(coupon.id);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                code: form.code.toUpperCase(),
                discount_type: form.type,
                value: parseFloat(form.value),
                min_order_value: parseFloat(form.min_order) || 0,
                is_active: true
            };

            let result;
            if (editingId) {
                result = await supabase
                    .from('coupons')
                    .update(payload)
                    .eq('id', editingId);
            } else {
                result = await supabase
                    .from('coupons')
                    .insert([payload]);
            }

            const { error } = result;

            if (error) throw error;

            showToast(`Coupon ${editingId ? 'updated' : 'created'} successfully!`, 'success');
            setIsModalOpen(false);
            setForm(INITIAL_FORM);
            setEditingId(null);
            fetchCoupons();
        } catch (err) {
            showToast(err.message || 'Operation failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this coupon?")) return;

        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showToast("Coupon deleted successfully", 'success');
            fetchCoupons();
        } catch (err) {
            showToast("Error deleting coupon: " + err.message, 'error');
        }
    };

    if (loading) return <div className="loading-state">Loading coupons...</div>;

    return (
        <div className="coupons-page">
            {/* HEADER */}
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

            {/* METRICS */}
            <div className="metrics-row">
                <div className="metric-card">
                    <div className="metric-label">Total Coupons</div>
                    <div className="metric-value">{metrics.total}</div>
                </div>
                <div className="metric-card active">
                    <div className="metric-label">Active Coupons</div>
                    <div className="metric-value">{metrics.active}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Percentage Discounts</div>
                    <div className="metric-value">{metrics.percentage}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Fixed Discounts</div>
                    <div className="metric-value">{metrics.fixed}</div>
                </div>
            </div>

            {/* SEARCH */}
            <div className="search-bar">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by coupon code..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <span className="result-count">{filteredCoupons.length} coupons</span>
            </div>

            {/* COUPONS GRID */}
            <div className="coupons-grid">
                {filteredCoupons.map(coupon => (
                    <div key={coupon.id} className={`coupon-card ${coupon.is_active ? 'active' : 'inactive'}`}>
                        <div className="coupon-header">
                            <div className="coupon-code">{coupon.code}</div>
                            {coupon.is_active && <div className="active-indicator">Active</div>}
                        </div>

                        <div className="coupon-details">
                            <div className="discount-value">
                                {coupon.discount_type === 'percentage'
                                    ? `${coupon.value}% OFF`
                                    : `₹${coupon.value} OFF`}
                            </div>
                            <div className="discount-type">
                                {coupon.discount_type === 'percentage' ? 'Percentage Discount' : 'Fixed Amount'}
                            </div>
                            <div className="min-order">
                                Min Order: ₹{coupon.min_order_value || 0}
                            </div>
                        </div>

                        <div className="coupon-actions">
                            <button className="action-edit" onClick={() => handleEdit(coupon)}>
                                Edit
                            </button>
                            <button className="action-delete" onClick={() => handleDelete(coupon.id)}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}

                {filteredCoupons.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-title">No coupons found</div>
                        <div className="empty-subtitle">
                            {searchQuery ? `No results for "${searchQuery}"` : 'Create your first coupon to get started'}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setIsModalOpen(false)}>
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
                                        onChange={e => setForm({ ...form, code: e.target.value })}
                                        placeholder="e.g. SAVE20"
                                        required
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Discount Type</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value })}
                                    >
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
                                        onChange={e => setForm({ ...form, value: e.target.value })}
                                        placeholder={form.type === 'percentage' ? '20' : '100'}
                                        required
                                        min="0"
                                    />
                                </div>

                                <div className="form-field full">
                                    <label>Minimum Order Value (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.min_order}
                                        onChange={e => setForm({ ...form, min_order: e.target.value })}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
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

                /* HEADER */
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

                .page-subtitle {
                    color: #64748b;
                    font-size: 0.95rem;
                    margin: 0;
                }

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
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
                }

                .btn-icon {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                /* METRICS */
                .metrics-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

                .metric-card.active {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border: none;
                }

                .metric-card.active .metric-label,
                .metric-card.active .metric-value {
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

                /* SEARCH */
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
                    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
                }

                .result-count {
                    font-size: 0.9rem;
                    color: #64748b;
                    white-space: nowrap;
                }

                /* COUPONS GRID */
                .coupons-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 40px 30px;
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
                    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }

                .coupon-card.active {
                    border-left: 4px solid #16a34a;
                }

                .coupon-card.inactive {
                    opacity: 0.6;
                }

                .coupon-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }

                .coupon-code {
                    background: #dbeafe;
                    color: #1e40af;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 700;
                    font-family: 'Monaco', 'Courier New', monospace;
                    font-size: 1rem;
                    letter-spacing: 0.5px;
                    border: 1px dashed #93c5fd;
                }

                .active-indicator {
                    background: #dcfce7;
                    color: #166534;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .coupon-details {
                    flex: 1;
                    margin-bottom: 16px;
                }

                .discount-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 8px;
                }

                .discount-type {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-bottom: 12px;
                }

                .min-order {
                    font-size: 0.9rem;
                    color: #475569;
                    padding: 8px 12px;
                    background: #f8fafc;
                    border-radius: 6px;
                }

                .coupon-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: auto;
                    padding-top: 16px;
                    border-top: 1px solid #f1f5f9;
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
                    max-width: 500px;
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
                    margin-bottom: 0;
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
                    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
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
                    .coupons-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 16px;
                    }

                    .btn-add-coupon {
                        width: 100%;
                        justify-content: center;
                    }

                    .metrics-row {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .coupons-grid {
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
