import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { logger } from '../../utils/logger';
import { API_BASE_URL } from '../../config/constants';
import { fetchWithTimeout } from '../../lib/http';

const REFRESH_MS = 60 * 1000;

const formatUptime = (seconds) => {
    if (!Number.isFinite(seconds)) return '—';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

export default function SystemPanel() {
    const [system, setSystem] = useState(null);
    const [failed, setFailed] = useState(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const load = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetchWithTimeout(`${API_BASE_URL}/api/admin/system`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error('system fetch failed');

            if (mountedRef.current) {
                setSystem(json.data);
                setFailed(false);
            }
        } catch (err) {
            logger.error('System panel load failed:', err);
            if (mountedRef.current) setFailed(true);
        }
    }, []);

    useEffect(() => {
        void load();
        const timer = setInterval(() => { void load(); }, REFRESH_MS);
        return () => clearInterval(timer);
    }, [load]);

    if (failed) {
        return (
            <section className="adm-system">
                <h2 className="adm-system-title">System</h2>
                <p className="adm-system-down">API metrics are unreachable right now.</p>
                <style>{systemStyles}</style>
            </section>
        );
    }

    if (!system) return null;

    const { build, process: proc, requests, dependencies } = system;

    const items = [
        { key: 'api', label: 'API health', value: dependencies.database === 'ok' ? 'Healthy' : 'Degraded', tone: dependencies.database === 'ok' ? 'ok' : 'bad' },
        { key: 'uptime', label: 'Server uptime', value: formatUptime(proc.processUptimeSeconds) },
        { key: 'memory', label: 'Memory', value: `${proc.memory.heapUsedMb} MB` },
        { key: 'requests', label: 'Requests', value: requests.totalRequests.toLocaleString() },
        { key: 'latency', label: 'Avg / p95', value: `${Math.round(requests.avgResponseMs)} / ${Math.round(requests.p95ResponseMs)} ms` },
        { key: 'errors', label: 'Server errors', value: requests.errors, tone: requests.errors > 0 ? 'bad' : undefined },
        { key: 'version', label: 'Build', value: build.commitShort ? `${build.version} · ${build.commitShort}` : build.version },
        { key: 'deployed', label: 'Deployed', value: build.deployedAt ? new Date(Number(build.deployedAt) || build.deployedAt).toLocaleString() : build.environment }
    ];

    return (
        <section className="adm-system">
            <h2 className="adm-system-title">System</h2>
            <div className="adm-system-grid">
                {items.map(({ key, label, value, tone }) => (
                    <div className="adm-system-item" key={key}>
                        <span className="adm-system-label">{label}</span>
                        <span className={`adm-system-value${tone ? ` adm-system-value--${tone}` : ''}`}>{value}</span>
                    </div>
                ))}
            </div>
            <p className="adm-system-note">Counters are per server instance and reset when it restarts.</p>
            <style>{systemStyles}</style>
        </section>
    );
}

const systemStyles = `
    .adm-system { background: var(--adm-surface, #fff); border: 1px solid var(--adm-line, #e2e8e5); border-radius: 12px; padding: 20px; margin-top: 24px; }
    .adm-system-title { font-family: var(--fr-font-sans); font-size: 1.0625rem; font-weight: 700; line-height: 1.3; margin: 0 0 16px; color: var(--adm-text, #16211b); }
    .adm-system-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .adm-system-item { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .adm-system-label { font-family: var(--fr-font-sans); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--adm-text-2, #55635c); }
    .adm-system-value { font-family: var(--fr-font-sans); font-size: 1rem; font-weight: 700; color: var(--adm-text, #16211b); overflow-wrap: anywhere; }
    .adm-system-value--ok { color: #1B4D3E; }
    .adm-system-value--bad { color: #B23A2E; }
    .adm-system-note { font-family: var(--fr-font-sans); font-size: 0.75rem; font-weight: 500; color: var(--adm-text-2, #55635c); margin: 16px 0 0; }
    .adm-system-down { font-family: var(--fr-font-sans); font-size: 0.875rem; font-weight: 500; color: #B23A2E; margin: 0; }
    @media (max-width: 900px) { .adm-system-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;
