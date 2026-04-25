import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { showToast } from '../../utils/toast';

const STATUS_COLORS = {
    pending: '#ea580c',
    confirmed: '#2563eb',
    preparing: '#ca8a04',
    ready: '#16a34a',
    'out-for-delivery': '#9333ea',
    delivered: '#65a30d',
    cancelled: '#dc2626'
};

export default function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAll = useCallback(async () => {
        try {
            const [oRes, pRes, uRes] = await Promise.all([
                supabase.from('orders').select('id, total_amount, status, order_type, created_at, profiles(full_name)').order('created_at', { ascending: false }),
                supabase.from('products').select('id, featured, category'),
                supabase.from('profiles').select('id, created_at, role')
            ]);
            if (oRes.error) throw oRes.error;
            if (pRes.error) throw pRes.error;
            if (uRes.error) throw uRes.error;
            setOrders(oRes.data || []);
            setProducts(pRes.data || []);
            setUsers(uRes.data || []);
        } catch (err) {
            showToast('Failed to load dashboard: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 30000);
        return () => clearInterval(interval);
    }, [loadAll]);

    const stats = useMemo(() => {
        const now = new Date();
        const today = new Date(now); today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const nonCancelled = orders.filter(o => o.status !== 'cancelled');
        const todayNonCancelled = nonCancelled.filter(o => new Date(o.created_at) >= today);
        const weekNonCancelled = nonCancelled.filter(o => new Date(o.created_at) >= weekAgo);

        const revenueByDay = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(now);
            day.setDate(day.getDate() - (6 - i));
            day.setHours(0, 0, 0, 0);
            const next = new Date(day);
            next.setDate(next.getDate() + 1);
            const rev = nonCancelled
                .filter(o => { const d = new Date(o.created_at); return d >= day && d < next; })
                .reduce((s, o) => s + (o.total_amount || 0), 0);
            return { label: day.toLocaleDateString('en-IN', { weekday: 'short' }), revenue: rev };
        });

        const statusCounts = Object.keys(STATUS_COLORS).map(s => ({
            status: s,
            count: orders.filter(o => o.status === s).length
        })).filter(s => s.count > 0);

        return {
            todayRevenue: todayNonCancelled.reduce((s, o) => s + (o.total_amount || 0), 0),
            weekRevenue: weekNonCancelled.reduce((s, o) => s + (o.total_amount || 0), 0),
            totalRevenue: nonCancelled.reduce((s, o) => s + (o.total_amount || 0), 0),
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            activeOrders: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
            deliveredToday: orders.filter(o => o.status === 'delivered' && new Date(o.created_at) >= today).length,
            totalProducts: products.length,
            featuredProducts: products.filter(p => p.featured).length,
            totalUsers: users.length,
            newUsersThisWeek: users.filter(u => new Date(u.created_at) >= weekAgo).length,
            revenueByDay,
            statusCounts,
            recentOrders: orders.slice(0, 6)
        };
    }, [orders, products, users]);

    if (loading) return <div className="db-loading">Loading dashboard...</div>;

    const maxBar = Math.max(...stats.revenueByDay.map(d => d.revenue), 1);

    return (
        <div className="dashboard">
            <div className="db-header">
                <div>
                    <h1 className="db-title">Dashboard</h1>
                    <p className="db-subtitle">
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card dark">
                    <div className="kpi-top">
                        <span className="kpi-label">Today's Revenue</span>
                        <span className="kpi-icon-wrap dark-icon">₹</span>
                    </div>
                    <div className="kpi-value">₹{stats.todayRevenue.toFixed(0)}</div>
                    <div className="kpi-sub">{stats.deliveredToday} delivered today</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-top">
                        <span className="kpi-label">This Week</span>
                    </div>
                    <div className="kpi-value">₹{stats.weekRevenue.toFixed(0)}</div>
                    <div className="kpi-sub">Last 7 days</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-top">
                        <span className="kpi-label">All-Time Revenue</span>
                    </div>
                    <div className="kpi-value">₹{stats.totalRevenue.toFixed(0)}</div>
                    <div className="kpi-sub">{stats.totalOrders} total orders</div>
                </div>
                <div className="kpi-card accent-orange">
                    <div className="kpi-top">
                        <span className="kpi-label">Pending Orders</span>
                    </div>
                    <div className="kpi-value">{stats.pendingOrders}</div>
                    <div className="kpi-sub">{stats.activeOrders} active total</div>
                </div>
                <div className="kpi-card accent-blue">
                    <div className="kpi-top">
                        <span className="kpi-label">Total Users</span>
                    </div>
                    <div className="kpi-value">{stats.totalUsers}</div>
                    <div className="kpi-sub">+{stats.newUsersThisWeek} this week</div>
                </div>
                <div className="kpi-card accent-green">
                    <div className="kpi-top">
                        <span className="kpi-label">Products</span>
                    </div>
                    <div className="kpi-value">{stats.totalProducts}</div>
                    <div className="kpi-sub">{stats.featuredProducts} featured</div>
                </div>
            </div>

            <div className="charts-row">
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">Revenue — Last 7 Days</div>
                        <div className="chart-total">₹{stats.weekRevenue.toFixed(0)} this week</div>
                    </div>
                    <div className="bar-chart">
                        {stats.revenueByDay.map((d, i) => (
                            <div key={i} className="bar-col">
                                <div className="bar-amount">{d.revenue > 0 ? `₹${d.revenue >= 1000 ? (d.revenue / 1000).toFixed(1) + 'k' : d.revenue.toFixed(0)}` : ''}</div>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ height: `${(d.revenue / maxBar) * 100}%` }} />
                                </div>
                                <div className="bar-day">{d.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">Order Status Breakdown</div>
                        <div className="chart-total">{stats.totalOrders} total</div>
                    </div>
                    <div className="status-bars">
                        {stats.statusCounts.map(({ status, count }) => (
                            <div key={status} className="status-bar-row">
                                <div className="status-bar-meta">
                                    <span className="status-dot" style={{ background: STATUS_COLORS[status] }} />
                                    <span className="status-name">{status.replace(/-/g, ' ')}</span>
                                    <span className="status-count">{count}</span>
                                </div>
                                <div className="status-bar-track">
                                    <div
                                        className="status-bar-fill"
                                        style={{
                                            width: `${(count / stats.totalOrders) * 100}%`,
                                            background: STATUS_COLORS[status]
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {stats.statusCounts.length === 0 && (
                            <div className="no-data">No orders yet</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bottom-row">
                <div className="recent-card">
                    <div className="section-header">
                        <div className="section-title">Recent Orders</div>
                        <Link to="/admin/orders" className="see-all">View all →</Link>
                    </div>
                    {stats.recentOrders.length > 0 ? (
                        <table className="recent-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Customer</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="mono-cell">#{order.id}</td>
                                        <td className="name-cell">{order.profiles?.full_name || 'Guest'}</td>
                                        <td>{order.order_type === 'delivery' ? '🛵' : '🏪'}</td>
                                        <td className="amount-cell">₹{Number(order.total_amount).toFixed(0)}</td>
                                        <td>
                                            <span
                                                className="status-chip"
                                                style={{
                                                    background: STATUS_COLORS[order.status] + '20',
                                                    color: STATUS_COLORS[order.status]
                                                }}
                                            >
                                                {order.status.replace(/-/g, ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="no-data">No orders yet</div>
                    )}
                </div>

                <div className="quick-card">
                    <div className="section-title" style={{ marginBottom: '20px' }}>Quick Actions</div>
                    <div className="qa-list">
                        {[
                            { to: '/admin/orders', label: 'Manage Orders', sub: `${stats.pendingOrders} pending`, color: '#ea580c', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                            { to: '/admin/products', label: 'Inventory', sub: `${stats.totalProducts} products`, color: '#2563eb', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
                            { to: '/admin/users', label: 'Users', sub: `+${stats.newUsersThisWeek} this week`, color: '#9333ea', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                            { to: '/admin/coupons', label: 'Coupons', sub: 'Manage discounts', color: '#16a34a', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' }
                        ].map(({ to, label, sub, color, icon }) => (
                            <Link key={to} to={to} className="qa-item">
                                <div className="qa-icon" style={{ background: color + '15', color }}>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                                    </svg>
                                </div>
                                <div>
                                    <div className="qa-label">{label}</div>
                                    <div className="qa-sub">{sub}</div>
                                </div>
                                <svg className="qa-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    padding-bottom: 60px;
                }

                .db-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    color: #64748b;
                    font-size: 1.1rem;
                    font-family: 'Inter', sans-serif;
                }

                .db-header { margin-bottom: 32px; }

                .db-title {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0 0 4px;
                    letter-spacing: -0.025em;
                }

                .db-subtitle { color: #64748b; font-size: 0.9rem; margin: 0; }

                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .kpi-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 22px 24px;
                    transition: all 0.2s;
                }

                .kpi-card:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                    transform: translateY(-1px);
                }

                .kpi-card.dark {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border: none;
                    box-shadow: 0 8px 24px rgba(15,23,42,0.25);
                }

                .kpi-card.dark .kpi-label,
                .kpi-card.dark .kpi-value,
                .kpi-card.dark .kpi-sub { color: white; }

                .kpi-card.dark .kpi-sub { opacity: 0.6; }

                .kpi-card.accent-orange { border-top: 3px solid #ea580c; }
                .kpi-card.accent-orange .kpi-value { color: #ea580c; }
                .kpi-card.accent-blue { border-top: 3px solid #2563eb; }
                .kpi-card.accent-blue .kpi-value { color: #2563eb; }
                .kpi-card.accent-green { border-top: 3px solid #16a34a; }
                .kpi-card.accent-green .kpi-value { color: #16a34a; }

                .kpi-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }

                .kpi-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                }

                .kpi-icon-wrap {
                    width: 32px;
                    height: 32px;
                    background: rgba(255,255,255,0.15);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: white;
                }

                .kpi-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #0f172a;
                    letter-spacing: -0.02em;
                    margin-bottom: 6px;
                }

                .kpi-sub {
                    font-size: 0.8rem;
                    color: #94a3b8;
                }

                .charts-row {
                    display: grid;
                    grid-template-columns: 1.4fr 1fr;
                    gap: 20px;
                    margin-bottom: 24px;
                }

                .chart-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 24px;
                }

                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .chart-title {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .chart-total {
                    font-size: 0.8rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .bar-chart {
                    display: flex;
                    align-items: flex-end;
                    gap: 10px;
                    height: 160px;
                }

                .bar-col {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                }

                .bar-amount {
                    font-size: 0.65rem;
                    color: #64748b;
                    margin-bottom: 4px;
                    height: 16px;
                    line-height: 16px;
                    font-weight: 600;
                    white-space: nowrap;
                }

                .bar-track {
                    flex: 1;
                    width: 100%;
                    background: #f1f5f9;
                    border-radius: 6px 6px 4px 4px;
                    display: flex;
                    align-items: flex-end;
                    overflow: hidden;
                }

                .bar-fill {
                    width: 100%;
                    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
                    border-radius: 6px 6px 0 0;
                    transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    min-height: 2px;
                }

                .bar-day {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    margin-top: 6px;
                    font-weight: 500;
                }

                .status-bars {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .status-bar-row { display: flex; flex-direction: column; gap: 6px; }

                .status-bar-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .status-name {
                    font-size: 0.8rem;
                    color: #334155;
                    font-weight: 500;
                    flex: 1;
                    text-transform: capitalize;
                }

                .status-count {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .status-bar-track {
                    height: 6px;
                    background: #f1f5f9;
                    border-radius: 3px;
                    overflow: hidden;
                }

                .status-bar-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.6s ease;
                    min-width: 4px;
                }

                .bottom-row {
                    display: grid;
                    grid-template-columns: 1.6fr 1fr;
                    gap: 20px;
                }

                .recent-card, .quick-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 24px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .section-title {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .see-all {
                    font-size: 0.85rem;
                    color: #3b82f6;
                    text-decoration: none;
                    font-weight: 600;
                    transition: color 0.2s;
                }

                .see-all:hover { color: #2563eb; }

                .recent-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .recent-table th {
                    text-align: left;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #94a3b8;
                    padding: 0 12px 10px 0;
                    border-bottom: 1px solid #f1f5f9;
                }

                .recent-table td {
                    padding: 12px 12px 12px 0;
                    border-bottom: 1px solid #f8fafc;
                    font-size: 0.875rem;
                }

                .recent-table tbody tr:last-child td { border-bottom: none; }

                .mono-cell {
                    font-family: 'Monaco', 'Courier New', monospace;
                    font-size: 0.8rem;
                    color: #475569;
                    font-weight: 600;
                }

                .name-cell {
                    font-weight: 600;
                    color: #0f172a;
                    max-width: 120px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .amount-cell { font-weight: 700; color: #0f172a; }

                .status-chip {
                    padding: 3px 9px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: capitalize;
                    white-space: nowrap;
                }

                .no-data {
                    text-align: center;
                    padding: 40px 20px;
                    color: #94a3b8;
                    font-size: 0.9rem;
                }

                .qa-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .qa-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px;
                    border-radius: 10px;
                    text-decoration: none;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }

                .qa-item:hover {
                    background: #f8fafc;
                    border-color: #e2e8f0;
                }

                .qa-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .qa-icon svg { width: 20px; height: 20px; }

                .qa-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #0f172a;
                    margin-bottom: 2px;
                }

                .qa-sub { font-size: 0.75rem; color: #94a3b8; }

                .qa-arrow {
                    width: 16px;
                    height: 16px;
                    color: #cbd5e1;
                    margin-left: auto;
                    flex-shrink: 0;
                }

                @media (max-width: 1200px) {
                    .kpi-grid { grid-template-columns: repeat(3, 1fr); }
                    .charts-row { grid-template-columns: 1fr; }
                    .bottom-row { grid-template-columns: 1fr; }
                }

                @media (max-width: 768px) {
                    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
                    .charts-row { grid-template-columns: 1fr; }
                    .bottom-row { grid-template-columns: 1fr; }
                    .kpi-value { font-size: 1.5rem; }
                }

                @media (max-width: 480px) {
                    .kpi-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
