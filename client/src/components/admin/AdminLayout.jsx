import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
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
            { to: '/admin/coupons', label: 'Coupons', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
            { to: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
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

    const [lastPathname, setLastPathname] = useState(location.pathname);
    if (location.pathname !== lastPathname) {
        setLastPathname(location.pathname);
        setIsMobileOpen(false);
    }

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
                <button className="menu-toggle" onClick={() => setIsMobileOpen(v => !v)} aria-label="Toggle menu" aria-expanded={isMobileOpen}>
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
                    <span className="brand-dot" aria-hidden="true" />
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
                                    aria-current={isActive(to.split('/').pop()) ? 'page' : undefined}
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
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                    background: var(--adm-canvas);
                    font-family: var(--fr-font-sans);
                }

                .sidebar {
                    width: 260px;
                    background: var(--adm-sidebar);
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    z-index: 50;
                    transition: width var(--fr-dur-base) var(--fr-ease-standard), transform var(--fr-dur-base) var(--fr-ease-standard);
                    overflow: hidden;
                }

                .sidebar.collapsed { width: 72px; }

                .sidebar-brand {
                    padding: var(--fr-s6) var(--fr-s5);
                    border-bottom: 1px solid var(--adm-sidebar-line);
                    display: flex;
                    align-items: center;
                    gap: var(--fr-s2);
                    flex-shrink: 0;
                }

                .brand-text {
                    font-family: var(--fr-font-display);
                    font-size: var(--fr-fs-title);
                    font-weight: var(--fr-fw-bold);
                    line-height: var(--fr-lh-snug);
                    color: var(--fr-on-brand);
                    letter-spacing: var(--fr-track-headline);
                    white-space: nowrap;
                    transition: opacity var(--fr-dur-quick) var(--fr-ease-standard);
                }

                .sidebar.collapsed .brand-text { opacity: 0; width: 0; overflow: hidden; }

                .brand-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--fr-warm);
                    border-radius: 50%;
                    flex-shrink: 0;
                    transition: opacity var(--fr-dur-quick) var(--fr-ease-standard);
                }

                .sidebar.collapsed .brand-dot { opacity: 0; }

                .sidebar-nav {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: var(--fr-s5) var(--fr-s3);
                    display: flex;
                    flex-direction: column;
                    gap: var(--fr-s6);
                    scrollbar-width: none;
                }

                .sidebar-nav::-webkit-scrollbar { display: none; }

                .nav-group { display: flex; flex-direction: column; gap: 2px; }

                .nav-group-label {
                    font-family: var(--fr-font-sans);
                    font-size: var(--fr-fs-eyebrow);
                    font-weight: var(--fr-fw-medium);
                    line-height: var(--fr-lh-snug);
                    text-transform: uppercase;
                    letter-spacing: var(--fr-track-eyebrow);
                    color: var(--adm-sidebar-muted);
                    padding: 0 var(--fr-s3);
                    margin-bottom: var(--fr-s2);
                    white-space: nowrap;
                    transition: opacity var(--fr-dur-quick) var(--fr-ease-standard);
                }

                .sidebar.collapsed .nav-group-label { opacity: 0; height: 0; margin: 0; overflow: hidden; }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: var(--fr-s3);
                    padding: 11px var(--fr-s3);
                    color: var(--adm-sidebar-text);
                    text-decoration: none;
                    border-radius: var(--fr-r-card);
                    font-family: var(--fr-font-sans);
                    font-size: var(--fr-fs-control);
                    font-weight: var(--fr-fw-regular);
                    line-height: var(--fr-lh-control);
                    transition: background var(--fr-dur-quick) var(--fr-ease-standard), color var(--fr-dur-quick) var(--fr-ease-standard);
                    border: none;
                    background: transparent;
                    width: 100%;
                    cursor: pointer;
                    text-align: left;
                    white-space: nowrap;
                    overflow: hidden;
                }

                .nav-link:hover {
                    background: var(--adm-sidebar-2);
                    color: var(--fr-on-brand);
                }

                .nav-link:focus-visible {
                    outline: 2px solid var(--fr-brand-tint);
                    outline-offset: -2px;
                }

                .nav-link.active {
                    background: var(--fr-brand);
                    color: var(--fr-on-brand);
                    font-weight: var(--fr-fw-medium);
                }

                .nav-icon {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                }

                .nav-label-text {
                    transition: opacity var(--fr-dur-quick) var(--fr-ease-standard), width var(--fr-dur-quick) var(--fr-ease-standard);
                    overflow: hidden;
                }

                .sidebar.collapsed .nav-label-text { opacity: 0; width: 0; }

                .sidebar-footer {
                    padding: var(--fr-s4) var(--fr-s3);
                    border-top: 1px solid var(--adm-sidebar-line);
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    gap: var(--fr-s1);
                }

                .admin-profile {
                    display: flex;
                    align-items: center;
                    gap: var(--fr-s3);
                    padding: var(--fr-s3);
                    border-radius: var(--fr-r-card);
                    background: var(--adm-sidebar-2);
                    margin-bottom: var(--fr-s2);
                    overflow: hidden;
                }

                .sidebar.collapsed .admin-profile {
                    padding: var(--fr-s2);
                    justify-content: center;
                }

                .admin-avatar {
                    width: 36px;
                    height: 36px;
                    background: var(--fr-brand);
                    color: var(--fr-on-brand);
                    border-radius: var(--fr-r-card);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--fr-font-sans);
                    font-weight: var(--fr-fw-bold);
                    font-size: var(--fr-fs-caption);
                    line-height: var(--fr-lh-snug);
                    flex-shrink: 0;
                }

                .admin-info { overflow: hidden; transition: opacity var(--fr-dur-quick) var(--fr-ease-standard), width var(--fr-dur-quick) var(--fr-ease-standard); }
                .sidebar.collapsed .admin-info { opacity: 0; width: 0; }

                .admin-name {
                    font-family: var(--fr-font-sans);
                    font-size: var(--fr-fs-caption);
                    font-weight: var(--fr-fw-medium);
                    line-height: var(--fr-lh-normal);
                    color: #E7ECE8;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .admin-role {
                    font-family: var(--fr-font-sans);
                    font-size: var(--fr-fs-label);
                    font-weight: var(--fr-fw-regular);
                    line-height: var(--fr-lh-snug);
                    color: var(--adm-sidebar-muted);
                    white-space: nowrap;
                }

                .footer-links { display: flex; flex-direction: column; gap: 2px; }

                .footer-link { color: var(--adm-sidebar-muted); }
                .footer-link:hover { color: var(--adm-sidebar-text); background: var(--adm-sidebar-2); }

                .logout-btn { color: var(--fr-warm-tint); }
                .logout-btn:hover { background: rgba(200,86,47,0.18); color: #F6E2D8; }

                .admin-main {
                    flex: 1;
                    margin-left: 260px;
                    padding: var(--fr-s8) var(--fr-s9);
                    overflow-y: auto;
                    height: 100vh;
                    transition: margin-left var(--fr-dur-base) var(--fr-ease-standard);
                    position: relative;
                }

                .admin-main.main-expanded { margin-left: 72px; }

                .collapse-btn {
                    position: fixed;
                    top: 22px;
                    left: 272px;
                    width: 32px;
                    height: 32px;
                    background: var(--adm-surface);
                    border: 1px solid var(--adm-border);
                    border-radius: var(--fr-r-control);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 60;
                    transition: left var(--fr-dur-base) var(--fr-ease-standard), box-shadow var(--fr-dur-quick) var(--fr-ease-standard);
                    box-shadow: var(--fr-elev-1);
                }

                .admin-main.main-expanded .collapse-btn { left: 84px; }

                .collapse-btn:hover {
                    box-shadow: var(--fr-elev-2);
                    border-color: var(--adm-border-strong);
                }

                .collapse-btn:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }

                .collapse-btn svg { width: 15px; height: 15px; color: var(--adm-text-2); }

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
                        padding: 88px var(--fr-s5) var(--fr-s5);
                    }

                    .mobile-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: var(--fr-s4) var(--fr-s5);
                        background: var(--adm-sidebar);
                        color: var(--fr-on-brand);
                        position: fixed;
                        top: 0; left: 0; right: 0;
                        z-index: 40;
                        box-shadow: var(--fr-elev-2);
                    }

                    .mobile-brand {
                        font-family: var(--fr-font-display);
                        font-size: var(--fr-fs-title);
                        font-weight: var(--fr-fw-bold);
                        line-height: var(--fr-lh-snug);
                        letter-spacing: var(--fr-track-headline);
                    }

                    .menu-toggle {
                        background: none;
                        border: none;
                        color: var(--fr-on-brand);
                        cursor: pointer;
                        padding: var(--fr-s1);
                        border-radius: var(--fr-r-control);
                        display: flex;
                        align-items: center;
                        transition: background var(--fr-dur-quick) var(--fr-ease-standard);
                    }

                    .menu-toggle:hover { background: var(--adm-sidebar-2); }
                    .menu-toggle:focus-visible { outline: 2px solid var(--fr-brand-tint); outline-offset: 2px; }
                    .menu-toggle svg { width: 22px; height: 22px; }

                    .sidebar-overlay {
                        position: fixed;
                        inset: 0;
                        background: var(--fr-scrim);
                        z-index: 45;
                        backdrop-filter: blur(2px);
                    }
                }

                @media (max-width: 768px) {
                    .admin-main { padding: 80px var(--fr-s4) var(--fr-s4); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .sidebar, .admin-main, .collapse-btn, .nav-link, .brand-text,
                    .brand-dot, .nav-group-label, .nav-label-text, .admin-info, .menu-toggle {
                        transition: none;
                    }
                }
            `}</style>
        </div>
    );
}
