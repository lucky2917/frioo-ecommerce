import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { logger } from '../../utils/logger';
import { showToast } from '../../utils/toast';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [orderTypeFilter, setOrderTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('active'); // active, completed, all
    const [expandedOrders, setExpandedOrders] = useState(new Set());

    const toggleOrder = (orderId) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
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
            logger.error("Error fetching orders:", err.message);
            showToast("Failed to fetch orders", 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Realtime Updates
    useEffect(() => {
        fetchOrders();
        const channel = supabase
            .channel('admin-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [fetchOrders]);

    const updateStatus = async (id, newStatus) => {
        const previousOrders = [...orders];
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            setOrders(previousOrders);
            showToast("Failed to update status", 'error');
        } else {
            showToast(`Order updated to ${newStatus}`, 'success');
        }
    };

    // Category filtering
    const getFilteredByCategory = () => {
        if (categoryFilter === 'active') {
            return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
        } else if (categoryFilter === 'completed') {
            return orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
        }
        return orders;
    };

    // Combined filtering
    const filteredOrders = getFilteredByCategory().filter(order => {
        const matchesSearch = searchTerm === '' ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.profiles?.phone_number?.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesType = orderTypeFilter === 'all' || order.order_type === orderTypeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    // Metrics
    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

    const metrics = {
        total: orders.length,
        active: activeOrders.length,
        completed: completedOrders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    };

    if (loading) return <div className="loading-state">Loading orders...</div>;

    return (
        <div className="admin-orders-page">
            {/* HEADER */}
            <div className="orders-header">
                <div className="header-top">
                    <div>
                        <h1 className="page-title">Orders Management</h1>
                        <p className="page-subtitle">Monitor and manage all customer orders</p>
                    </div>
                </div>

                {/* CATEGORY TABS */}
                <div className="category-tabs">
                    <button
                        className={`category-tab ${categoryFilter === 'active' ? 'active' : ''}`}
                        onClick={() => setCategoryFilter('active')}
                    >
                        Active Orders
                        <span className="tab-count">{metrics.active}</span>
                    </button>
                    <button
                        className={`category-tab ${categoryFilter === 'completed' ? 'active' : ''}`}
                        onClick={() => setCategoryFilter('completed')}
                    >
                        Completed
                        <span className="tab-count">{metrics.completed}</span>
                    </button>
                    <button
                        className={`category-tab ${categoryFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setCategoryFilter('all')}
                    >
                        All Orders
                        <span className="tab-count">{metrics.total}</span>
                    </button>
                </div>

                {/* METRICS */}
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
                        <div className="metric-label">Confirmed</div>
                        <div className="metric-value confirmed">{metrics.confirmed}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Preparing</div>
                        <div className="metric-value preparing">{metrics.preparing}</div>
                    </div>
                    <div className="metric-card revenue">
                        <div className="metric-label">Total Revenue</div>
                        <div className="metric-value">₹{metrics.revenue.toFixed(0)}</div>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="filters-bar">
                    <input
                        type="text"
                        placeholder="Search by order ID, customer name, or phone..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="out-for-delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select className="filter-select" value={orderTypeFilter} onChange={(e) => setOrderTypeFilter(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="delivery">Delivery</option>
                        <option value="takeaway">Pickup</option>
                    </select>
                </div>
            </div>

            {/* ORDERS GRID */}
            <div className="orders-grid">
                {filteredOrders.map(order => {
                    const isExpanded = expandedOrders.has(order.id);

                    return (
                        <div key={order.id} className={`order-card status-${order.status}`}>
                            {/* CARD HEADER - Always Visible */}
                            <div className="card-header-compact">
                                <div className="compact-left">
                                    <div className="order-id-row">
                                        <span className="order-id">#{String(order.id).slice(0, 8).toUpperCase()}</span>
                                        <span className={`status-badge-small ${order.status}`}>
                                            {order.status.replace(/-/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="customer-row">
                                        <div className="customer-avatar-small">
                                            {order.profiles?.full_name?.charAt(0).toUpperCase() || 'G'}
                                        </div>
                                        <div className="customer-info-compact">
                                            <div className="customer-name-small">{order.profiles?.full_name || 'Guest'}</div>
                                            <div className="order-time-small">{new Date(order.created_at).toLocaleString('en-IN', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="compact-right">
                                    <div className="total-amount-compact">₹{order.total_amount}</div>
                                    <button
                                        className="expand-btn"
                                        onClick={() => toggleOrder(order.id)}
                                    >
                                        {isExpanded ? '▲ Collapse' : '▼ Expand'}
                                    </button>
                                </div>
                            </div>

                            {/* EXPANDABLE DETAILS */}
                            {isExpanded && (
                                <div className="order-details">
                                    {/* Full Header */}
                                    <div className="details-section">
                                        <div className="section-title">Order Details</div>
                                        <div className="detail-row">
                                            <span className="detail-label">Type:</span>
                                            <span className="detail-value">{order.order_type || 'delivery'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Phone:</span>
                                            <a href={`tel:${order.profiles?.phone_number}`} className="detail-link">
                                                {order.profiles?.phone_number || 'No phone'}
                                            </a>
                                        </div>
                                    </div>

                                    {/* ITEMS */}
                                    <div className="details-section">
                                        <div className="section-title">Order Items</div>
                                        {Array.isArray(order.items) && order.items.map((item, idx) => (
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
                                                    <span className="item-price">₹{(item.price * item.qty).toFixed(0)}</span>
                                                </div>

                                                {/* Customizations */}
                                                {item.preferences && (
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

                                    {/* ORDER NOTES */}
                                    {order.notes && (
                                        <div className="details-section">
                                            <div className="order-notes-section">
                                                <span className="notes-label">Order Note:</span>
                                                <span className="notes-text">{order.notes}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* DELIVERY INFO */}
                                    {order.order_type === 'delivery' && order.distance && (
                                        <div className="details-section">
                                            <div className="delivery-section">
                                                <span className="delivery-distance">Distance: {order.distance.toFixed(1)} km</span>
                                                <button
                                                    className="directions-btn"
                                                    onClick={() => {
                                                        const phone = order.profiles?.phone_number || '';
                                                        const name = order.profiles?.full_name || 'Customer';
                                                        let mapsUrl;
                                                        if (order.customer_lat && order.customer_lng) {
                                                            mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${order.customer_lat},${order.customer_lng}`;
                                                        } else if (phone) {
                                                            mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(phone + ' ' + name)}`;
                                                        } else {
                                                            showToast('No location data available', 'error');
                                                            return;
                                                        }
                                                        window.open(mapsUrl, '_blank');
                                                    }}
                                                >
                                                    Get Directions
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* STATUS UPDATE */}
                                    <div className="details-section">
                                        <div className="section-title">Update Status</div>
                                        <select
                                            className="status-select"
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="preparing">Preparing</option>
                                            <option value="ready">Ready</option>
                                            <option value="out-for-delivery">Out for Delivery</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
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
                /* BASE STYLES */
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

                /* HEADER SECTION */
                .orders-header {
                    margin-bottom: 32px;
                }

                .header-top {
                    margin-bottom: 24px;
                }

                .page-title {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0 0 4px 0;
                    letter-spacing: -0.025em;
                }

                .page-subtitle {
                    color: #64748b;
                    font-size: 0.95rem;
                    margin: 0;
                }

                /* CATEGORY TABS */
                .category-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 24px;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 0;
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

                .category-tab:hover {
                    color: #3b82f6;
                }

                .category-tab.active {
                    color: #3b82f6;
                    border-bottom-color: #3b82f6;
                }

                .tab-count {
                    background: #e2e8f0;
                    color: #475569;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .category-tab.active .tab-count {
                    background: #dbeafe;
                    color: #1e40af;
                }

                /* METRICS GRID */
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .metric-card.revenue {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border: none;
                }

                .metric-card.revenue .metric-label,
                .metric-card.revenue .metric-value {
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
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .metric-value.pending { color: #ea580c; }
                .metric-value.confirmed { color: #2563eb; }
                .metric-value.preparing { color: #ca8a04; }

                /* FILTERS BAR */
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

                .search-input {
                    flex: 1;
                    min-width: 280px;
                }

                .search-input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }

                .filter-select {
                    min-width: 150px;
                    cursor: pointer;
                }

                .filter-select:hover {
                    border-color: #94a3b8;
                }

                /* ORDERS GRID */
                .orders-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
                    gap: 20px;
                    margin-top: 24px;
                }

                /* ORDER CARD */
                .order-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    border-left: 4px solid #cbd5e1;
                    transition: all 0.2s;
                }

                .order-card:hover {
                    border-left-color: #3b82f6;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    transform: translateY(-2px);
                }

                .order-card.status-pending { border-left-color: #ea580c; }
                .order-card.status-confirmed { border-left-color: #2563eb; }
                .order-card.status-preparing { border-left-color: #ca8a04; }
                .order-card.status-ready { border-left-color: #16a34a; }
                .order-card.status-out-for-delivery { border-left-color: #9333ea; }
                .order-card.status-delivered { border-left-color: #65a30d; }
                .order-card.status-cancelled { border-left-color: #dc2626; }

                /* COMPACT CARD HEADER */
                .card-header-compact {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                }

                .compact-left {
                    flex: 1;
                    min-width: 0;
                }

                .order-id-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
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

                .customer-info-compact {
                    flex: 1;
                    min-width: 0;
                }

                .customer-name-small {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 0.9rem;
                    margin-bottom: 2px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .order-time-small {
                    font-size: 0.75rem;
                    color: #94a3b8;
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

                .expand-btn:hover {
                    background: #e2e8f0;
                    color: #334155;
                }

                /* EXPANDABLE DETAILS */
                .order-details {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .details-section {
                    background: #f8fafc;
                    padding: 14px;
                    border-radius: 8px;
                }

                .section-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-bottom: 12px;
                }

                .detail-row {
                    display: flex;
                    gap: 8px;
                    font-size: 0.85rem;
                    margin-bottom: 8px;
                }

                .detail-row:last-child {
                    margin-bottom: 0;
                }

                .detail-label {
                    font-weight: 700;
                    color: #475569;
                    min-width: 60px;
                }

                .detail-value {
                    color: #1e293b;
                }

                .detail-link {
                    color: #3b82f6;
                    text-decoration: none;
                }

                .detail-link:hover {
                    text-decoration: underline;
                }

                /* CARD HEADER (OLD - Keep for backwards compat) */
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .order-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .order-id {
                    font-family: 'Monaco', 'Courier New', monospace;
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #0f172a;
                    letter-spacing: 0.5px;
                }

                .order-time {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .header-badges {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    align-items: flex-end;
                }

                .status-badge {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status-badge.pending { background: #ffedd5; color: #9a3412; }
                .status-badge.confirmed { background: #dbeafe; color: #1e40af; }
                .status-badge.preparing { background: #fef3c7; color: #92400e; }
                .status-badge.ready { background: #dcfce7; color: #166534; }
                .status-badge.out-for-delivery { background: #f3e8ff; color: #6b21a8; }
                .status-badge.delivered { background: #ecfccb; color: #3f6212; }
                .status-badge.cancelled { background: #fee2e2; color: #991b1b; }

                .type-badge {
                    padding: 3px 8px;
                    background: #f1f5f9;
                    color: #475569;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: capitalize;
                }

                /* CUSTOMER SECTION */
                .customer-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .customer-avatar {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.1rem;
                    flex-shrink: 0;
                }

                .customer-details {
                    flex: 1;
                }

                .customer-name {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 0.95rem;
                    margin-bottom: 2px;
                }

                .customer-phone {
                    font-size: 0.85rem;
                    color: #3b82f6;
                    text-decoration: none;
                    display: inline-block;
                }

                .customer-phone:hover {
                    text-decoration: underline;
                }

                /* ITEMS SECTION */
                .items-section {
                    margin-bottom: 16px;
                }

                .section-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-bottom: 12px;
                }

                .item-row {
                    background: #f8fafc;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 8px;
                }

                .item-row:last-child {
                    margin-bottom: 0;
                }

                .item-main {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    margin-bottom: 8px;
                }

                .item-qty {
                    font-weight: 700;
                    color: #0f172a;
                    flex-shrink: 0;
                    min-width: 28px;
                }

                .item-info {
                    flex: 1;
                }

                .item-title-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-bottom: 4px;
                }

                .item-title {
                    font-weight: 600;
                    color: #1e293b;
                    font-size: 0.9rem;
                }

                .ai-label {
                    padding: 2px 6px;
                    background: linear-gradient(135deg, #06b6d4, #3b82f6);
                    color: white;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .item-variant {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .item-price {
                    font-weight: 700;
                    color: #0f172a;
                    font-size: 0.95rem;
                    margin-left: auto;
                    flex-shrink: 0;
                }

                /* CUSTOMIZATIONS */
                .item-customizations {
                    background: white;
                    padding: 10px;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .custom-row {
                    display: flex;
                    gap: 8px;
                    font-size: 0.8rem;
                }

                .custom-label {
                    font-weight: 700;
                    color: #475569;
                    min-width: 80px;
                }

                .custom-value {
                    color: #1e293b;
                }

                .custom-row.allergies .custom-label { color: #dc2626; }
                .custom-row.allergies .custom-value { color: #dc2626; }

                .custom-row.removed .custom-label { color: #ea580c; }
                .custom-row.removed .custom-value { color: #ea580c; }

                .custom-row.note {
                    background: #f0f9ff;
                    padding: 8px;
                    border-radius: 4px;
                    border-left: 3px solid #0ea5e9;
                }

                .custom-row.note .custom-label { color: #0369a1; }
                .custom-row.note .custom-value { color: #0c4a6e; }

                /* ORDER NOTES */
                .order-notes-section {
                    background: #fffbeb;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid #fde047;
                    border-left: 3px solid #eab308;
                    margin-bottom: 12px;
                    display: flex;
                    gap: 8px;
                    font-size: 0.85rem;
                }

                .notes-label {
                    font-weight: 700;
                    color: #92400e;
                }

                .notes-text {
                    color: #713f12;
                }

                /* DELIVERY SECTION */
                .delivery-section {
                background: #eff6ff;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid #bfdbfe;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .delivery-distance {
                    font-size: 0.85rem;
                    color: #1e40af;
                    font-weight: 600;
                }

                .directions-btn {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 6px 14px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .directions-btn:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.25);
                }

                /* FOOTER */
                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    padding-top: 16px;
                    border-top: 1px solid #f1f5f9;
                }

                .order-total {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                }

                .total-label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #64748b;
                }

                .total-amount {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .status-select {
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

                .status-select:hover {
                    border-color: #94a3b8;
                }

                .status-select:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                /* EMPTY STATE */
                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 80px 20px;
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
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

                /* RESPONSIVE */
                @media (max-width: 768px) {
                    .orders-grid {
                        grid-template-columns: 1fr;
                    }

                    .metrics-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .category-tabs {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }

                    .category-tab {
                        white-space: nowrap;
                    }

                    .filters-bar {
                        flex-direction: column;
                    }

                    .search-input,
                    .filter-select {
                        width: 100%;
                    }

                    .card-header-compact {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .compact-right {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .expand-btn {
                        flex-shrink: 0;
                    }

                    .card-footer {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .status-select {
                        width: 100%;
                    }

                    .delivery-section {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .directions-btn {
                        width: 100%;
                    }
                }
            `}</style>
        </div >
    );
}