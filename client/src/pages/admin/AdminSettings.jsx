import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { notify } from '../../lib/feedbackStore';
import { logger } from '../../utils/logger';
import { API_BASE_URL, PRODUCT_CATEGORIES } from '../../config/constants';
import { fetchWithTimeout } from '../../lib/http';
import { AdminPage, AdminErrorState } from '../../components/admin/ui';
import { formatHour } from '../../utils/storeHours';
import { useAdminPush } from '../../hooks/useAdminPush';
import { relativeTime } from '../../utils/relativeTime';

const SECTIONS = PRODUCT_CATEGORIES.filter((category) => category.dbValue !== null);

const HOURS = Array.from({ length: 25 }, (_, hour) => hour);

const describeDevice = (agent) => {
    if (!agent) return 'Unknown device';
    if (/iphone|ipad/i.test(agent)) return 'iPhone or iPad';
    if (/android/i.test(agent)) return 'Android device';
    if (/macintosh/i.test(agent)) return 'Mac';
    if (/windows/i.test(agent)) return 'Windows PC';
    return 'Browser';
};

export default function AdminSettings() {
    const push = useAdminPush();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [saving, setSaving] = useState(false);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const authorizedFetch = useCallback(async (path, options = {}) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');

        return fetchWithTimeout(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
                ...options.headers
            }
        });
    }, []);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await authorizedFetch('/api/admin/settings');
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to load settings');
            if (mountedRef.current) setSettings(json.data.settings);
        } catch (err) {
            logger.error('Admin settings load failed:', err);
            if (mountedRef.current) setLoadError('We could not load store settings. Check your connection and try again.');
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [authorizedFetch]);

    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    const persist = async (updates, successMessage) => {
        if (saving) return;
        setSaving(true);
        try {
            const res = await authorizedFetch('/api/admin/settings', {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error?.message || 'Update failed');

            if (mountedRef.current) setSettings(json.data.settings);
            notify.success(successMessage);
        } catch (err) {
            notify.error(err.message || 'Could not save settings');
        } finally {
            if (mountedRef.current) setSaving(false);
        }
    };

    const toggleSection = (dbValue) => {
        const current = settings.unavailable_categories || [];
        const next = current.includes(dbValue)
            ? current.filter((value) => value !== dbValue)
            : [...current, dbValue];
        persist({ unavailable_categories: next }, next.includes(dbValue) ? 'Section marked unavailable' : 'Section is available again');
    };

    if (loading) return <AdminPage title="Store settings"><p className="adm-settings-loading">Loading settings…</p></AdminPage>;
    if (loadError) return <AdminPage title="Store settings"><AdminErrorState message={loadError} onRetry={loadSettings} /></AdminPage>;
    if (!settings) return null;

    const unavailable = settings.unavailable_categories || [];

    return (
        <AdminPage title="Store settings" subtitle="Availability, opening hours and delivery pricing">
            <div className="adm-settings">
                <section className="adm-card">
                    <div className="adm-card-head">
                        <h2 className="adm-card-title">Order notifications</h2>
                        <p className="adm-card-sub">Get an alert on this device the moment a customer places an order, even when the admin app is closed.</p>
                    </div>

                    {!push.supported && (
                        <p className="adm-push-note">This browser cannot receive push notifications. Install the admin app to your home screen, or use Chrome, Edge or Safari 16.4 and later.</p>
                    )}

                    {push.supported && (
                        <>
                            <div className="adm-push-row">
                                <span className={`adm-push-state adm-push-state--${push.subscribed ? 'on' : 'off'}`}>
                                    {push.subscribed ? 'On for this device' : 'Off for this device'}
                                </span>
                                {push.subscribed ? (
                                    <button type="button" className="adm-pill adm-pill-off" onClick={push.disable} disabled={push.busy}>
                                        {push.busy ? 'Working…' : 'Turn off'}
                                    </button>
                                ) : (
                                    <button type="button" className="adm-pill" onClick={push.enable} disabled={push.busy}>
                                        {push.busy ? 'Working…' : 'Turn on'}
                                    </button>
                                )}
                            </div>

                            {push.permission === 'denied' && (
                                <p className="adm-push-note">Notifications are blocked for this site in your browser settings. Allow them there first, then turn this on.</p>
                            )}
                            {push.error && <p className="adm-push-error" role="alert">{push.error}</p>}

                            {push.devices.length > 0 && (
                                <ul className="adm-devices">
                                    {push.devices.map((device) => (
                                        <li className="adm-device" key={device.endpoint}>
                                            <span className="adm-device-copy">
                                                <span className="adm-device-name">{describeDevice(device.user_agent)}</span>
                                                <span className="adm-device-meta">Last active {relativeTime(device.last_seen_at)}</span>
                                            </span>
                                            <button type="button" className="adm-device-remove" onClick={() => push.removeDevice(device.endpoint)} disabled={push.busy}>
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </section>

                <section className="adm-card">
                    <div className="adm-card-head">
                        <h2 className="adm-card-title">Whole store</h2>
                        <p className="adm-card-sub">Turning this off stops every new order straight away.</p>
                    </div>
                    <label className="adm-switch">
                        <input
                            type="checkbox"
                            checked={Boolean(settings.is_open)}
                            disabled={saving}
                            onChange={(event) => persist(
                                { is_open: event.target.checked },
                                event.target.checked ? 'Store is open' : 'Store is closed'
                            )}
                        />
                        <span className="adm-switch-track" aria-hidden="true"><span className="adm-switch-thumb" /></span>
                        <span className="adm-switch-label">{settings.is_open ? 'Open for orders' : 'Closed'}</span>
                    </label>

                    <label className="adm-field">
                        <span className="adm-label">Message shown while closed</span>
                        <input
                            type="text"
                            className="adm-input"
                            maxLength={200}
                            defaultValue={settings.closed_message || ''}
                            disabled={saving}
                            onBlur={(event) => {
                                const value = event.target.value.trim();
                                if (value !== (settings.closed_message || '')) {
                                    persist({ closed_message: value || null }, 'Closed message updated');
                                }
                            }}
                        />
                    </label>
                </section>

                <section className="adm-card">
                    <div className="adm-card-head">
                        <h2 className="adm-card-title">Sections</h2>
                        <p className="adm-card-sub">Switch a section off when you cannot supply it today. Customers still see the products, but cannot order them.</p>
                    </div>
                    <ul className="adm-sections">
                        {SECTIONS.map(({ slug, label, dbValue }) => {
                            const off = unavailable.includes(dbValue);
                            return (
                                <li key={slug} className="adm-section-row">
                                    <span className="adm-section-name">{label}</span>
                                    <button
                                        type="button"
                                        className={`adm-pill${off ? ' adm-pill-off' : ''}`}
                                        disabled={saving}
                                        aria-pressed={off}
                                        onClick={() => toggleSection(dbValue)}
                                    >
                                        {off ? 'Unavailable' : 'Available'}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section className="adm-card">
                    <div className="adm-card-head">
                        <h2 className="adm-card-title">Opening hours</h2>
                        <p className="adm-card-sub">Orders are only accepted between these hours, India time.</p>
                    </div>
                    <div className="adm-hours">
                        <label className="adm-field">
                            <span className="adm-label">Opens</span>
                            <select
                                className="adm-input"
                                value={settings.opens_at_hour}
                                disabled={saving}
                                onChange={(event) => persist({ opens_at_hour: Number(event.target.value) }, 'Opening hour updated')}
                            >
                                {HOURS.slice(0, 24).map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
                            </select>
                        </label>
                        <label className="adm-field">
                            <span className="adm-label">Closes</span>
                            <select
                                className="adm-input"
                                value={settings.closes_at_hour}
                                disabled={saving}
                                onChange={(event) => persist({ closes_at_hour: Number(event.target.value) }, 'Closing hour updated')}
                            >
                                {HOURS.slice(1).map((hour) => <option key={hour} value={hour}>{hour === 24 ? 'midnight' : formatHour(hour)}</option>)}
                            </select>
                        </label>
                    </div>
                </section>

                <section className="adm-card">
                    <div className="adm-card-head">
                        <h2 className="adm-card-title">Delivery charge</h2>
                        <p className="adm-card-sub">Charged on delivery orders below the free threshold. Pickup is never charged.</p>
                    </div>
                    <div className="adm-hours">
                        <label className="adm-field">
                            <span className="adm-label">Delivery fee (₹)</span>
                            <input
                                type="number"
                                min="0"
                                className="adm-input"
                                defaultValue={settings.delivery_fee_cents / 100}
                                disabled={saving}
                                onBlur={(event) => {
                                    const rupees = Number(event.target.value);
                                    if (!Number.isFinite(rupees) || rupees < 0) return;
                                    const cents = Math.round(rupees * 100);
                                    if (cents !== settings.delivery_fee_cents) persist({ delivery_fee_cents: cents }, 'Delivery fee updated');
                                }}
                            />
                        </label>
                        <label className="adm-field">
                            <span className="adm-label">Free delivery above (₹)</span>
                            <input
                                type="number"
                                min="0"
                                className="adm-input"
                                defaultValue={settings.free_delivery_threshold_cents / 100}
                                disabled={saving}
                                onBlur={(event) => {
                                    const rupees = Number(event.target.value);
                                    if (!Number.isFinite(rupees) || rupees < 0) return;
                                    const cents = Math.round(rupees * 100);
                                    if (cents !== settings.free_delivery_threshold_cents) persist({ free_delivery_threshold_cents: cents }, 'Free delivery threshold updated');
                                }}
                            />
                        </label>
                    </div>
                </section>
            </div>

            <style>{`
                .adm-settings { display: grid; gap: var(--fr-s5); max-width: 760px; }
                .adm-settings-loading { font-family: var(--fr-font-sans); color: var(--adm-text-2, #55635c); }
                .adm-card { background: var(--adm-surface, #fff); border: 1px solid var(--adm-line, #e2e8e5); border-radius: 12px; padding: var(--fr-s5); display: flex; flex-direction: column; gap: var(--fr-s4); }
                .adm-card-head { display: flex; flex-direction: column; gap: 4px; }
                .adm-card-title { font-family: var(--fr-font-sans); font-size: 1.0625rem; font-weight: 700; line-height: 1.3; margin: 0; color: var(--adm-text, #16211b); }
                .adm-card-sub { font-family: var(--fr-font-sans); font-size: 0.8125rem; font-weight: 500; line-height: 1.5; margin: 0; color: var(--adm-text-2, #55635c); }
                .adm-switch { display: flex; align-items: center; gap: var(--fr-s3); cursor: pointer; }
                .adm-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
                .adm-switch-track { width: 46px; height: 26px; border-radius: 999px; background: var(--adm-line, #cbd5d0); position: relative; flex-shrink: 0; transition: background 180ms ease; }
                .adm-switch-thumb { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform 180ms ease; }
                .adm-switch input:checked + .adm-switch-track { background: #1B4D3E; }
                .adm-switch input:checked + .adm-switch-track .adm-switch-thumb { transform: translateX(20px); }
                .adm-switch input:focus-visible + .adm-switch-track { outline: 2px solid #1B4D3E; outline-offset: 3px; }
                .adm-switch-label { font-family: var(--fr-font-sans); font-size: 0.9375rem; font-weight: 600; color: var(--adm-text, #16211b); }
                .adm-field { display: flex; flex-direction: column; gap: 6px; }
                .adm-hours { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--fr-s4); }
                .adm-sections { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--fr-s2); }
                .adm-section-row { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s4); padding: var(--fr-s3) 0; border-bottom: 1px solid var(--adm-line, #eef2f0); }
                .adm-section-row:last-child { border-bottom: none; }
                .adm-section-name { font-family: var(--fr-font-sans); font-size: 0.9375rem; font-weight: 600; color: var(--adm-text, #16211b); }
                .adm-pill { min-height: 40px; padding: 0 var(--fr-s4); border-radius: 999px; border: 1px solid #1B4D3E; background: #E3EFE7; color: #1B4D3E; font-family: var(--fr-font-sans); font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
                .adm-pill-off { background: #F6E2D8; border-color: #B23A2E; color: #B23A2E; }
                .adm-pill:disabled { opacity: 0.6; cursor: default; }
                .adm-pill:focus-visible { outline: 2px solid #1B4D3E; outline-offset: 3px; }
                .adm-push-row { display: flex; align-items: center; justify-content: space-between; gap: var(--fr-s4); }
                .adm-push-state { font-family: var(--fr-font-sans); font-size: 0.875rem; font-weight: 600; }
                .adm-push-state--on { color: #1B4D3E; }
                .adm-push-state--off { color: var(--adm-text-2, #55635c); }
                .adm-push-note { font-family: var(--fr-font-sans); font-size: 0.8125rem; font-weight: 500; line-height: 1.55; color: var(--adm-text-2, #55635c); margin: 0; }
                .adm-push-error { font-family: var(--fr-font-sans); font-size: 0.8125rem; font-weight: 600; line-height: 1.55; color: #B23A2E; margin: 0; }
                .adm-devices { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
                .adm-device { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; background: var(--adm-surface-2, #f4f8f5); border-radius: 10px; }
                .adm-device-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
                .adm-device-name { font-family: var(--fr-font-sans); font-size: 0.875rem; font-weight: 600; color: var(--adm-text, #16211b); }
                .adm-device-meta { font-family: var(--fr-font-sans); font-size: 0.75rem; font-weight: 500; color: var(--adm-text-2, #55635c); }
                .adm-device-remove { background: none; border: none; padding: 6px; font-family: var(--fr-font-sans); font-size: 0.75rem; font-weight: 600; color: #B23A2E; cursor: pointer; }
                .adm-device-remove:hover:not(:disabled) { text-decoration: underline; }
                .adm-device-remove:disabled { opacity: 0.5; cursor: default; }
                .adm-device-remove:focus-visible { outline: 2px solid #1B4D3E; outline-offset: 2px; border-radius: 4px; }
                @media (max-width: 640px) { .adm-hours { grid-template-columns: 1fr; } }
            `}</style>
        </AdminPage>
    );
}
