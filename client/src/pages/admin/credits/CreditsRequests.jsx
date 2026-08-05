import { useState, useEffect, useCallback } from 'react';
import { creditsApi, newIdempotencyKey } from '../../../lib/creditsApi';
import { notify } from '../../../lib/feedbackStore';
import { logger } from '../../../utils/logger';
import { rupees, formatDateTime } from '../../../utils/creditFormat';
import { AdminPage, AdminTable, AdminModal, MetricCard, AdminErrorState } from '../../../components/admin/ui';

const TABS = [
    { key: 'pending', label: 'New' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: '', label: 'All' }
];

const TONE = {
    pending: 'warning', contacted: 'brand', approved: 'success',
    rejected: 'danger', cancelled: 'default'
};

export default function CreditsRequests() {
    const [status, setStatus] = useState('pending');
    const [data, setData] = useState({ rows: [], total: 0, counts: {} });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [approveFor, setApproveFor] = useState(null);
    const [approveForm, setApproveForm] = useState({ receipt_reference: '', admin_note: '' });
    const [rejectFor, setRejectFor] = useState(null);
    const [rejectNote, setRejectNote] = useState('');

    const load = useCallback(async (activeStatus) => {
        setLoading(true);
        setLoadError(null);
        try {
            setData(await creditsApi.listRequests(activeStatus));
        } catch (err) {
            logger.error('Requests load failed:', err);
            setLoadError(err.message || 'Could not load requests');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(status); }, [status, load]);

    const run = async (action, message, onDone) => {
        if (busy) return;
        setBusy(true);
        try {
            await action();
            notify.success(message);
            onDone?.();
            await load(status);
        } catch (err) {
            notify.error(err.message || 'Operation failed');
        } finally {
            setBusy(false);
        }
    };

    const counts = data.counts || {};

    return (
        <AdminPage
            title="Plan requests"
            subtitle="Customers who asked for a credit plan. Call them, collect payment, then activate."
            metrics={
                <>
                    <MetricCard tone="warning" label="Waiting to be called" value={counts.pending ?? 0} />
                    <MetricCard tone="brand" label="Contacted, not yet paid" value={counts.contacted ?? 0} />
                    <MetricCard tone="success" label="Activated" value={counts.approved ?? 0} />
                    <MetricCard label="Rejected or cancelled" value={(counts.rejected ?? 0) + (counts.cancelled ?? 0)} />
                </>
            }
            toolbar={
                <div className="cq-tabs" role="tablist" aria-label="Request status">
                    {TABS.map(tab => (
                        <button key={tab.key || 'all'} type="button" role="tab"
                            aria-selected={status === tab.key}
                            className={`cq-tab${status === tab.key ? ' cq-tab-on' : ''}`}
                            onClick={() => setStatus(tab.key)}>
                            {tab.label}
                            {tab.key && counts[tab.key] > 0 && <span className="cq-count">{counts[tab.key]}</span>}
                        </button>
                    ))}
                </div>
            }
        >
            {loadError ? (
                <AdminErrorState message={loadError} onRetry={() => load(status)} />
            ) : (
                <AdminTable
                    columns={[
                        { key: 'customer', label: 'Customer' },
                        { key: 'plan', label: 'Plan requested' },
                        { key: 'collect', label: 'To collect', width: '120px' },
                        { key: 'gives', label: 'Gives', width: '110px' },
                        { key: 'bal', label: 'Current balance', width: '130px' },
                        { key: 'when', label: 'Requested', width: '160px' },
                        { key: 'status', label: 'Status', width: '110px' },
                        { key: 'actions', label: '', width: '210px' }
                    ]}
                    isLoading={loading}
                    isEmpty={!loading && data.rows.length === 0}
                    emptyLabel={status === 'pending' ? 'No one is waiting right now' : 'Nothing here'}
                >
                    {data.rows.map(row => (
                        <tr key={row.id}>
                            <td>
                                <span className="cq-name">{row.full_name || 'Unnamed'}</span>
                                <span className="cq-meta">
                                    <a href={`tel:${row.contact_phone || row.phone_number || ''}`} className="cq-phone">
                                        {row.contact_phone || row.phone_number || 'No phone'}
                                    </a>
                                </span>
                                <span className="cq-meta">{row.email}</span>
                                {row.customer_note && <span className="cq-note">“{row.customer_note}”</span>}
                            </td>
                            <td>
                                <span className="cq-name">{row.plan_name}</span>
                                <span className="cq-meta">{row.plan_code} v{row.plan_version} · {row.validity_days} days</span>
                            </td>
                            <td className="cq-collect">₹{rupees(row.price_paise)}</td>
                            <td>₹{rupees(row.credit_paise)}</td>
                            <td>₹{rupees(row.current_balance_paise)}</td>
                            <td>{formatDateTime(row.created_at)}</td>
                            <td><span className={`adm-chip adm-chip--${TONE[row.status] || 'default'}`}>{row.status}</span></td>
                            <td>
                                {(row.status === 'pending' || row.status === 'contacted') ? (
                                    <div className="cq-actions">
                                        {row.status === 'pending' && (
                                            <button type="button" className="cq-link" disabled={busy}
                                                onClick={() => run(
                                                    () => creditsApi.setRequestStatus(row.id, { status: 'contacted' }),
                                                    'Marked as contacted'
                                                )}>Mark called</button>
                                        )}
                                        <button type="button" className="cq-link cq-link-go" disabled={busy}
                                            onClick={() => { setApproveFor(row); setApproveForm({ receipt_reference: '', admin_note: '' }); }}>
                                            Activate
                                        </button>
                                        <button type="button" className="cq-link cq-link-danger" disabled={busy}
                                            onClick={() => { setRejectFor(row); setRejectNote(''); }}>Reject</button>
                                    </div>
                                ) : (
                                    <span className="cq-meta">
                                        {row.handled_by_name ? `by ${row.handled_by_name}` : '—'}
                                        {row.admin_note && <span className="cq-note">{row.admin_note}</span>}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </AdminTable>
            )}

            <AdminModal open={approveFor !== null} onClose={() => setApproveFor(null)} title="Activate this plan">
                <div className="cq-form">
                    <div className="cq-summary">
                        <p><strong>{approveFor?.full_name}</strong> requested <strong>{approveFor?.plan_name}</strong>.</p>
                        <p>
                            Collect <strong>₹{rupees(approveFor?.price_paise)}</strong> and they receive
                            {' '}<strong>₹{rupees(approveFor?.credit_paise)}</strong> valid {approveFor?.validity_days} days.
                        </p>
                        <p className="cq-warn">Only activate after the money is in hand. This cannot be undone, only reversed.</p>
                    </div>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="cq-receipt">Receipt reference</label>
                        <input id="cq-receipt" className="adm-input" value={approveForm.receipt_reference}
                            onChange={e => setApproveForm(p => ({ ...p, receipt_reference: e.target.value }))}
                            placeholder="Counter receipt or UPI reference" />
                    </div>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="cq-anote">Note (optional)</label>
                        <input id="cq-anote" className="adm-input" value={approveForm.admin_note}
                            onChange={e => setApproveForm(p => ({ ...p, admin_note: e.target.value }))} />
                    </div>
                    <div className="cq-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setApproveFor(null)}>Cancel</button>
                        <button type="button" className="adm-btn adm-btn-primary"
                            disabled={busy || !approveForm.receipt_reference.trim()}
                            onClick={() => run(
                                () => creditsApi.approveRequest(approveFor.id, {
                                    ...approveForm,
                                    idempotency_key: newIdempotencyKey(`req-${approveFor.id}`)
                                }),
                                `${approveFor.plan_name} activated for ${approveFor.full_name || 'customer'}`,
                                () => setApproveFor(null)
                            )}>
                            {busy ? 'Activating…' : 'Collect payment and activate'}
                        </button>
                    </div>
                </div>
            </AdminModal>

            <AdminModal open={rejectFor !== null} onClose={() => setRejectFor(null)} title="Reject this request">
                <div className="cq-form">
                    <p className="cq-summary">
                        The customer is told the request was not activated, along with your reason.
                    </p>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="cq-reject">Reason (required)</label>
                        <textarea id="cq-reject" className="adm-textarea" rows="3" value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            placeholder="Could not reach the customer, payment not received, and so on" />
                    </div>
                    <div className="cq-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setRejectFor(null)}>Cancel</button>
                        <button type="button" className="adm-btn adm-btn-primary" disabled={busy || !rejectNote.trim()}
                            onClick={() => run(
                                () => creditsApi.setRequestStatus(rejectFor.id, { status: 'rejected', admin_note: rejectNote }),
                                'Request rejected',
                                () => setRejectFor(null)
                            )}>Reject request</button>
                    </div>
                </div>
            </AdminModal>

            <style>{`
                .cq-tabs { display: flex; flex-wrap: wrap; gap: var(--fr-s2); }
                .cq-tab { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 var(--fr-s4); background: var(--adm-surface); border: 1px solid var(--adm-line); border-radius: var(--fr-r-pill, 999px); font-family: inherit; font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-semibold); color: var(--adm-text-2); cursor: pointer; }
                .cq-tab-on { background: var(--fr-brand); border-color: var(--fr-brand); color: var(--fr-on-brand); }
                .cq-tab:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
                .cq-count { padding: 0 6px; border-radius: 999px; background: rgba(0,0,0,0.12); font-size: var(--fr-fs-label); }
                .cq-name { display: block; font-weight: 600; color: var(--adm-text); }
                .cq-meta { display: block; font-size: var(--fr-fs-label); color: var(--adm-text-2); }
                .cq-note { display: block; margin-top: 2px; font-size: var(--fr-fs-label); font-style: italic; color: var(--adm-text-2); }
                .cq-phone { color: var(--fr-brand); text-decoration: none; font-weight: 600; }
                .cq-phone:hover { text-decoration: underline; }
                .cq-collect { font-weight: 700; color: var(--adm-text); font-variant-numeric: tabular-nums; }
                .cq-actions { display: flex; flex-wrap: wrap; gap: var(--fr-s3); }
                .cq-link { background: none; border: none; padding: 0; font-family: inherit; font-size: var(--fr-fs-caption); font-weight: 600; color: var(--adm-text-2); cursor: pointer; }
                .cq-link:hover { text-decoration: underline; }
                .cq-link:disabled { opacity: 0.5; cursor: default; }
                .cq-link-go { color: var(--fr-brand); }
                .cq-link-danger { color: #B23A2E; }
                .cq-form { display: flex; flex-direction: column; gap: var(--fr-s4); }
                .cq-form-actions { display: flex; justify-content: flex-end; gap: var(--fr-s3); }
                .cq-summary { margin: 0; padding: var(--fr-s4); background: var(--adm-surface-2); border-radius: 8px; font-size: var(--fr-fs-caption); line-height: 1.55; color: var(--adm-text-2); }
                .cq-summary p { margin: 0 0 var(--fr-s2); }
                .cq-summary p:last-child { margin: 0; }
                .cq-warn { color: #7A5B14; font-weight: 600; }
            `}</style>
        </AdminPage>
    );
}
