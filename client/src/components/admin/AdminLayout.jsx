import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';

const NAV_ITEMS = [
    {
        group: 'Overview',
        links: [
            { to: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }
        ]
    },
    {
        group: 'Management',
        links: [
            { to: '/admin/orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
            { to: '/admin/products', label: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { to: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { to: '/admin/coupons', label: 'Coupons', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' }
        ]
    }
];

export default function AdminLayout() {
    const location = useLocation();
    const { signOut, profile } = useAuth();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const sidebarRef = useRef(null);

    const isActive = (path) => location.pathname.includes(path);

    useEffect(() => {
        const handleOutside = (e) => {
            if (isMobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                if (!e.target.closest('.menu-toggle')) setIsMobileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [isMobileOpen]);

    useEffect(() => { setIsMobileOpen(false); }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (err) {
            logger.error(err);
        }
    };

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'A';

    return (
        <div className="admin-layout">
            <header className="mobile-header">
                <div className="mobile-brand">Frioo Admin</div>
                <button className="menu-toggle" onClick={() => setIsMobileOpen(v => !v)} aria-label="Toggle menu">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {isMobileOpen
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        }
                    </svg>
                </button>
            </header>

            <aside ref={sidebarRef} className={`sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-brand">
                    <span className="brand-text">Frioo</span>
                    <span className="brand-dot" />
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(({ group, links }) => (
                        <div key={group} className="nav-group">
                            <span className="nav-group-label">{group}</span>
                            {links.map(({ to, label, icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`nav-link ${isActive(to.split('/').pop()) ? 'active' : ''}`}
                                    title={isCollapsed ? label : undefined}
                                >
                                    <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                                    </svg>
                                    <span className="nav-label-text">{label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    {profile && (
                        <div className="admin-profile">
                            <div className="admin-avatar">{initials}</div>
                            <div className="admin-info">
                                <div className="admin-name">{profile.full_name || 'Admin'}</div>
                                <div className="admin-role">Administrator</div>
                            </div>
                        </div>
                    )}
                    <div className="footer-links">
                        <Link to="/" className="nav-link footer-link" title={isCollapsed ? 'Back to Shop' : undefined}>
                            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <span className="nav-label-text">Back to Shop</span>
                        </Link>
                        <button onClick={handleLogout} className="nav-link logout-btn" title={isCollapsed ? 'Logout' : undefined}>
                            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="nav-label-text">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            <main className={`admin-main ${isCollapsed ? 'main-expanded' : ''}`}>
                <button
                    className="collapse-btn"
                    onClick={() => setIsCollapsed(v => !v)}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {isCollapsed
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        }
                    </svg>
                </button>
                <Outlet />
            </main>

            {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />}

            <style>{`
                * { box-sizing: border-box; }

                .admin-layout {
                    display: flex;
                    min-height: 100vh;
                    background: #f8fafc;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .sidebar {
                    width: 260px;
                    background: #0f172a;
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    z-index: 50;
                    transition: width 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1);
                    overflow: hidden;
                }

                .sidebar.collapsed { width: 72px; }

                .sidebar-brand {
                    padding: 28px 24px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }

                .brand-text {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: white;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                    transition: opacity 0.2s;
                }

                .sidebar.collapsed .brand-text { opacity: 0; width: 0; overflow: hidden; }

                .brand-dot {
                    width: 8px;
                    height: 8px;
                    background: #C5A065;
                    border-radius: 50%;
                    flex-shrink: 0;
                    transition: opacity 0.2s;
                }

                .sidebar.collapsed .brand-dot { opacity: 0; }

                .sidebar-nav {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 20px 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 28px;
                    scrollbar-width: none;
                }

                .sidebar-nav::-webkit-scrollbar { display: none; }

                .nav-group { display: flex; flex-direction: column; gap: 2px; }

                .nav-group-label {
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #475569;
                    padding: 0 12px;
                    margin-bottom: 8px;
                    white-space: nowrap;
                    transition: opacity 0.2s;
                }

                .sidebar.collapsed .nav-group-label { opacity: 0; height: 0; margin: 0; overflow: hidden; }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 11px 12px;
                    color: #94a3b8;
                    text-decoration: none;
                    border-radius: 9px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    transition: all 0.18s;
                    border: none;
                    background: transparent;
                    width: 100%;
                    cursor: pointer;
                    text-align: left;
                    white-space: nowrap;
                    overflow: hidden;
                }

                .nav-link:hover {
                    background: rgba(255,255,255,0.07);
                    color: #e2e8f0;
                }

                .nav-link.active {
                    background: linear-gradient(135deg, #C5A065, #a67c52);
                    color: white;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(197,160,101,0.35);
                }

                .nav-icon {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                }

                .nav-label-text {
                    transition: opacity 0.2s, width 0.2s;
                    overflow: hidden;
                }

                .sidebar.collapsed .nav-label-text { opacity: 0; width: 0; }

                .sidebar-footer {
                    padding: 16px 12px;
                    border-top: 1px solid rgba(255,255,255,0.08);
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .admin-profile {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.05);
                    margin-bottom: 8px;
                    overflow: hidden;
                }

                .sidebar.collapsed .admin-profile {
                    padding: 10px;
                    justify-content: center;
                }

                .admin-avatar {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, #C5A065, #a67c52);
                    color: white;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.8rem;
                    flex-shrink: 0;
                }

                .admin-info { overflow: hidden; transition: opacity 0.2s, width 0.2s; }
                .sidebar.collapsed .admin-info { opacity: 0; width: 0; }

                .admin-name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .admin-role {
                    font-size: 0.7rem;
                    color: #64748b;
                    white-space: nowrap;
                }

                .footer-links { display: flex; flex-direction: column; gap: 2px; }

                .footer-link { color: #64748b; }
                .footer-link:hover { color: #94a3b8; background: rgba(255,255,255,0.05); }

                .logout-btn { color: #f87171; }
                .logout-btn:hover { background: rgba(248,113,113,0.1); color: #fca5a5; }

                .admin-main {
                    flex: 1;
                    margin-left: 260px;
                    padding: 48px 52px;
                    overflow-y: auto;
                    height: 100vh;
                    transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1);
                    position: relative;
                }

                .admin-main.main-expanded { margin-left: 72px; }

                .collapse-btn {
                    position: fixed;
                    top: 22px;
                    left: 272px;
                    width: 32px;
                    height: 32px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 60;
                    transition: left 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
                }

                .admin-main.main-expanded .collapse-btn { left: 84px; }

                .collapse-btn:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
                    border-color: #cbd5e1;
                }

                .collapse-btn svg { width: 15px; height: 15px; color: #64748b; }

                .mobile-header { display: none; }

                @media (max-width: 1024px) {
                    .collapse-btn { display: none; }

                    .sidebar {
                        width: 260px !important;
                        transform: translateX(-100%);
                    }

                    .sidebar.mobile-open { transform: translateX(0); }

                    .admin-main {
                        margin-left: 0 !important;
                        padding: 88px 24px 24px;
                    }

                    .mobile-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 18px 24px;
                        background: #0f172a;
                        color: white;
                        position: fixed;
                        top: 0; left: 0; right: 0;
                        z-index: 40;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.2);
                    }

                    .mobile-brand {
                        font-family: 'Playfair Display', Georgia, serif;
                        font-size: 1.35rem;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                    }

                    .menu-toggle {
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        padding: 6px;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        transition: background 0.2s;
                    }

                    .menu-toggle:hover { background: rgba(255,255,255,0.1); }
                    .menu-toggle svg { width: 22px; height: 22px; }

                    .sidebar-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0,0,0,0.6);
                        z-index: 45;
                        backdrop-filter: blur(2px);
                    }
                }

                @media (max-width: 768px) {
                    .admin-main { padding: 80px 16px 16px; }
                }
            `}</style>
        </div>
    );
}
