import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { showToast } from '../../utils/toast';
import { AdminPage, MetricCard, AdminModal, ConfirmDialog, SearchInput } from '../../components/admin/ui';

const INITIAL_FORM = {
    code: '',
    value: '',
    type: 'percentage',
    min_order: '',
    description: '',
    expires_at: '',
    usage_limit: ''
};

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

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
        const totalUses = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
        return { total, active, expired, percentage, fixed, totalUses };
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
            expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
            usage_limit: coupon.usage_limit != null ? coupon.usage_limit.toString() : ''
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
                expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
                usage_limit: form.usage_limit !== '' ? parseInt(form.usage_limit, 10) : null
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

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            const { error } = await supabase.from('coupons').delete().eq('id', deleteId);
            if (error) throw error;
            setCoupons(prev => prev.filter(c => c.id !== deleteId));
            showToast('Coupon deleted successfully', 'success');
            setDeleteId(null);
        } catch (err) {
            showToast('Error deleting coupon: ' + err.message, 'error');
        } finally {
            setDeleting(false);
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

    const metricCards = (
        <>
            <MetricCard label="Total coupons" value={metrics.total} />
            <MetricCard tone="brand" label="Active" value={metrics.active} />
            <MetricCard tone="warm" label="Expired" value={metrics.expired} />
            <MetricCard label="% discounts" value={metrics.percentage} />
            <MetricCard label="Fixed discounts" value={metrics.fixed} />
            <MetricCard label="Total uses" value={metrics.totalUses} />
        </>
    );

    const addButton = (
        <button className="adm-btn adm-btn-primary" onClick={handleAddNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create coupon
        </button>
    );

    return (
        <AdminPage title="Coupons" subtitle="Create and manage discount coupons" actions={addButton} metrics={loading ? undefined : metricCards}>
            <div className="ac-toolbar">
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by code or description" ariaLabel="Search coupons" />
                <span className="ac-count">{filteredCoupons.length} coupon{filteredCoupons.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
                <div className="ac-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="ac-card">
                            <div className="adm-skel-line" style={{ width: '40%', height: 18, marginBottom: 14 }} />
                            <div className="adm-skel-line" style={{ width: '60%', height: 26, marginBottom: 14 }} />
                            <div className="adm-skel-line" style={{ width: '80%' }} />
                        </div>
                    ))}
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="adm-card adm-state">
                    <h2 className="adm-state-title">No coupons found</h2>
                    <p className="adm-state-text">{searchQuery ? `No results for "${searchQuery}"` : 'Create your first coupon to get started.'}</p>
                </div>
            ) : (
                <div className="ac-grid">
                    {filteredCoupons.map(coupon => {
                        const expired = isExpired(coupon);
                        return (
                            <div key={coupon.id} className={`ac-card ${coupon.is_active && !expired ? '' : 'ac-dim'}`}>
                                <div className="ac-head">
                                    <div className="ac-code">{coupon.code}</div>
                                    {expired ? (
                                        <span className="adm-chip adm-chip--danger">Expired</span>
                                    ) : coupon.is_active ? (
                                        <span className="adm-chip adm-chip--success">Active</span>
                                    ) : (
                                        <span className="adm-chip ac-chip-inactive">Inactive</span>
                                    )}
                                </div>

                                {coupon.description && <p className="ac-desc">{coupon.description}</p>}

                                <div className="ac-value">{coupon.discount_type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}</div>
                                <div className="ac-value-meta">{coupon.discount_type === 'percentage' ? 'Percentage discount' : 'Fixed amount'}</div>

                                <div className="ac-chips">
                                    <span className="ac-info-chip">Min ₹{coupon.min_order_value || 0}</span>
                                    {coupon.usage_limit != null && (
                                        <span className={`ac-info-chip ${(coupon.used_count || 0) >= coupon.usage_limit ? 'ac-chip-exhausted' : ''}`}>
                                            {coupon.used_count || 0}/{coupon.usage_limit} uses
                                        </span>
                                    )}
                                    {coupon.usage_limit == null && (coupon.used_count || 0) > 0 && (
                                        <span className="ac-info-chip">{coupon.used_count} uses</span>
                                    )}
                                </div>

                                {coupon.expires_at && (
                                    <div className={`ac-expiry ${expired ? 'ac-expiry-past' : ''}`}>
                                        Expires {new Date(coupon.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                )}

                                <div className="ac-actions">
                                    <button
                                        className="adm-btn adm-btn-secondary adm-btn-sm"
                                        onClick={() => toggleActive(coupon)}
                                        disabled={expired}
                                        title={expired ? 'Coupon is expired' : coupon.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        {coupon.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => handleEdit(coupon)}>Edit</button>
                                    <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setDeleteId(coupon.id)} aria-label={`Delete coupon ${coupon.code}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <AdminModal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit coupon' : 'Create coupon'} size="md">
                <form onSubmit={handleSave} className="ac-form">
                    <div className="ac-form-grid">
                        <div className="adm-field ac-full">
                            <label className="adm-label" htmlFor="ac-code">Coupon code</label>
                            <input id="ac-code" className="adm-input" type="text" value={form.code} onChange={e => setField('code', e.target.value)} placeholder="e.g. SAVE20" required style={{ textTransform: 'uppercase' }} />
                        </div>
                        <div className="adm-field ac-full">
                            <label className="adm-label" htmlFor="ac-desc">Description (optional)</label>
                            <input id="ac-desc" className="adm-input" type="text" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="e.g. 20% off on orders above ₹200" />
                        </div>
                        <div className="adm-field">
                            <label className="adm-label" htmlFor="ac-type">Discount type</label>
                            <select id="ac-type" className="adm-select" value={form.type} onChange={e => setField('type', e.target.value)}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed amount (₹)</option>
                            </select>
                        </div>
                        <div className="adm-field">
                            <label className="adm-label" htmlFor="ac-value">Discount value</label>
                            <input id="ac-value" className="adm-input" type="number" step="0.01" value={form.value} onChange={e => setField('value', e.target.value)} placeholder={form.type === 'percentage' ? '20' : '100'} required min="0" />
                        </div>
                        <div className="adm-field">
                            <label className="adm-label" htmlFor="ac-min">Min order value (₹)</label>
                            <input id="ac-min" className="adm-input" type="number" step="0.01" value={form.min_order} onChange={e => setField('min_order', e.target.value)} placeholder="0" min="0" />
                        </div>
                        <div className="adm-field">
                            <label className="adm-label" htmlFor="ac-expiry">Expiry date (optional)</label>
                            <input id="ac-expiry" className="adm-input" type="date" value={form.expires_at} onChange={e => setField('expires_at', e.target.value)} min={new Date().toISOString().slice(0, 10)} />
                        </div>
                        <div className="adm-field">
                            <label className="adm-label" htmlFor="ac-limit">Usage limit (optional)</label>
                            <input id="ac-limit" className="adm-input" type="number" value={form.usage_limit} onChange={e => setField('usage_limit', e.target.value)} placeholder="Unlimited" min="1" />
                        </div>
                    </div>
                    <div className="ac-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting} aria-busy={submitting}>
                            {submitting && <span className="adm-spin" aria-hidden="true" />}
                            {submitting ? 'Saving' : (editingId ? 'Update coupon' : 'Create coupon')}
                        </button>
                    </div>
                </form>
            </AdminModal>

            <ConfirmDialog
                open={deleteId !== null}
                title="Delete coupon?"
                message="This coupon will be permanently removed. This cannot be undone."
                confirmLabel="Delete coupon"
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />

            <style>{`
                .ac-toolbar { display: flex; gap: var(--fr-s3); align-items: center; margin-bottom: var(--fr-s5); }
                .ac-count { font-size: 0.83rem; color: var(--adm-text-3); font-weight: 600; margin-left: auto; }

                .ac-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--fr-s4); }
                .ac-card { background: var(--adm-surface); border: 1px solid var(--adm-border); border-radius: var(--fr-r-card); padding: var(--fr-s5); display: flex; flex-direction: column; }
                .ac-dim { opacity: 0.72; }
                .ac-head { display: flex; justify-content: space-between; align-items: center; gap: var(--fr-s3); margin-bottom: var(--fr-s3); }
                .ac-code { font-family: var(--fr-font-mono); font-size: 1.05rem; font-weight: 700; color: var(--adm-text); letter-spacing: 0.5px; }
                .ac-chip-inactive { background: var(--adm-surface-2); color: var(--adm-text-2); }
                .ac-desc { font-size: 0.85rem; color: var(--adm-text-2); margin: 0 0 var(--fr-s3); }
                .ac-value { font-size: 1.5rem; font-weight: 700; color: var(--fr-brand); }
                .ac-value-meta { font-size: 0.75rem; color: var(--adm-text-3); margin-bottom: var(--fr-s3); }
                .ac-chips { display: flex; flex-wrap: wrap; gap: var(--fr-s2); margin-bottom: var(--fr-s2); }
                .ac-info-chip { font-size: 0.72rem; font-weight: 600; color: var(--adm-text-2); background: var(--adm-surface-2); padding: 2px var(--fr-s2); border-radius: var(--fr-r-pill); }
                .ac-chip-exhausted { background: var(--fr-warm-tint); color: var(--fr-danger); }
                .ac-expiry { font-size: 0.78rem; color: var(--adm-text-3); margin-bottom: var(--fr-s3); }
                .ac-expiry-past { color: var(--fr-danger); font-weight: 600; }
                .ac-actions { display: flex; gap: var(--fr-s2); align-items: center; margin-top: auto; padding-top: var(--fr-s3); }
                .ac-actions .adm-btn { flex: 1; }

                .ac-form { display: flex; flex-direction: column; }
                .ac-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fr-s4); }
                .ac-full { grid-column: 1 / -1; }
                .ac-form-actions { display: flex; justify-content: flex-end; gap: var(--fr-s3); margin-top: var(--fr-s5); padding-top: var(--fr-s4); border-top: 1px solid var(--adm-border); }

                @media (max-width: 560px) {
                    .ac-form-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </AdminPage>
    );
}
