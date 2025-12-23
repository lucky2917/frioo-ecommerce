import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { showToast } from '../../utils/toast';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ full_name: '', phone_number: '', role: 'customer' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            showToast("Error fetching users: " + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Calculate metrics
    const metrics = useMemo(() => {
        const total = users.length;
        const admins = users.filter(u => u.role === 'admin').length;
        const customers = users.filter(u => u.role === 'customer' || !u.role).length;

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentSignups = users.filter(u => new Date(u.created_at) > sevenDaysAgo).length;

        return { total, admins, customers, recentSignups };
    }, [users]);

    // Filter users
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Role filter
            if (roleFilter !== 'all') {
                const userRole = user.role || 'customer';
                if (userRole !== roleFilter) return false;
            }

            // Search filter
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
        if (!editingUser) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
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
                showToast("User updated successfully!", 'success');
                setIsModalOpen(false);
                setEditingUser(null);
                fetchUsers();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            showToast("Update failed: " + err.message, 'error');
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("PERMANENTLY DELETE this user? This cannot be undone.")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            const data = await res.json();
            if (data.success) {
                showToast("User deleted successfully", 'success');
                fetchUsers();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            showToast("Error deleting user: " + err.message, 'error');
        }
    };

    if (loading) return <div className="loading-state">Loading users...</div>;

    return (
        <div className="users-page">
            {/* HEADER */}
            <div className="users-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage user accounts and permissions</p>
                </div>
            </div>

            {/* METRICS */}
            <div className="metrics-row">
                <div className="metric-card">
                    <div className="metric-label">Total Users</div>
                    <div className="metric-value">{metrics.total}</div>
                </div>
                <div className="metric-card admin">
                    <div className="metric-label">Administrators</div>
                    <div className="metric-value">{metrics.admins}</div>
                    <div className="metric-subtitle">{metrics.total > 0 ? Math.round((metrics.admins / metrics.total) * 100) : 0}% of users</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Customers</div>
                    <div className="metric-value">{metrics.customers}</div>
                </div>
                <div className="metric-card recent">
                    <div className="metric-label">Recent Signups</div>
                    <div className="metric-value">{metrics.recentSignups}</div>
                    <div className="metric-subtitle">Last 7 days</div>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="filters-bar">
                <div className="search-wrapper">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admins</option>
                        <option value="customer">Customers</option>
                    </select>
                    <span className="result-count">{filteredUsers.length} users</span>
                </div>
            </div>

            {/* USERS TABLE */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" />
                                            ) : (
                                                user.full_name?.charAt(0).toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <div className="user-info">
                                            <div className="user-name">{user.full_name || 'Guest'}</div>
                                            <div className="user-email">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{user.phone_number || '-'}</td>
                                <td>
                                    <span className={`role-badge ${user.role || 'customer'}`}>
                                        {user.role || 'customer'}
                                    </span>
                                </td>
                                <td>
                                    <div className="date-cell">
                                        {new Date(user.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="action-edit" onClick={() => handleEdit(user)}>
                                            Edit
                                        </button>
                                        <button className="action-delete" onClick={() => deleteUser(user.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-title">No users found</div>
                        <div className="empty-subtitle">
                            {searchQuery ? `No results for "${searchQuery}"` : 'No users match the selected filters'}
                        </div>
                    </div>
                )}
            </div>

            {/* EDIT MODAL */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setIsModalOpen(false)}>
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2 className="modal-title">Edit User</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="modal-form">
                            <div className="form-field">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                    placeholder="+91..."
                                />
                            </div>

                            <div className="form-field">
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="customer">Customer</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .users-page {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    padding-bottom: 60px;
                }

                /* HEADER */
                .users-header {
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

                .metric-card.admin {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border: none;
                }

                .metric-card.admin .metric-label,
                .metric-card.admin .metric-value,
                .metric-card.admin .metric-subtitle {
                    color: white;
                }

                .metric-card.recent {
                    border-color: #3b82f6;
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

                .metric-subtitle {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-top: 4px;
                }

                /* FILTERS */
                .filters-bar {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                    align-items: center;
                }

                .search-wrapper {
                    flex: 1;
                }

                .search-input {
                    width: 100%;
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

                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .filter-select {
                    padding: 10px 16px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #0f172a;
                }

                .result-count {
                    font-size: 0.9rem;
                    color: #64748b;
                    white-space: nowrap;
                }

                /* TABLE */
                .users-table-container {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .users-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .users-table thead {
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }

                .users-table th {
                    text-align: left;
                    padding: 16px 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                }

                .users-table tbody tr {
                    border-bottom: 1px solid #f1f5f9;
                    transition: background 0.2s;
                }

                .users-table tbody tr:hover {
                    background: #f8fafc;
                }

                .users-table td {
                    padding: 16px 20px;
                    vertical-align: middle;
                }

                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.95rem;
                    flex-shrink: 0;
                    overflow: hidden;
                }

                .user-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .user-info {
                    min-width: 0;
                }

                .user-name {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 0.95rem;
                }

                .user-email {
                    font-size: 0.8rem;
                    color: #64748b;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .role-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .role-badge.admin {
                    background: #dbeafe;
                    color: #1e40af;
                }

                .role-badge.customer {
                    background: #f1f5f9;
                    color: #64748b;
                }

                .date-cell {
                    color: #334155;
                    font-size: 0.9rem;
                }

                .action-buttons {
                    display: flex;
                    gap: 8px;
                }

                .action-edit,
                .action-delete {
                    padding: 6px 14px;
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
                    text-align: center;
                    padding: 80px 20px;
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
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
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

                .btn-save:hover {
                    background: #1e293b;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
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
                    .metrics-row {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .filters-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .filter-group {
                        justify-content: space-between;
                    }

                    .users-table-container {
                        overflow-x: auto;
                    }

                    .users-table {
                        min-width: 700px;
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
