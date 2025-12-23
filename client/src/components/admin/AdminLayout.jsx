import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logger } from '../../utils/logger';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const sidebarRef = useRef(null);

    const isActive = (path) => location.pathname.includes(path);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobileOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                const menuToggle = event.target.closest('.menu-toggle');
                if (!menuToggle) {
                    setIsMobileOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileOpen]);

    // Close sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/auth');
        } catch (error) {
            logger.error(error);
        }
    };

    const navContent = (
        <>
            <div className="nav-group">
                <span className="nav-label">Management</span>
                <Link
                    to="/admin/orders"
                    className={`nav-link ${isActive('orders') ? 'active' : ''}`}
                >
                    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Orders
                </Link>
                <Link
                    to="/admin/products"
                    className={`nav-link ${isActive('products') ? 'active' : ''}`}
                >
                    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Inventory
                </Link>
                <Link
                    to="/admin/users"
                    className={`nav-link ${isActive('users') ? 'active' : ''}`}
                >
                    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Users
                </Link>
                <Link
                    to="/admin/coupons"
                    className={`nav-link ${isActive('coupons') ? 'active' : ''}`}
                >
                    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Coupons
                </Link>
            </div>

            <div className="nav-group secondary">
                <Link to="/" className="nav-link">
                    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Back to Shop
                </Link>
                <button onClick={handleLogout} className="nav-link logout-btn">
                    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <div className="admin-layout">
            {/* MOBILE HEADER */}
            <header className="mobile-header">
                <div className="logo-area">Frioo Admin</div>
                <button className="menu-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    {isMobileOpen ? (
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </header>

            {/* SIDEBAR */}
            <aside ref={sidebarRef} className={`admin-sidebar ${isMobileOpen ? 'open' : ''} ${isDesktopCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="brand-logo">Frioo Admin</h2>
                </div>
                <nav className="sidebar-nav">
                    {navContent}
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className={`admin-content ${isDesktopCollapsed ? 'expanded' : ''}`}>
                {/* Desktop Toggle Button */}
                <button
                    className="desktop-toggle-btn"
                    onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                    title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isDesktopCollapsed ? (
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    ) : (
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    )}
                </button>
                <Outlet />
            </main>

            {/* OVERLAY */}
            {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>}

            <style>{`
                .admin-layout {
                    display: flex;
                    min-height: 100vh;
                    background: #f8fafc;
                    font-family: 'Inter', sans-serif;
                }

                /* SIDEBAR STYLES */
                .admin-sidebar {
                    width: 280px;
                    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    height: 100vh;
                    z-index: 50;
                    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
                }

                .admin-sidebar.collapsed {
                    width: 80px;
                }

                .sidebar-header {
                    padding: 32px 24px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    transition: padding 0.3s;
                }

                .admin-sidebar.collapsed .sidebar-header {
                    padding: 24px 16px;
                }

                .brand-logo {
                    font-family: 'Playfair Display', serif;
                    font-size: 1.75rem;
                    margin: 0;
                    color: #fff;
                    letter-spacing: 0.5px;
                    font-weight: 700;
                    opacity: 1;
                    transition: opacity 0.3s;
                }

                .admin-sidebar.collapsed .brand-logo {
                    opacity: 0;
                    pointer-events: none;
                }

                .sidebar-nav {
                    padding: 32px 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                    transition: padding 0.3s;
                }

                .admin-sidebar.collapsed .sidebar-nav {
                    padding: 32px 12px;
                }

                .nav-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .nav-label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: #94a3b8;
                    margin-bottom: 12px;
                    padding-left: 12px;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    opacity: 1;
                    transition: opacity 0.3s;
                }

                .admin-sidebar.collapsed .nav-label {
                    opacity: 0;
                    height: 0;
                    margin: 0;
                    overflow: hidden;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px 16px;
                    color: #cbd5e1;
                    text-decoration: none;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    font-weight: 500;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    border: none;
                    background: transparent;
                    width: 100%;
                    cursor: pointer;
                    text-align: left;
                    position: relative;
                    overflow: hidden;
                }

                .admin-sidebar.collapsed .nav-link {
                    padding: 14px;
                    justify-content: center;
                }

                .admin-sidebar.collapsed .nav-link span:not(.icon) {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0,0,0,0);
                    white-space: nowrap;
                    border-width: 0;
                }

                .nav-link:hover {
                    background: rgba(255,255,255,0.08);
                    color: #fff;
                    transform: translateX(4px);
                }

                .nav-link.active {
                    background: linear-gradient(135deg, #C5A065 0%, #a67c52 100%);
                    color: #fff;
                    font-weight: 600;
                    box-shadow: 0 4px 16px rgba(197, 160, 101, 0.4);
                }

                .icon { 
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                    stroke-width: 2;
                }
                
                .nav-group.secondary { 
                    margin-top: auto;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255,255,255,0.08);
                }
                
                .logout-btn { 
                    color: #fca5a5;
                }
                
                .logout-btn:hover { 
                    background: rgba(248, 113, 113, 0.15);
                    color: #ef4444;
                }

                /* MAIN CONTENT */
                .admin-content {
                    flex: 1;
                    margin-left: 280px;
                    padding: 48px 56px;
                    overflow-y: auto;
                    height: 100vh;
                    max-width: 100%;
                    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }

                .admin-content.expanded {
                    margin-left: 80px;
                }

                /* Desktop Toggle Button */
                .desktop-toggle-btn {
                    position: fixed;
                    top: 24px;
                    left: 292px;
                    width: 36px;
                    height: 36px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 60;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }

                .desktop-toggle-btn:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
                }

                .admin-content.expanded .desktop-toggle-btn {
                    left: 92px;
                }

                .desktop-toggle-btn svg {
                    width: 18px;
                    height: 18px;
                    color: #475569;
                }

                /* Better base styles for admin pages */
                .admin-content .admin-page {
                    max-width: 1600px;
                    margin: 0 auto;
                }

                /* MOBILE STYLES */
                .mobile-header { display: none; }
                
                @media (max-width: 1024px) {
                    .desktop-toggle-btn {
                        display: none;
                    }

                    .admin-sidebar {
                        width: 280px !important;
                        transform: translateX(-100%);
                    }
                    .admin-sidebar.open {
                        transform: translateX(0);
                    }
                    .admin-content {
                        margin-left: 0;
                        padding: 96px 24px 24px;
                    }

                    .mobile-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 20px 24px;
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                        color: white;
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 40;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
                    }
                    
                    .logo-area { 
                        font-family: 'Playfair Display', serif;
                        font-size: 1.5rem;
                        font-weight: 700;
                    }
                    
                    .menu-toggle {
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        padding: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 8px;
                        transition: background 0.2s;
                    }

                    .menu-toggle:hover {
                        background: rgba(255,255,255,0.1);
                    }

                    .menu-toggle svg {
                        width: 24px;
                        height: 24px;
                    }
                    
                    .sidebar-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0,0,0,0.6);
                        z-index: 45;
                        backdrop-filter: blur(2px);
                    }
                }

                @media (max-width: 768px) {
                    .admin-content {
                        padding: 88px 16px 16px;
                    }
                }
            `}</style>
        </div>
    );
}