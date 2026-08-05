import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { creditsApi } from '../../../lib/creditsApi';
import { logger } from '../../../utils/logger';
import { rupees } from '../../../utils/creditFormat';
import { AdminPage, MetricCard, AdminErrorState, AdminTable } from '../../../components/admin/ui';

export default function CreditsDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            setMetrics(await creditsApi.metrics());
        } catch (err) {
            logger.error('Credit metrics failed:', err);
            setLoadError(err.message || 'Could not load credit metrics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    if (loadError) {
        return (
            <AdminPage title="Frioo Credits" subtitle="Prepaid credit performance">
                <AdminErrorState message={loadError} onRetry={load} />
            </AdminPage>
        );
    }

    const m = metrics || {};
    const drift = Number(m.reconciliation_drift_rows || 0);

    return (
        <AdminPage
            title="Frioo Credits"
            subtitle="Prepaid credit performance and outstanding liability"
            metrics={
                <>
                    <MetricCard tone="success" label="Credit sales collected" value={loading ? '—' : `₹${rupees(m.total_credit_sales_paise)}`} sub="Cash taken at the counter" />
                    <MetricCard tone="warning" label="Outstanding liability" value={loading ? '—' : `₹${rupees(m.outstanding_liability_paise)}`} sub="Credits customers can still spend" />
                    <MetricCard tone="brand" label="Credits redeemed" value={loading ? '—' : `₹${rupees(m.redeemed_paise)}`} sub="Spent against orders" />
                    <MetricCard label="Bonus issued" value={loading ? '—' : `₹${rupees(m.total_bonus_paise)}`} sub="Discount at redemption, not revenue" />
                </>
            }
        >
            {drift > 0 && (
                <div className="cr-alert" role="alert">
                    <strong>Ledger drift detected on {drift} {drift === 1 ? 'account' : 'accounts'}.</strong>
                    <span> Cached balance, ledger sum and lot totals disagree. Investigate before issuing more credits.</span>
                </div>
            )}

            <div className="cr-grid">
                <section className="cr-card">
                    <h2 className="cr-card-title">Movement</h2>
                    <dl className="cr-stats">
                        <div><dt>Total credits issued</dt><dd>₹{rupees(m.total_credits_issued_paise)}</dd></div>
                        <div><dt>Redeemed online</dt><dd>₹{rupees(m.redeemed_online_paise)}</dd></div>
                        <div><dt>Redeemed in store</dt><dd>₹{rupees(m.redeemed_in_store_paise)}</dd></div>
                        <div><dt>Refunded to credits</dt><dd>₹{rupees(m.refunded_paise)}</dd></div>
                        <div><dt>Expired unused</dt><dd>₹{rupees(m.expired_paise)}</dd></div>
                    </dl>
                </section>

                <section className="cr-card">
                    <h2 className="cr-card-title">Accounts</h2>
                    <dl className="cr-stats">
                        <div><dt>Active credit accounts</dt><dd>{m.active_accounts ?? 0}</dd></div>
                        <div><dt>Suspended accounts</dt><dd>{m.suspended_accounts ?? 0}</dd></div>
                        <div><dt>Expiring within 7 days</dt><dd>₹{rupees(m.expiring_7_days_paise)}</dd></div>
                        <div><dt>Customers affected</dt><dd>{m.expiring_7_days_accounts ?? 0}</dd></div>
                    </dl>
                    <Link to="/admin/credits/accounts" className="cr-card-link">Open customer accounts</Link>
                </section>
            </div>

            <div className="cr-grid">
                <section className="cr-card">
                    <h2 className="cr-card-title">Top customers by redemption</h2>
                    <AdminTable
                        columns={[{ key: 'name', label: 'Customer' }, { key: 'amt', label: 'Redeemed', width: '140px' }]}
                        isLoading={loading}
                        isEmpty={!loading && (m.top_customers || []).length === 0}
                        emptyLabel="No redemptions yet"
                        skeletonRows={3}
                    >
                        {(m.top_customers || []).map((row, index) => (
                            <tr key={`${row.email}-${index}`}>
                                <td>{row.full_name || row.email || 'Unknown'}</td>
                                <td>₹{rupees(row.redeemed_paise)}</td>
                            </tr>
                        ))}
                    </AdminTable>
                </section>

                <section className="cr-card">
                    <h2 className="cr-card-title">Top plans</h2>
                    <AdminTable
                        columns={[
                            { key: 'plan', label: 'Plan' },
                            { key: 'count', label: 'Activations', width: '110px' },
                            { key: 'rev', label: 'Collected', width: '120px' }
                        ]}
                        isLoading={loading}
                        isEmpty={!loading && (m.top_plans || []).length === 0}
                        emptyLabel="No activations yet"
                        skeletonRows={3}
                    >
                        {(m.top_plans || []).map((row, index) => (
                            <tr key={`${row.code}-${row.version}-${index}`}>
                                <td>{row.name} <span className="cr-muted">v{row.version}</span></td>
                                <td>{row.activations}</td>
                                <td>₹{rupees(row.revenue_paise)}</td>
                            </tr>
                        ))}
                    </AdminTable>
                </section>
            </div>

            <style>{`
                .cr-alert { display: flex; flex-wrap: wrap; gap: 4px; padding: var(--fr-s4); margin-bottom: var(--fr-s5); background: #FDF3F2; border: 1px solid #E8B4AE; border-radius: 8px; font-size: var(--fr-fs-caption); color: #7A2E25; }
                .cr-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--fr-s5); margin-bottom: var(--fr-s5); }
                .cr-card { padding: var(--fr-s5); background: var(--adm-surface); border: 1px solid var(--adm-line); border-radius: 12px; }
                .cr-card-title { margin: 0 0 var(--fr-s4); font-family: var(--fr-font-sans); font-size: 0.9375rem; font-weight: 700; color: var(--adm-text); }
                .cr-card-link { display: inline-block; margin-top: var(--fr-s4); font-size: var(--fr-fs-caption); font-weight: 600; color: var(--fr-brand); text-decoration: none; }
                .cr-card-link:hover { text-decoration: underline; }
                .cr-stats { display: flex; flex-direction: column; gap: var(--fr-s3); margin: 0; }
                .cr-stats > div { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fr-s3); }
                .cr-stats dt { font-size: var(--fr-fs-caption); color: var(--adm-text-2); }
                .cr-stats dd { margin: 0; font-family: var(--fr-font-sans); font-size: 0.9375rem; font-weight: 700; color: var(--adm-text); font-variant-numeric: tabular-nums; }
                .cr-muted { color: var(--adm-text-2); font-size: var(--fr-fs-label); }
                @media (max-width: 900px) { .cr-grid { grid-template-columns: 1fr; } }
            `}</style>
        </AdminPage>
    );
}
