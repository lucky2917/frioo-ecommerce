import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { formatOrderAmount, getStatusPresentation } from '../../utils/orderStatus';
import { AdminPage, MetricCard, AdminTable, StatusChip, AdminErrorState } from '../../components/admin/ui';
import SystemPanel from '../../components/admin/SystemPanel';

const TONE_VARS = {
    info: 'var(--fr-info)',
    brand: 'var(--fr-brand)',
    success: 'var(--fr-success)',
    danger: 'var(--fr-danger)',
};

const statusColor = (status) => TONE_VARS[getStatusPresentation(status).tone] || TONE_VARS.info;

const DeliveryIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Delivery"><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="M4 17.5H2.5v-4l2-4h6l3 4h4.5a2 2 0 0 1 2 2v2H20M9 17.5h6" /></svg>
);

const PickupIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Pickup"><path d="M3 9l1-5h16l1 5M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M3 9h18" /></svg>
);

const QA_ITEMS = [
    { to: '/admin/orders', label: 'Manage orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { to: '/admin/products', label: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { to: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { to: '/admin/coupons', label: 'Coupons', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
];

const RECENT_COLUMNS = [
    { key: 'id', label: 'ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];

export default function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

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
        } catch {
            setLoadError('We could not load the dashboard. Check your connection and try again.');
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

        const statusCounts = STATUS_ORDER.map(s => ({
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

    const subtitle = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (loadError) {
        return (
            <AdminPage title="Dashboard">
                <AdminErrorState message={loadError} onRetry={() => { setLoadError(null); setLoading(true); loadAll(); }} />
            </AdminPage>
        );
    }

    if (loading) {
        return (
            <AdminPage title="Dashboard" subtitle={subtitle}
                metrics={Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="adm-metric">
                        <div className="adm-skel-line" style={{ width: '55%', height: 12, marginBottom: 14 }} />
                        <div className="adm-skel-line" style={{ width: '70%', height: 22 }} />
                    </div>
                ))}
            >
                <AdminTable columns={RECENT_COLUMNS} isLoading skeletonRows={6} />
            </AdminPage>
        );
    }

    const maxBar = Math.max(...stats.revenueByDay.map(d => d.revenue), 1);

    return (
        <AdminPage
            title="Dashboard"
            subtitle={subtitle}
            metrics={
                <>
                    <MetricCard tone="brand" label="Today's revenue" value={`₹${formatOrderAmount(stats.todayRevenue)}`} sub={`${stats.deliveredToday} delivered today`} />
                    <MetricCard label="This week" value={`₹${formatOrderAmount(stats.weekRevenue)}`} sub="Last 7 days" />
                    <MetricCard label="All-time revenue" value={`₹${formatOrderAmount(stats.totalRevenue)}`} sub={`${stats.totalOrders} total orders`} />
                    <MetricCard tone="warm" label="Pending orders" value={stats.pendingOrders} sub={`${stats.activeOrders} active total`} />
                    <MetricCard tone="info" label="Total users" value={stats.totalUsers} sub={`+${stats.newUsersThisWeek} this week`} />
                    <MetricCard tone="success" label="Products" value={stats.totalProducts} sub={`${stats.featuredProducts} featured`} />
                </>
            }
        >
            <div className="db-charts">
                <div className="adm-card">
                    <div className="db-chart-head">
                        <div className="db-chart-title">Revenue, last 7 days</div>
                        <div className="db-chart-total">₹{formatOrderAmount(stats.weekRevenue)} this week</div>
                    </div>
                    <div className="db-bars">
                        {stats.revenueByDay.map((d, i) => (
                            <div key={i} className="db-bar-col">
                                <div className="db-bar-amount">{d.revenue > 0 ? `₹${d.revenue >= 1000 ? (d.revenue / 1000).toFixed(1) + 'k' : formatOrderAmount(d.revenue)}` : ''}</div>
                                <div className="db-bar-track">
                                    <div className="db-bar-fill" style={{ height: `${(d.revenue / maxBar) * 100}%` }} />
                                </div>
                                <div className="db-bar-day">{d.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="adm-card">
                    <div className="db-chart-head">
                        <div className="db-chart-title">Order status</div>
                        <div className="db-chart-total">{stats.totalOrders} total</div>
                    </div>
                    <div className="db-status-list">
                        {stats.statusCounts.map(({ status, count }) => (
                            <div key={status} className="db-status-row">
                                <div className="db-status-meta">
                                    <span className="db-status-dot" style={{ background: statusColor(status) }} />
                                    <span className="db-status-name">{getStatusPresentation(status).label}</span>
                                    <span className="db-status-count">{count}</span>
                                </div>
                                <div className="db-status-track">
                                    <div className="db-status-fill" style={{ width: `${(count / stats.totalOrders) * 100}%`, background: statusColor(status) }} />
                                </div>
                            </div>
                        ))}
                        {stats.statusCounts.length === 0 && <div className="adm-table-empty">No orders yet</div>}
                    </div>
                </div>
            </div>

            <div className="db-bottom">
                <div className="db-recent">
                    <div className="db-section-head">
                        <div className="db-chart-title">Recent orders</div>
                        <Link to="/admin/orders" className="db-see-all">View all</Link>
                    </div>
                    <AdminTable columns={RECENT_COLUMNS} isEmpty={stats.recentOrders.length === 0} emptyLabel="No orders yet">
                        {stats.recentOrders.map(order => (
                            <tr key={order.id}>
                                <td className="adm-mono">#{order.id}</td>
                                <td className="db-name-cell">{order.profiles?.full_name || 'Guest'}</td>
                                <td>{order.order_type === 'delivery' ? <DeliveryIcon /> : <PickupIcon />}</td>
                                <td style={{ fontWeight: 'var(--fr-fw-bold)' }}>₹{formatOrderAmount(order.total_amount)}</td>
                                <td><StatusChip status={order.status} /></td>
                            </tr>
                        ))}
                    </AdminTable>
                </div>

                <div className="adm-card db-quick">
                    <div className="db-chart-title" style={{ marginBottom: 'var(--fr-s4)' }}>Quick actions</div>
                    <div className="db-qa-list">
                        {QA_ITEMS.map(({ to, label, icon }) => (
                            <Link key={to} to={to} className="db-qa-item">
                                <span className="db-qa-icon" aria-hidden="true">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                                    </svg>
                                </span>
                                <span className="db-qa-label">{label}</span>
                                <svg className="db-qa-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .db-charts { display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--fr-s4); margin-bottom: var(--fr-s4); }
                .db-chart-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--fr-s5); }
                .db-chart-title { font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); color: var(--adm-text); }
                .db-chart-total { font-size: var(--fr-fs-label); color: var(--adm-text-2); font-weight: var(--fr-fw-regular); font-variant-numeric: tabular-nums; }

                .db-bars { display: flex; align-items: flex-end; gap: var(--fr-s3); height: 160px; }
                .db-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
                .db-bar-amount { font-size: var(--fr-fs-label); color: var(--adm-text-2); margin-bottom: var(--fr-s1); height: 16px; line-height: 16px; font-weight: var(--fr-fw-medium); white-space: nowrap; font-variant-numeric: tabular-nums; }
                .db-bar-track { flex: 1; width: 100%; background: var(--adm-surface-2); border-radius: var(--fr-r-control); display: flex; align-items: flex-end; overflow: hidden; }
                .db-bar-fill { width: 100%; background: var(--fr-brand); border-radius: var(--fr-r-control) var(--fr-r-control) 0 0; transition: height var(--fr-dur-expressive) var(--fr-ease-settle); min-height: 2px; }
                .db-bar-day { font-size: var(--fr-fs-label); color: var(--adm-text-3); margin-top: var(--fr-s1); font-weight: var(--fr-fw-regular); }

                .db-status-list { display: flex; flex-direction: column; gap: var(--fr-s3); }
                .db-status-row { display: flex; flex-direction: column; gap: var(--fr-s1); }
                .db-status-meta { display: flex; align-items: center; gap: var(--fr-s2); }
                .db-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                .db-status-name { font-size: var(--fr-fs-caption); color: var(--adm-text); font-weight: var(--fr-fw-regular); flex: 1; }
                .db-status-count { font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-bold); color: var(--adm-text); font-variant-numeric: tabular-nums; }
                .db-status-track { height: 6px; background: var(--adm-surface-2); border-radius: var(--fr-r-pill); overflow: hidden; }
                .db-status-fill { height: 100%; border-radius: var(--fr-r-pill); transition: width var(--fr-dur-expressive) var(--fr-ease-settle); min-width: 4px; }

                .db-bottom { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--fr-s4); }
                .db-section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--fr-s4); }
                .db-see-all { font-size: var(--fr-fs-caption); color: var(--fr-brand); text-decoration: none; font-weight: var(--fr-fw-medium); }
                .db-see-all:hover { color: var(--fr-brand-press); }
                .db-name-cell { font-weight: var(--fr-fw-medium); color: var(--adm-text); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                .db-quick { align-self: start; }
                .db-qa-list { display: flex; flex-direction: column; gap: var(--fr-s1); }
                .db-qa-item { display: flex; align-items: center; gap: var(--fr-s3); padding: var(--fr-s3); border-radius: var(--fr-r-card); text-decoration: none; border: 1px solid transparent; transition: background var(--fr-dur-quick) var(--fr-ease-standard), border-color var(--fr-dur-quick) var(--fr-ease-standard); }
                .db-qa-item:hover { background: var(--adm-surface-2); border-color: var(--adm-border); }
                .db-qa-item:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
                .db-qa-icon { width: 38px; height: 38px; border-radius: var(--fr-r-card); background: var(--fr-brand-tint); color: var(--fr-brand); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .db-qa-icon svg { width: 20px; height: 20px; }
                .db-qa-label { font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); color: var(--adm-text); flex: 1; }
                .db-qa-arrow { width: 16px; height: 16px; color: var(--adm-text-3); flex-shrink: 0; }

                @media (prefers-reduced-motion: reduce) {
                    .db-bar-fill, .db-status-fill, .db-qa-item { transition: none; }
                }

                @media (max-width: 1200px) {
                    .db-charts, .db-bottom { grid-template-columns: 1fr; }
                }
            `}</style>

            <SystemPanel />
        </AdminPage>
    );
}
