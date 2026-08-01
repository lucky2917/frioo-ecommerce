import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchWithTimeout } from '../../lib/http';
import { supabase } from '../../lib/supabaseClient';
import { notify } from '../../lib/feedbackStore';
import { API_BASE_URL } from '../../config/constants';
import { AdminPage, MetricCard, AdminTable, AdminModal, ConfirmDialog, SearchInput, AdminErrorState } from '../../components/admin/ui';

const COLUMNS = [
    { key: 'user', label: 'User' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role' },
    { key: 'joined', label: 'Joined' },
    { key: 'actions', label: 'Actions', width: '120px' },
];

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ full_name: '', phone_number: '', role: 'customer' });
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const latestUsersRequestRef = useRef(0);

    const fetchUsers = useCallback(async (p = 1) => {
        const requestId = ++latestUsersRequestRef.current;
        setLoading(true);
        setLoadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetchWithTimeout(`${API_BASE_URL}/api/admin/users?page=${p}&limit=20`, {
                headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
            });
            const json = await res.json();
            if (requestId !== latestUsersRequestRef.current) return;

            if (!res.ok) throw new Error(json.error || 'Failed to fetch users');
            setUsers(json.users || []);
            setPagination(json.pagination || null);
        } catch {
            if (requestId !== latestUsersRequestRef.current) return;
            setLoadError("We could not load users. Check your connection and try again.");
        } finally {
            if (requestId === latestUsersRequestRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchUsers(page);
    }, [page, fetchUsers]);

    const metrics = useMemo(() => {
        const total = users.length;
        const admins = users.filter(u => u.role === 'admin').length;
        const customers = users.filter(u => u.role === 'customer' || !u.role).length;

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentSignups = users.filter(u => new Date(u.created_at) > sevenDaysAgo).length;

        return { total, admins, customers, recentSignups };
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (roleFilter !== 'all') {
                const userRole = user.role || 'customer';
                if (userRole !== roleFilter) return false;
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const name = (user.full_name || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                const phone = (user.phone_number || '').toLowerCase();

                if (!name.includes(query) && !email.includes(query) && !phone.includes(query)) {
                    return false;
                }
            }

            return true;
        });
    }, [users, searchQuery, roleFilter]);

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name || '',
            phone_number: user.phone_number || '',
            role: user.role || 'customer'
        });
        setIsModalOpen(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser || submitting) return;

        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const res = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    phone_number: formData.phone_number,
                    role: formData.role
                })
            });

            const data = await res.json();
            if (data.success) {
                setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
                notify.success("User updated");
                setIsModalOpen(false);
                setEditingUser(null);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            notify.error("Update failed: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeleteUser = async () => {
        if (deleting || !deleteId) return;
        setDeleting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const res = await fetch(`${API_BASE_URL}/api/admin/users/${deleteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            const data = await res.json();
            if (data.success) {
                setUsers(prev => prev.filter(u => u.id !== deleteId));
                notify.success("User deleted");
                setDeleteId(null);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            notify.error("Error deleting user: " + err.message);
        } finally {
            setDeleting(false);
        }
    };

    const metricCards = (
        <>
            <MetricCard label="Total users" value={metrics.total} />
            <MetricCard tone="brand" label="Administrators" value={metrics.admins} sub={`${metrics.total > 0 ? Math.round((metrics.admins / metrics.total) * 100) : 0}% of users`} />
            <MetricCard label="Customers" value={metrics.customers} />
            <MetricCard tone="info" label="Recent signups" value={metrics.recentSignups} sub="Last 7 days" />
        </>
    );

    if (loadError) {
        return (
            <AdminPage title="Users">
                <AdminErrorState message={loadError} onRetry={() => { setLoadError(null); setLoading(true); fetchUsers(); }} />
            </AdminPage>
        );
    }

    return (
        <AdminPage title="Users" subtitle="Manage user accounts and permissions" metrics={loading ? undefined : metricCards}>
            <div className="au-toolbar">
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or phone" ariaLabel="Search users" />
                <select className="adm-select au-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} aria-label="Filter by role">
                    <option value="all">All roles</option>
                    <option value="admin">Admins</option>
                    <option value="customer">Customers</option>
                </select>
                <span className="au-count">{pagination ? `${pagination.total} total` : `${filteredUsers.length} users`}</span>
            </div>

            <AdminTable
                columns={COLUMNS}
                isLoading={loading}
                isEmpty={filteredUsers.length === 0}
                emptyLabel={searchQuery ? `No results for "${searchQuery}"` : 'No users match the selected filters'}
            >
                {filteredUsers.map(user => (
                    <tr key={user.id}>
                        <td>
                            <div className="au-user">
                                <div className="au-avatar" aria-hidden="true">
                                    {user.avatar_url ? <img loading="lazy" decoding="async" src={user.avatar_url} alt="" /> : (user.full_name?.charAt(0).toUpperCase() || 'U')}
                                </div>
                                <div className="au-user-info">
                                    <div className="au-name">{user.full_name || 'Guest'}</div>
                                    <div className="au-email">{user.email}</div>
                                </div>
                            </div>
                        </td>
                        <td>{user.phone_number || '—'}</td>
                        <td>
                            <span className={`adm-chip ${user.role === 'admin' ? 'adm-chip--brand' : 'au-chip-customer'}`}>{user.role || 'customer'}</span>
                        </td>
                        <td className="au-date">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td>
                            <div className="au-actions">
                                <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => handleEdit(user)}>Edit</button>
                                <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setDeleteId(user.id)} aria-label={`Delete ${user.full_name || 'user'}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </AdminTable>

            {pagination && pagination.pages > 1 && (
                <div className="au-pagination">
                    <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
                        Prev
                    </button>
                    <span className="au-page-info">Page {pagination.page} of {pagination.pages}</span>
                    <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}>
                        Next
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                </div>
            )}

            <AdminModal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit user" size="sm">
                <form onSubmit={handleUpdateUser} className="au-form">
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="au-name">Full name</label>
                        <input id="au-name" className="adm-input" type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
                    </div>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="au-phone">Phone number</label>
                        <input id="au-phone" className="adm-input" type="tel" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} placeholder="+91..." />
                    </div>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="au-role">Role</label>
                        <select id="au-role" className="adm-select" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="customer">Customer</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <div className="au-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting} aria-busy={submitting}>
                            {submitting ? 'Saving' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </AdminModal>

            <ConfirmDialog
                open={deleteId !== null}
                title="Delete user?"
                message="This permanently deletes the user account and cannot be undone."
                confirmLabel="Delete user"
                loading={deleting}
                onConfirm={confirmDeleteUser}
                onCancel={() => setDeleteId(null)}
            />

            <style>{`
                .au-toolbar { display: flex; gap: var(--fr-s3); flex-wrap: wrap; align-items: center; margin-bottom: var(--fr-s4); }
                .au-select { width: auto; min-width: 150px; }
                .au-count { font-size: var(--fr-fs-caption); color: var(--adm-text-3); font-weight: var(--fr-fw-medium); margin-left: auto; }

                .au-user { display: flex; align-items: center; gap: var(--fr-s3); }
                .au-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: var(--fr-brand-tint); color: var(--fr-brand); display: flex; align-items: center; justify-content: center; font-weight: var(--fr-fw-bold); font-size: var(--fr-fs-caption); flex-shrink: 0; }
                .au-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .au-name { font-weight: var(--fr-fw-medium); font-size: var(--fr-fs-caption); color: var(--adm-text); }
                .au-email { font-size: var(--fr-fs-label); color: var(--adm-text-3); }
                .au-date { color: var(--adm-text-2); white-space: nowrap; }
                .au-chip-customer { background: var(--adm-surface-2); color: var(--adm-text-2); text-transform: capitalize; }
                .adm-chip--brand { text-transform: capitalize; }
                .au-actions { display: flex; gap: var(--fr-s2); align-items: center; }

                .au-pagination { display: flex; align-items: center; justify-content: center; gap: var(--fr-s4); margin-top: var(--fr-s5); }
                .au-page-info { font-size: var(--fr-fs-caption); color: var(--adm-text-2); font-weight: var(--fr-fw-medium); font-variant-numeric: tabular-nums; }

                .au-form { display: flex; flex-direction: column; gap: var(--fr-s4); }
                .au-form-actions { display: flex; justify-content: flex-end; gap: var(--fr-s3); margin-top: var(--fr-s2); padding-top: var(--fr-s4); border-top: 1px solid var(--adm-border); }
            `}</style>
        </AdminPage>
    );
}
