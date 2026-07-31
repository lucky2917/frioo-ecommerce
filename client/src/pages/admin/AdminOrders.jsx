import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { logger } from '../../utils/logger';
import { notify } from '../../lib/feedbackStore';
import { formatOrderAmount, getStatusPresentation } from '../../utils/orderStatus';
import { AdminPage, MetricCard, StatusChip, SearchInput, AdminErrorState } from '../../components/admin/ui';

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];

const TONE_VARS = {
    info: 'var(--fr-info)',
    brand: 'var(--fr-brand)',
    success: 'var(--fr-success)',
    danger: 'var(--fr-danger)',
};

const statusColor = (status) => TONE_VARS[getStatusPresentation(status).tone] || TONE_VARS.info;
const statusLabel = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const OrderTypeBadge = ({ type }) => {
    const delivery = type === 'delivery';
    return (
        <span className="ao-type">
            {delivery ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="M4 17.5H2.5v-4l2-4h6l3 4h4.5a2 2 0 0 1 2 2v2H20M9 17.5h6" /></svg>
            ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l1-5h16l1 5M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M3 9h18" /></svg>
            )}
            {delivery ? 'Delivery' : 'Pickup'}
        </span>
    );
};

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [orderTypeFilter, setOrderTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('active');
    const [expandedOrders, setExpandedOrders] = useState(new Set());

    const toggleOrder = (orderId) => {
        setExpandedOrders(prev => {
            const next = new Set(prev);
            next.has(orderId) ? next.delete(orderId) : next.add(orderId);
            return next;
        });
    };

    const fetchOrders = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, profiles (full_name, phone_number, email)`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            logger.error('Error fetching orders:', err.message);
            setLoadError('We could not load orders. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const channel = supabase
            .channel('admin-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [fetchOrders]);

    const updateStatus = async (id, newStatus) => {
        const previous = [...orders];
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            setOrders(previous);
            notify.error('Failed to update status');
        } else {
            notify.success(`Order updated to ${newStatus}`);
        }
    };

    const metrics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            total: orders.length,
            active: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
            completed: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length,
            pending: orders.filter(o => o.status === 'pending').length,
            outForDelivery: orders.filter(o => o.status === 'out-for-delivery').length,
            todayRevenue: orders
                .filter(o => o.status !== 'cancelled' && new Date(o.created_at) >= today)
                .reduce((sum, o) => sum + (o.total_amount || 0), 0),
            totalRevenue: orders
                .filter(o => o.status !== 'cancelled')
                .reduce((sum, o) => sum + (o.total_amount || 0), 0)
        };
    }, [orders]);

    const filteredOrders = useMemo(() => {
        let base = orders;

        if (categoryFilter === 'active') {
            base = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
        } else if (categoryFilter === 'completed') {
            base = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
        }

        return base.filter(order => {
            const q = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                order.id?.toString().toLowerCase().includes(q) ||
                order.profiles?.full_name?.toLowerCase().includes(q) ||
                order.profiles?.phone_number?.includes(searchTerm) ||
                order.address?.toLowerCase().includes(q);

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            const matchesType = orderTypeFilter === 'all' || order.order_type === orderTypeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [orders, categoryFilter, searchTerm, statusFilter, orderTypeFilter]);

    const parseItems = (raw) => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            try { return JSON.parse(raw); } catch { return []; }
        }
        return [];
    };

    const openDirections = (order) => {
        if (!order.address) {
            notify.error('No delivery address available');
            return;
        }
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`, '_blank');
    };

    const metricCards = (
        <>
            <MetricCard label="Total orders" value={metrics.total} />
            <MetricCard tone="warm" label="Pending" value={metrics.pending} />
            <MetricCard tone="info" label="Out for delivery" value={metrics.outForDelivery} />
            <MetricCard label="Today's revenue" value={`₹${formatOrderAmount(metrics.todayRevenue)}`} />
            <MetricCard tone="brand" label="Total revenue" value={`₹${formatOrderAmount(metrics.totalRevenue)}`} />
        </>
    );

    if (loadError) {
        return (
            <AdminPage title="Orders">
                <AdminErrorState message={loadError} onRetry={() => { setLoadError(null); setLoading(true); fetchOrders(); }} />
            </AdminPage>
        );
    }

    return (
        <AdminPage title="Orders" subtitle="Monitor and manage customer orders" metrics={loading ? undefined : metricCards}>
            <div className="ao-tabs" role="tablist" aria-label="Order category">
                {[
                    { key: 'active', label: 'Active', count: metrics.active },
                    { key: 'completed', label: 'Completed', count: metrics.completed },
                    { key: 'all', label: 'All orders', count: metrics.total }
                ].map(({ key, label, count }) => (
                    <button
                        key={key}
                        role="tab"
                        aria-selected={categoryFilter === key}
                        className={`ao-tab ${categoryFilter === key ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(key)}
                    >
                        {label}
                        <span className="ao-tab-count">{count}</span>
                    </button>
                ))}
            </div>

            <div className="ao-filters">
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by ID, name, phone, or address"
                    ariaLabel="Search orders"
                />
                <select className="adm-select ao-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
                    <option value="all">All status</option>
                    {STATUS_ORDER.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
                <select className="adm-select ao-select" value={orderTypeFilter} onChange={e => setOrderTypeFilter(e.target.value)} aria-label="Filter by type">
                    <option value="all">All types</option>
                    <option value="delivery">Delivery</option>
                    <option value="takeaway">Pickup</option>
                </select>
            </div>

            {loading ? (
                <div className="ao-list">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="ao-card">
                            <div className="ao-card-head">
                                <div style={{ flex: 1 }}>
                                    <div className="adm-skel-line" style={{ width: '40%', height: 16, marginBottom: 10 }} />
                                    <div className="adm-skel-line" style={{ width: '60%' }} />
                                </div>
                                <div className="adm-skel-line" style={{ width: 80, height: 24 }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="adm-card adm-state">
                    <h2 className="adm-state-title">No orders found</h2>
                    <p className="adm-state-text">Try adjusting your filters or search term.</p>
                </div>
            ) : (
                <div className="ao-list">
                    {filteredOrders.map(order => {
                        const isExpanded = expandedOrders.has(order.id);
                        const items = parseItems(order.items);
                        const totalItems = items.reduce((s, i) => s + (i.qty || 1), 0);
                        const subtotal = (order.total_amount || 0) + (order.discount || 0);

                        return (
                            <div key={order.id} className="ao-card" style={{ borderLeft: `3px solid ${statusColor(order.status)}` }}>
                                <div className="ao-card-head">
                                    <div className="ao-head-left">
                                        <div className="ao-id-row">
                                            <span className="ao-id">#{String(order.id).slice(0, 8).toUpperCase()}</span>
                                            <StatusChip status={order.status} />
                                            <OrderTypeBadge type={order.order_type} />
                                        </div>
                                        <div className="ao-customer-row">
                                            <div className="ao-avatar" aria-hidden="true">
                                                {order.profiles?.full_name?.charAt(0).toUpperCase() || 'G'}
                                            </div>
                                            <div>
                                                <div className="ao-customer-name">{order.profiles?.full_name || 'Guest'}</div>
                                                <div className="ao-meta">
                                                    <span>{new Date(order.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="ao-items-pill">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ao-head-right">
                                        <div className="ao-total">₹{formatOrderAmount(order.total_amount)}</div>
                                        <button
                                            className="adm-btn adm-btn-secondary adm-btn-sm"
                                            onClick={() => toggleOrder(order.id)}
                                            aria-expanded={isExpanded}
                                        >
                                            <svg className={`ao-chevron ${isExpanded ? 'up' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                                            {isExpanded ? 'Collapse' : 'Expand'}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="ao-details">
                                        <div className="ao-section">
                                            <div className="ao-section-title">Customer &amp; order info</div>
                                            <div className="ao-detail-row">
                                                <span className="ao-detail-label">Phone</span>
                                                <a href={`tel:${order.profiles?.phone_number}`} className="ao-detail-link">{order.profiles?.phone_number || 'No phone'}</a>
                                            </div>
                                            <div className="ao-detail-row">
                                                <span className="ao-detail-label">Email</span>
                                                <span className="ao-detail-value">{order.profiles?.email || '—'}</span>
                                            </div>
                                            <div className="ao-detail-row">
                                                <span className="ao-detail-label">Type</span>
                                                <span className="ao-detail-value">{order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                                            </div>
                                            {order.order_type === 'delivery' && order.address && (
                                                <div className="ao-detail-row">
                                                    <span className="ao-detail-label">Address</span>
                                                    <span className="ao-detail-value ao-address">{order.address}</span>
                                                </div>
                                            )}
                                            {order.order_type === 'delivery' && order.distance > 0 && (
                                                <div className="ao-detail-row">
                                                    <span className="ao-detail-label">Distance</span>
                                                    <span className="ao-detail-value">{Number(order.distance).toFixed(1)} km</span>
                                                </div>
                                            )}
                                            {order.order_type === 'delivery' && order.address && (
                                                <button className="adm-btn adm-btn-secondary adm-btn-sm ao-directions" onClick={() => openDirections(order)}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                                                    Get directions
                                                </button>
                                            )}
                                        </div>

                                        <div className="ao-section">
                                            <div className="ao-section-title">Order items</div>
                                            {items.map((item, idx) => (
                                                <div key={idx} className="ao-item">
                                                    <div className="ao-item-main">
                                                        <span className="ao-item-qty">{item.qty}&times;</span>
                                                        <div className="ao-item-info">
                                                            <div className="ao-item-title-row">
                                                                <span className="ao-item-title">{item.title}</span>
                                                                {item.isVirtual && <span className="ao-ai-label">AI</span>}
                                                            </div>
                                                            {item.variant && item.variant !== 'Standard' && <span className="ao-item-variant">{item.variant}</span>}
                                                        </div>
                                                        <span className="ao-item-price">₹{formatOrderAmount((item.price || 0) * (item.qty || 1))}</span>
                                                    </div>

                                                    {item.preferences && (item.preferences.exclusions?.length > 0 || item.preferences.removedIngredients?.length > 0 || item.preferences.note) && (
                                                        <div className="ao-item-custom">
                                                            {item.preferences.exclusions?.length > 0 && (
                                                                <div className="ao-custom-row"><span className="ao-custom-label">Allergies</span><span>No {item.preferences.exclusions.join(', ')}</span></div>
                                                            )}
                                                            {item.preferences.removedIngredients?.length > 0 && (
                                                                <div className="ao-custom-row"><span className="ao-custom-label">Removed</span><span>{item.preferences.removedIngredients.join(', ')}</span></div>
                                                            )}
                                                            {item.preferences.note && (
                                                                <div className="ao-custom-row"><span className="ao-custom-label">Note</span><span>{item.preferences.note}</span></div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {order.discount > 0 && (
                                            <div className="ao-section">
                                                <div className="ao-section-title">Price breakdown</div>
                                                <div className="ao-price">
                                                    <div className="ao-price-line"><span>Subtotal</span><span>₹{formatOrderAmount(subtotal)}</span></div>
                                                    <div className="ao-price-line ao-discount">
                                                        <span>Discount {order.coupon_code && <span className="ao-coupon">{order.coupon_code}</span>}</span>
                                                        <span>&minus;₹{formatOrderAmount(order.discount)}</span>
                                                    </div>
                                                    <div className="ao-price-line ao-price-total"><span>Total</span><span>₹{formatOrderAmount(order.total_amount)}</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {order.notes && (
                                            <div className="ao-section">
                                                <div className="ao-notes"><span className="ao-section-title">Order note</span><span>{order.notes}</span></div>
                                            </div>
                                        )}

                                        <div className="ao-section">
                                            <label className="ao-section-title" htmlFor={`status-${order.id}`}>Update status</label>
                                            <select
                                                id={`status-${order.id}`}
                                                className="adm-select"
                                                value={order.status}
                                                onChange={e => updateStatus(order.id, e.target.value)}
                                            >
                                                {STATUS_ORDER.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .ao-tabs { display: flex; gap: var(--fr-s1); margin-bottom: var(--fr-s5); border-bottom: 1px solid var(--adm-border); }
                .ao-tab { background: none; border: none; padding: var(--fr-s3) var(--fr-s4); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); color: var(--adm-text-2); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; display: flex; align-items: center; gap: var(--fr-s2); transition: color var(--fr-dur-quick) var(--fr-ease-standard); }
                .ao-tab:hover { color: var(--fr-brand); }
                .ao-tab.active { color: var(--fr-brand); border-bottom-color: var(--fr-brand); }
                .ao-tab-count { background: var(--adm-surface-2); color: var(--adm-text-2); padding: 1px var(--fr-s2); border-radius: var(--fr-r-pill); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); }
                .ao-tab.active .ao-tab-count { background: var(--fr-brand-tint); color: var(--fr-brand); }

                .ao-filters { display: flex; gap: var(--fr-s3); flex-wrap: wrap; align-items: center; margin-bottom: var(--fr-s5); }
                .ao-select { width: auto; min-width: 150px; }

                .ao-list { display: flex; flex-direction: column; gap: var(--fr-s3); }

                .ao-card { background: var(--adm-surface); border: 1px solid var(--adm-border); border-radius: var(--fr-r-card); overflow: hidden; }
                .ao-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--fr-s4); padding: var(--fr-s4); }
                .ao-head-left { display: flex; flex-direction: column; gap: var(--fr-s3); min-width: 0; }
                .ao-id-row { display: flex; align-items: center; gap: var(--fr-s2); flex-wrap: wrap; }
                .ao-id { font-family: var(--fr-font-mono); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-bold); color: var(--adm-text);  font-variant-numeric: tabular-nums; }

                .ao-type { display: inline-flex; align-items: center; gap: var(--fr-s1); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); color: var(--adm-text-2); background: var(--adm-surface-2); padding: var(--fr-s1) var(--fr-s2); border-radius: var(--fr-r-pill); }

                .ao-customer-row { display: flex; align-items: center; gap: var(--fr-s3); }
                .ao-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--fr-brand-tint); color: var(--fr-brand); display: flex; align-items: center; justify-content: center; font-weight: var(--fr-fw-bold); font-size: var(--fr-fs-caption); flex-shrink: 0; }
                .ao-customer-name { font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); color: var(--adm-text); }
                .ao-meta { display: flex; align-items: center; gap: var(--fr-s2); font-size: var(--fr-fs-label); color: var(--adm-text-3); }
                .ao-items-pill { background: var(--adm-surface-2); padding: 0 var(--fr-s2); border-radius: var(--fr-r-pill); color: var(--adm-text-2); font-weight: var(--fr-fw-medium); }

                .ao-head-right { display: flex; flex-direction: column; align-items: flex-end; gap: var(--fr-s2); flex-shrink: 0; }
                .ao-total { font-size: var(--fr-fs-lead); font-weight: var(--fr-fw-bold); color: var(--adm-text);  font-variant-numeric: tabular-nums; }
                .ao-chevron { transition: transform var(--fr-dur-quick) var(--fr-ease-standard); }
                .ao-chevron.up { transform: rotate(180deg); }

                .ao-details { border-top: 1px solid var(--adm-border); padding: var(--fr-s4); display: flex; flex-direction: column; gap: var(--fr-s4); background: var(--adm-canvas); }
                .ao-section { display: flex; flex-direction: column; gap: var(--fr-s2); }
                .ao-section-title { font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); text-transform: uppercase; letter-spacing: var(--fr-track-eyebrow); color: var(--adm-text-3); }
                .ao-detail-row { display: flex; justify-content: space-between; gap: var(--fr-s4); font-size: var(--fr-fs-caption); }
                .ao-detail-label { color: var(--adm-text-2); flex-shrink: 0; }
                .ao-detail-value { color: var(--adm-text); text-align: right; }
                .ao-address { max-width: 60%; }
                .ao-detail-link { color: var(--fr-brand); text-decoration: none; font-weight: var(--fr-fw-medium); }
                .ao-detail-link:hover { text-decoration: underline; }
                .ao-directions { align-self: flex-start; margin-top: var(--fr-s2); }

                .ao-item { padding: var(--fr-s3) 0; border-bottom: 1px solid var(--adm-border); }
                .ao-item:last-child { border-bottom: none; }
                .ao-item-main { display: flex; align-items: flex-start; gap: var(--fr-s3); }
                .ao-item-qty { font-weight: var(--fr-fw-bold); color: var(--fr-brand); min-width: 28px;  font-variant-numeric: tabular-nums; }
                .ao-item-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                .ao-item-title-row { display: flex; align-items: center; gap: var(--fr-s2); }
                .ao-item-title { font-weight: var(--fr-fw-medium); color: var(--adm-text); font-size: var(--fr-fs-caption); }
                .ao-ai-label { font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); color: var(--fr-info); background: #E3EDF3; padding: 0 var(--fr-s1); border-radius: var(--fr-r-control); }
                .ao-item-variant { font-size: var(--fr-fs-label); color: var(--adm-text-2); }
                .ao-item-price { font-weight: var(--fr-fw-medium); color: var(--adm-text); font-size: var(--fr-fs-caption);  font-variant-numeric: tabular-nums; }
                .ao-item-custom { margin-top: var(--fr-s2); margin-left: 28px; display: flex; flex-direction: column; gap: 2px; }
                .ao-custom-row { display: flex; gap: var(--fr-s2); font-size: var(--fr-fs-label); color: var(--fr-warm); }
                .ao-custom-label { font-weight: var(--fr-fw-medium); }

                .ao-price { display: flex; flex-direction: column; gap: var(--fr-s2); }
                .ao-price-line { display: flex; justify-content: space-between; font-size: var(--fr-fs-caption); color: var(--adm-text);  font-variant-numeric: tabular-nums; }
                .ao-discount { color: var(--fr-success); }
                .ao-coupon { background: var(--fr-brand-tint); color: var(--fr-brand); padding: 0 var(--fr-s2); border-radius: var(--fr-r-control); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); }
                .ao-price-total { font-weight: var(--fr-fw-bold); border-top: 1px solid var(--adm-border); padding-top: var(--fr-s2);  font-variant-numeric: tabular-nums; }

                .ao-notes { display: flex; flex-direction: column; gap: var(--fr-s1); background: var(--fr-warm-tint); padding: var(--fr-s3); border-radius: var(--fr-r-card); font-size: var(--fr-fs-caption); color: var(--adm-text); }

                @media (prefers-reduced-motion: reduce) {
                    .ao-tab, .ao-chevron { transition: none; }
                }

                @media (max-width: 640px) {
                    .ao-card-head { flex-direction: column; }
                    .ao-head-right { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; }
                    .ao-select { flex: 1; }
                }
            `}</style>
        </AdminPage>
    );
}
