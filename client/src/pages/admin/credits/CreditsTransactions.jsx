import { useState, useEffect, useCallback } from 'react';
import { creditsApi, newIdempotencyKey } from '../../../lib/creditsApi';
import { notify } from '../../../lib/feedbackStore';
import { logger } from '../../../utils/logger';
import {
    ENTRY_TYPES, rupees, signedRupees, formatDateTime,
    entryLabel, entryTone, downloadBlob
} from '../../../utils/creditFormat';
import { AdminPage, AdminTable, AdminModal, SearchInput, AdminErrorState } from '../../../components/admin/ui';

const PAGE_SIZE = 50;
const EMPTY_FILTERS = { q: '', entry_type: '', from: '', to: '' };

export default function CreditsTransactions() {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [page, setPage] = useState(0);
    const [data, setData] = useState({ rows: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [refundFor, setRefundFor] = useState(null);
    const [refundForm, setRefundForm] = useState({ refund_rupees: '', reason: '' });
    const [busy, setBusy] = useState(false);

    const load = useCallback(async (activeFilters, activePage) => {
        setLoading(true);
        setLoadError(null);
        try {
            setData(await creditsApi.ledger({
                ...activeFilters,
                from: activeFilters.from ? new Date(activeFilters.from).toISOString() : '',
                to: activeFilters.to ? new Date(`${activeFilters.to}T23:59:59`).toISOString() : '',
                limit: PAGE_SIZE,
                offset: activePage * PAGE_SIZE
            }));
        } catch (err) {
            logger.error('Ledger load failed:', err);
            setLoadError(err.message || 'Could not load transactions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { void load(filters, page); }, 250);
        return () => clearTimeout(timer);
    }, [filters, page, load]);

    const setFilter = (key, value) => {
        setPage(0);
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const blob = await creditsApi.exportLedgerCsv({
                ...filters,
                from: filters.from ? new Date(filters.from).toISOString() : '',
                to: filters.to ? new Date(`${filters.to}T23:59:59`).toISOString() : ''
            });
            downloadBlob(blob, `frioo-credit-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
            notify.success('Ledger exported');
        } catch (err) {
            notify.error(err.message || 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    const submitRefund = async (event) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
            const result = await creditsApi.refundOrder(refundFor.order_id, {
                ...refundForm,
                idempotency_key: newIdempotencyKey(`ref-${refundFor.order_id}`)
            });
            if (result.status === 'duplicate') {
                notify.info('That refund was already recorded.');
            } else if (result.status === 'cash_only') {
                notify.info('No credits were used on that order, so there is nothing to return as credits.');
            } else {
                notify.success(
                    `Refunded ₹${rupees(result.credit_refund_paise)} as credits. Return ₹${rupees(result.cash_refund_paise)} by your usual method.`
                );
            }
            setRefundFor(null);
            setRefundForm({ refund_rupees: '', reason: '' });
            void load(filters, page);
        } catch (err) {
            notify.error(err.message || 'Refund failed');
        } finally {
            setBusy(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

    return (
        <AdminPage
            title="Credit transactions"
            subtitle="Every movement across every account, newest first"
            actions={
                <button type="button" className="adm-btn adm-btn-ghost" onClick={handleExport} disabled={exporting}>
                    {exporting ? 'Exporting' : 'Export CSV'}
                </button>
            }
            toolbar={
                <div className="ct-filters">
                    <SearchInput value={filters.q} onChange={value => setFilter('q', value)}
                        placeholder="Search customer, reason or entry number" />
                    <select className="adm-input ct-select" value={filters.entry_type}
                        onChange={e => setFilter('entry_type', e.target.value)} aria-label="Transaction type">
                        <option value="">All types</option>
                        {ENTRY_TYPES.map(type => <option key={type} value={type}>{entryLabel(type)}</option>)}
                    </select>
                    <input type="date" className="adm-input ct-select" value={filters.from}
                        onChange={e => setFilter('from', e.target.value)} aria-label="From date" />
                    <input type="date" className="adm-input ct-select" value={filters.to}
                        onChange={e => setFilter('to', e.target.value)} aria-label="To date" />
                    {(filters.q || filters.entry_type || filters.from || filters.to) && (
                        <button type="button" className="ct-clear" onClick={() => { setFilters(EMPTY_FILTERS); setPage(0); }}>
                            Clear
                        </button>
                    )}
                </div>
            }
        >
            {loadError ? (
                <AdminErrorState message={loadError} onRetry={() => load(filters, page)} />
            ) : (
                <>
                    <AdminTable
                        columns={[
                            { key: 'ref', label: 'Ref', width: '80px' },
                            { key: 'customer', label: 'Customer' },
                            { key: 'type', label: 'Type', width: '150px' },
                            { key: 'amount', label: 'Amount', width: '110px' },
                            { key: 'balance', label: 'Balance', width: '110px' },
                            { key: 'reason', label: 'Reason' },
                            { key: 'admin', label: 'Admin', width: '130px' },
                            { key: 'when', label: 'When', width: '160px' },
                            { key: 'actions', label: '', width: '90px' }
                        ]}
                        isLoading={loading}
                        isEmpty={!loading && data.rows.length === 0}
                        emptyLabel="No transactions match these filters"
                    >
                        {data.rows.map(row => (
                            <tr key={row.id}>
                                <td className="ct-ref">#{row.id}</td>
                                <td>
                                    <span className="ct-name">{row.full_name || 'Unnamed'}</span>
                                    <span className="ct-meta">{row.email}</span>
                                </td>
                                <td><span className={`adm-chip adm-chip--${entryTone(row.entry_type)}`}>{entryLabel(row.entry_type)}</span></td>
                                <td className={row.amount_paise < 0 ? 'ct-neg' : 'ct-pos'}>{signedRupees(row.amount_paise)}</td>
                                <td>₹{rupees(row.balance_after_paise)}</td>
                                <td>
                                    {row.reason || '—'}
                                    {row.order_id && <span className="ct-meta">Order #{row.order_id}</span>}
                                    {row.reverses_entry_id && <span className="ct-meta">Reverses #{row.reverses_entry_id}</span>}
                                </td>
                                <td>{row.actor_name || row.actor_role}</td>
                                <td>{formatDateTime(row.created_at)}</td>
                                <td>
                                    {row.entry_type === 'ORDER_DEBIT' && row.order_id && (
                                        <button type="button" className="ct-link" onClick={() => setRefundFor(row)}>Refund</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </AdminTable>

                    <div className="ct-pager">
                        <span>{data.total} {data.total === 1 ? 'entry' : 'entries'}</span>
                        <div className="ct-pager-buttons">
                            <button type="button" className="adm-btn adm-btn-ghost" disabled={page === 0 || loading}
                                onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</button>
                            <span className="ct-page">Page {page + 1} of {totalPages}</span>
                            <button type="button" className="adm-btn adm-btn-ghost" disabled={page + 1 >= totalPages || loading}
                                onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                </>
            )}

            <AdminModal open={refundFor !== null} onClose={() => setRefundFor(null)} title="Refund an order">
                <form className="ct-form" onSubmit={submitRefund}>
                    <p className="ct-hint">
                        Order #{refundFor?.order_id} for {refundFor?.full_name || 'this customer'}.
                        The refund splits proportionally between credits and whatever was paid another way.
                        The credit portion returns to the original lot, or a 7 day grace lot if that one has expired.
                        Credits never come back as cash.
                    </p>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ct-amt">Total refund amount (₹)</label>
                        <input id="ct-amt" className="adm-input" type="number" min="1" step="0.01" required
                            value={refundForm.refund_rupees}
                            onChange={e => setRefundForm(prev => ({ ...prev, refund_rupees: e.target.value }))} />
                    </div>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ct-reason">Reason (required)</label>
                        <textarea id="ct-reason" className="adm-textarea" rows="3" required
                            value={refundForm.reason}
                            onChange={e => setRefundForm(prev => ({ ...prev, reason: e.target.value }))} />
                    </div>
                    <div className="ct-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setRefundFor(null)}>Cancel</button>
                        <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>
                            {busy ? 'Refunding' : 'Process refund'}
                        </button>
                    </div>
                </form>
            </AdminModal>

            <style>{`
                .ct-filters { display: flex; flex-wrap: wrap; gap: var(--fr-s3); align-items: center; width: 100%; }
                .ct-select { max-width: 190px; min-height: 42px; }
                .ct-clear { background: none; border: none; font-family: inherit; font-size: var(--fr-fs-caption); font-weight: 600; color: var(--fr-brand); cursor: pointer; }
                .ct-clear:hover { text-decoration: underline; }
                .ct-ref { font-family: var(--fr-font-mono); font-size: var(--fr-fs-label); color: var(--adm-text-2); }
                .ct-name { display: block; font-weight: 600; }
                .ct-meta { display: block; font-size: var(--fr-fs-label); color: var(--adm-text-2); }
                .ct-pos { color: #1B7A4B; font-weight: 600; font-variant-numeric: tabular-nums; }
                .ct-neg { color: #B23A2E; font-weight: 600; font-variant-numeric: tabular-nums; }
                .ct-link { background: none; border: none; padding: 0; font-family: inherit; font-size: var(--fr-fs-caption); font-weight: 600; color: var(--fr-brand); cursor: pointer; }
                .ct-link:hover { text-decoration: underline; }
                .ct-pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--fr-s3); margin-top: var(--fr-s4); font-size: var(--fr-fs-caption); color: var(--adm-text-2); }
                .ct-pager-buttons { display: flex; align-items: center; gap: var(--fr-s3); }
                .ct-page { font-variant-numeric: tabular-nums; }
                .ct-form { display: flex; flex-direction: column; gap: var(--fr-s4); }
                .ct-form-actions { display: flex; justify-content: flex-end; gap: var(--fr-s3); }
                .ct-hint { margin: 0; padding: var(--fr-s3) var(--fr-s4); background: var(--adm-surface-2); border-radius: 8px; font-size: var(--fr-fs-caption); line-height: 1.55; color: var(--adm-text-2); }
                @media (max-width: 720px) { .ct-select { max-width: 100%; flex: 1; } }
            `}</style>
        </AdminPage>
    );
}
