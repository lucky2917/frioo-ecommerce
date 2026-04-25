import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { logger } from '../../utils/logger';
import { showToast } from '../../utils/toast';

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
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
            showToast('Failed to fetch orders', 'error');
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
            showToast('Failed to update status', 'error');
        } else {
            showToast(`Order updated to ${newStatus}`, 'success');
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
            showToast('No delivery address available', 'error');
            return;
        }
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`, '_blank');
    };

    if (loading) return <div className="loading-state">Loading orders...</div>;

    return (
        <div className="admin-orders-page">
            <div className="orders-header">
                <div className="header-top">
                    <div>
                        <h1 className="page-title">Orders Management</h1>
                        <p className="page-subtitle">Monitor and manage all customer orders</p>
                    </div>
                </div>

                <div className="category-tabs">
                    {[
                        { key: 'active', label: 'Active Orders', count: metrics.active },
                        { key: 'completed', label: 'Completed', count: metrics.completed },
                        { key: 'all', label: 'All Orders', count: metrics.total }
                    ].map(({ key, label, count }) => (
                        <button
                            key={key}
                            className={`category-tab ${categoryFilter === key ? 'active' : ''}`}
                            onClick={() => setCategoryFilter(key)}
                        >
                            {label}
                            <span className="tab-count">{count}</span>
                        </button>
                    ))}
                </div>

                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-label">Total Orders</div>
                        <div className="metric-value">{metrics.total}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Pending</div>
                        <div className="metric-value pending">{metrics.pending}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Out for Delivery</div>
                        <div className="metric-value out-delivery">{metrics.outForDelivery}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Today's Revenue</div>
                        <div className="metric-value">₹{metrics.todayRevenue.toFixed(0)}</div>
                    </div>
                    <div className="metric-card revenue">
                        <div className="metric-label">Total Revenue</div>
                        <div className="metric-value">₹{metrics.totalRevenue.toFixed(0)}</div>
                    </div>
                </div>

                <div className="filters-bar">
                    <input
                        type="text"
                        placeholder="Search by order ID, name, phone, or address..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        {STATUS_ORDER.map(s => (
                            <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                    </select>
                    <select className="filter-select" value={orderTypeFilter} onChange={e => setOrderTypeFilter(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="delivery">Delivery</option>
                        <option value="takeaway">Pickup</option>
                    </select>
                </div>
            </div>

            <div className="orders-grid">
                {filteredOrders.map(order => {
                    const isExpanded = expandedOrders.has(order.id);
                    const items = parseItems(order.items);
                    const totalItems = items.reduce((s, i) => s + (i.qty || 1), 0);
                    const subtotal = (order.total_amount || 0) + (order.discount || 0);

                    return (
                        <div key={order.id} className={`order-card status-${order.status}`}>
                            <div className="card-header-compact">
                                <div className="compact-left">
                                    <div className="order-id-row">
                                        <span className="order-id">#{String(order.id).slice(0, 8).toUpperCase()}</span>
                                        <span className={`status-badge-small ${order.status}`}>
                                            {order.status.replace(/-/g, ' ')}
                                        </span>
                                        <span className={`type-badge ${order.order_type}`}>
                                            {order.order_type === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
                                        </span>
                                    </div>
                                    <div className="customer-row">
                                        <div className="customer-avatar-small">
                                            {order.profiles?.full_name?.charAt(0).toUpperCase() || 'G'}
                                        </div>
                                        <div className="customer-info-compact">
                                            <div className="customer-name-small">{order.profiles?.full_name || 'Guest'}</div>
                                            <div className="order-meta-row">
                                                <span className="order-time-small">{new Date(order.created_at).toLocaleString('en-IN', {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}</span>
                                                <span className="items-pill">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="compact-right">
                                    <div className="total-amount-compact">₹{order.total_amount}</div>
                                    <button className="expand-btn" onClick={() => toggleOrder(order.id)}>
                                        {isExpanded ? '▲ Collapse' : '▼ Expand'}
                                    </button>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="order-details">
                                    <div className="details-section">
                                        <div className="section-title">Customer & Order Info</div>
                                        <div className="detail-row">
                                            <span className="detail-label">Phone:</span>
                                            <a href={`tel:${order.profiles?.phone_number}`} className="detail-link">
                                                {order.profiles?.phone_number || 'No phone'}
                                            </a>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Email:</span>
                                            <span className="detail-value">{order.profiles?.email || '—'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Type:</span>
                                            <span className="detail-value" style={{ textTransform: 'capitalize' }}>{order.order_type || 'delivery'}</span>
                                        </div>
                                        {order.order_type === 'delivery' && order.address && (
                                            <div className="detail-row">
                                                <span className="detail-label">Address:</span>
                                                <span className="detail-value address-value">{order.address}</span>
                                            </div>
                                        )}
                                        {order.order_type === 'delivery' && order.distance > 0 && (
                                            <div className="detail-row">
                                                <span className="detail-label">Distance:</span>
                                                <span className="detail-value">{Number(order.distance).toFixed(1)} km</span>
                                            </div>
                                        )}
                                    </div>

                                    {order.order_type === 'delivery' && order.address && (
                                        <div className="details-section directions-section">
                                            <button className="directions-btn" onClick={() => openDirections(order)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                                </svg>
                                                Get Directions
                                            </button>
                                        </div>
                                    )}

                                    <div className="details-section">
                                        <div className="section-title">Order Items</div>
                                        {items.map((item, idx) => (
                                            <div key={idx} className="item-row">
                                                <div className="item-main">
                                                    <span className="item-qty">{item.qty}×</span>
                                                    <div className="item-info">
                                                        <div className="item-title-row">
                                                            <span className="item-title">{item.title}</span>
                                                            {item.isVirtual && <span className="ai-label">AI</span>}
                                                        </div>
                                                        <span className="item-variant">{item.variant}</span>
                                                    </div>
                                                    <span className="item-price">₹{((item.price || 0) * (item.qty || 1)).toFixed(0)}</span>
                                                </div>

                                                {item.preferences && (item.preferences.exclusions?.length > 0 || item.preferences.removedIngredients?.length > 0 || item.preferences.note) && (
                                                    <div className="item-customizations">
                                                        {item.preferences.exclusions?.length > 0 && (
                                                            <div className="custom-row allergies">
                                                                <span className="custom-label">Allergies:</span>
                                                                <span className="custom-value">No {item.preferences.exclusions.join(', ')}</span>
                                                            </div>
                                                        )}
                                                        {item.preferences.removedIngredients?.length > 0 && (
                                                            <div className="custom-row removed">
                                                                <span className="custom-label">Removed:</span>
                                                                <span className="custom-value">{item.preferences.removedIngredients.join(', ')}</span>
                                                            </div>
                                                        )}
                                                        {item.preferences.note && (
                                                            <div className="custom-row note">
                                                                <span className="custom-label">Note:</span>
                                                                <span className="custom-value">{item.preferences.note}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {order.discount > 0 && (
                                        <div className="details-section">
                                            <div className="section-title">Price Breakdown</div>
                                            <div className="price-breakdown">
                                                <div className="price-line">
                                                    <span>Subtotal</span>
                                                    <span>₹{subtotal.toFixed(0)}</span>
                                                </div>
                                                <div className="price-line discount">
                                                    <span>
                                                        Discount {order.coupon_code && <span className="coupon-chip">{order.coupon_code}</span>}
                                                    </span>
                                                    <span>−₹{Number(order.discount).toFixed(0)}</span>
                                                </div>
                                                <div className="price-line total">
                                                    <span>Total</span>
                                                    <span>₹{Number(order.total_amount).toFixed(0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {order.notes && (
                                        <div className="details-section">
                                            <div className="order-notes-section">
                                                <span className="notes-label">Order Note:</span>
                                                <span className="notes-text">{order.notes}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="details-section">
                                        <div className="section-title">Update Status</div>
                                        <select
                                            className="status-select"
                                            value={order.status}
                                            onChange={e => updateStatus(order.id, e.target.value)}
                                        >
                                            {STATUS_ORDER.map(s => (
                                                <option key={s} value={s}>
                                                    {s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredOrders.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-title">No orders found</div>
                        <div className="empty-subtitle">Try adjusting your filters or search term</div>
                    </div>
                )}
            </div>

            <style>{`
                .admin-orders-page {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    padding-bottom: 40px;
                }

                .loading-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    color: #64748b;
                    font-size: 1.1rem;
                }

                .orders-header { margin-bottom: 32px; }

                .header-top { margin-bottom: 24px; }

                .page-title {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0 0 4px;
                    letter-spacing: -0.025em;
                }

                .page-subtitle { color: #64748b; font-size: 0.95rem; margin: 0; }

                .category-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 24px;
                    border-bottom: 2px solid #e2e8f0;
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
                }

                .category-tab:hover { color: #3b82f6; }
                .category-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; }

                .tab-count {
                    background: #e2e8f0;
                    color: #475569;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .category-tab.active .tab-count { background: #dbeafe; color: #1e40af; }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .metric-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                }

                .metric-card:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }

                .metric-card.revenue {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border: none;
                }

                .metric-card.revenue .metric-label,
                .metric-card.revenue .metric-value { color: white; }

                .metric-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-bottom: 8px;
                }

                .metric-value {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .metric-value.pending { color: #ea580c; }
                .metric-value.out-delivery { color: #9333ea; }

                .filters-bar {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .search-input,
                .filter-select {
                    padding: 10px 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    outline: none;
                    transition: all 0.2s;
                    background: white;
                }

                .search-input { flex: 1; min-width: 280px; }

                .search-input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
                }

                .filter-select { min-width: 150px; cursor: pointer; }
                .filter-select:hover { border-color: #94a3b8; }

                .orders-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
                    gap: 20px;
                    margin-top: 24px;
                }

                .order-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    border-left: 4px solid #cbd5e1;
                    transition: all 0.2s;
                }

                .order-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    transform: translateY(-2px);
                }

                .order-card.status-pending { border-left-color: #ea580c; }
                .order-card.status-confirmed { border-left-color: #2563eb; }
                .order-card.status-preparing { border-left-color: #ca8a04; }
                .order-card.status-ready { border-left-color: #16a34a; }
                .order-card.status-out-for-delivery { border-left-color: #9333ea; }
                .order-card.status-delivered { border-left-color: #65a30d; }
                .order-card.status-cancelled { border-left-color: #dc2626; }

                .card-header-compact {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                }

                .compact-left { flex: 1; min-width: 0; }

                .order-id-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }

                .order-id {
                    font-family: 'Monaco', 'Courier New', monospace;
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #0f172a;
                    letter-spacing: 0.5px;
                }

                .status-badge-small {
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status-badge-small.pending { background: #ffedd5; color: #9a3412; }
                .status-badge-small.confirmed { background: #dbeafe; color: #1e40af; }
                .status-badge-small.preparing { background: #fef3c7; color: #92400e; }
                .status-badge-small.ready { background: #dcfce7; color: #166534; }
                .status-badge-small.out-for-delivery { background: #f3e8ff; color: #6b21a8; }
                .status-badge-small.delivered { background: #ecfccb; color: #3f6212; }
                .status-badge-small.cancelled { background: #fee2e2; color: #991b1b; }

                .type-badge {
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 600;
                    background: #f1f5f9;
                    color: #475569;
                }

                .type-badge.delivery { background: #eff6ff; color: #1d4ed8; }
                .type-badge.takeaway { background: #f0fdf4; color: #15803d; }

                .customer-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .customer-avatar-small {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.95rem;
                    flex-shrink: 0;
                }

                .customer-info-compact { flex: 1; min-width: 0; }

                .customer-name-small {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 0.9rem;
                    margin-bottom: 3px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .order-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .order-time-small { font-size: 0.75rem; color: #94a3b8; }

                .items-pill {
                    font-size: 0.7rem;
                    padding: 2px 7px;
                    background: #f1f5f9;
                    color: #64748b;
                    border-radius: 10px;
                    font-weight: 600;
                }

                .compact-right {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 8px;
                }

                .total-amount-compact {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .expand-btn {
                    background: #f1f5f9;
                    color: #475569;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .expand-btn:hover { background: #e2e8f0; color: #334155; }

                .order-details {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .details-section {
                    background: #f8fafc;
                    padding: 14px;
                    border-radius: 8px;
                }

                .directions-section {
                    background: #eff6ff;
                    padding: 12px 14px;
                    border: 1px solid #bfdbfe;
                }

                .section-title {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #64748b;
                    margin-bottom: 10px;
                }

                .detail-row {
                    display: flex;
                    gap: 8px;
                    font-size: 0.85rem;
                    margin-bottom: 7px;
                    align-items: flex-start;
                }

                .detail-row:last-child { margin-bottom: 0; }

                .detail-label {
                    font-weight: 700;
                    color: #475569;
                    min-width: 65px;
                    flex-shrink: 0;
                }

                .detail-value { color: #1e293b; }
                .address-value { line-height: 1.4; }

                .detail-link { color: #3b82f6; text-decoration: none; }
                .detail-link:hover { text-decoration: underline; }

                .directions-btn {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .directions-btn:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(59,130,246,0.25);
                }

                .item-row {
                    background: white;
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 8px;
                }

                .item-row:last-child { margin-bottom: 0; }

                .item-main {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }

                .item-qty { font-weight: 700; color: #0f172a; flex-shrink: 0; min-width: 26px; }
                .item-info { flex: 1; }

                .item-title-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-bottom: 3px;
                }

                .item-title { font-weight: 600; color: #1e293b; font-size: 0.9rem; }

                .ai-label {
                    padding: 2px 6px;
                    background: linear-gradient(135deg, #06b6d4, #3b82f6);
                    color: white;
                    border-radius: 4px;
                    font-size: 0.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .item-variant { font-size: 0.8rem; color: #64748b; }

                .item-price {
                    font-weight: 700;
                    color: #0f172a;
                    font-size: 0.9rem;
                    margin-left: auto;
                    flex-shrink: 0;
                }

                .item-customizations {
                    margin-top: 8px;
                    padding: 8px 10px;
                    background: #f8fafc;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .custom-row { display: flex; gap: 8px; font-size: 0.8rem; }
                .custom-label { font-weight: 700; color: #475569; min-width: 75px; }
                .custom-value { color: #1e293b; }
                .custom-row.allergies .custom-label,
                .custom-row.allergies .custom-value { color: #dc2626; }
                .custom-row.removed .custom-label,
                .custom-row.removed .custom-value { color: #ea580c; }
                .custom-row.note { background: #f0f9ff; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #0ea5e9; }
                .custom-row.note .custom-label { color: #0369a1; }
                .custom-row.note .custom-value { color: #0c4a6e; }

                .price-breakdown { display: flex; flex-direction: column; gap: 8px; }

                .price-line {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.875rem;
                    color: #475569;
                }

                .price-line.discount { color: #16a34a; }

                .price-line.total {
                    font-weight: 700;
                    color: #0f172a;
                    font-size: 1rem;
                    padding-top: 8px;
                    border-top: 1px solid #e2e8f0;
                }

                .coupon-chip {
                    display: inline-block;
                    background: #dcfce7;
                    color: #166534;
                    padding: 2px 7px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    font-family: 'Monaco', monospace;
                    margin-left: 6px;
                }

                .order-notes-section {
                    background: #fffbeb;
                    padding: 12px;
                    border-radius: 6px;
                    border-left: 3px solid #eab308;
                    display: flex;
                    gap: 8px;
                    font-size: 0.85rem;
                }

                .notes-label { font-weight: 700; color: #92400e; }
                .notes-text { color: #713f12; }

                .status-select {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    background: white;
                    color: #334155;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    outline: none;
                    transition: all 0.2s;
                }

                .status-select:hover { border-color: #94a3b8; }
                .status-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 80px 20px;
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }

                .empty-title { font-size: 1.25rem; font-weight: 600; color: #334155; margin-bottom: 8px; }
                .empty-subtitle { font-size: 0.95rem; color: #94a3b8; }

                @media (max-width: 768px) {
                    .orders-grid { grid-template-columns: 1fr; }
                    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
                    .category-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                    .category-tab { white-space: nowrap; }
                    .filters-bar { flex-direction: column; }
                    .search-input, .filter-select { width: 100%; }
                    .card-header-compact { flex-direction: column; align-items: stretch; }
                    .compact-right { flex-direction: row; justify-content: space-between; align-items: center; }
                }
            `}</style>
        </div>
    );
}
