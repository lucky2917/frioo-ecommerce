import { useState, useEffect, useCallback, useRef } from 'react';
import { creditsApi, newIdempotencyKey } from '../../../lib/creditsApi';
import { notify } from '../../../lib/feedbackStore';
import { logger } from '../../../utils/logger';
import {
    rupees, signedRupees, formatDate, formatDateTime, toDateInputValue,
    entryLabel, entryTone, lotStatusTone
} from '../../../utils/creditFormat';
import { AdminPage, AdminTable, AdminModal, ConfirmDialog, SearchInput, AdminErrorState } from '../../../components/admin/ui';

const ACTIVATE_FORM = { plan_id: '', receipt_reference: '', note: '' };
const ADJUST_FORM = { direction: 'credit', amount_rupees: '', validity_days: '30', reason: '' };

export default function CreditsAccounts() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [ledger, setLedger] = useState({ rows: [], total: 0 });
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [plans, setPlans] = useState([]);
    const [busy, setBusy] = useState(false);

    const [activateForm, setActivateForm] = useState(ACTIVATE_FORM);
    const [activateOpen, setActivateOpen] = useState(false);
    const [activateConfirm, setActivateConfirm] = useState(false);
    const [adjustForm, setAdjustForm] = useState(ADJUST_FORM);
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [suspendOpen, setSuspendOpen] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [resumeOpen, setResumeOpen] = useState(false);
    const [extendLot, setExtendLot] = useState(null);
    const [extendForm, setExtendForm] = useState({ new_expires_at: '', reason: '' });
    const [reverseEntry, setReverseEntry] = useState(null);
    const [reverseReason, setReverseReason] = useState('');

    const searchAbortRef = useRef(null);

    useEffect(() => {
        creditsApi.listPlans()
            .then(list => setPlans(list.filter(plan => plan.is_active)))
            .catch(err => logger.warn('Could not load plans', err));
    }, []);

    useEffect(() => {
        const term = query.trim();
        if (term.length < 2) { setResults([]); return; }

        const timer = setTimeout(async () => {
            searchAbortRef.current?.abort();
            const controller = new AbortController();
            searchAbortRef.current = controller;
            setSearching(true);
            try {
                setResults(await creditsApi.searchCustomers(term, controller.signal));
            } catch (err) {
                if (err.name !== 'AbortError') logger.warn('Customer search failed', err);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const loadCustomer = useCallback(async (userId) => {
        setLoadingCustomer(true);
        setLoadError(null);
        try {
            const [detail, history] = await Promise.all([
                creditsApi.customer(userId),
                creditsApi.ledger({ user_id: userId, limit: 100 })
            ]);
            setCustomer(detail);
            setLedger(history);
        } catch (err) {
            logger.error('Customer load failed:', err);
            setLoadError(err.message || 'Could not load this customer');
        } finally {
            setLoadingCustomer(false);
        }
    }, []);

    const selectCustomer = (userId) => {
        setSelectedId(userId);
        void loadCustomer(userId);
    };

    const refresh = useCallback(() => {
        if (selectedId) void loadCustomer(selectedId);
    }, [selectedId, loadCustomer]);

    const runAction = async (action, successMessage, onDone) => {
        if (busy) return;
        setBusy(true);
        try {
            const result = await action();
            if (result?.status === 'duplicate') {
                notify.info('That operation was already recorded. Nothing changed.');
            } else {
                notify.success(successMessage);
            }
            onDone?.();
            refresh();
        } catch (err) {
            notify.error(err.message || 'Operation failed');
        } finally {
            setBusy(false);
        }
    };

    const submitActivation = () => {
        const plan = plans.find(p => String(p.id) === String(activateForm.plan_id));
        runAction(
            () => creditsApi.activate(selectedId, {
                plan_id: activateForm.plan_id,
                receipt_reference: activateForm.receipt_reference,
                note: activateForm.note,
                idempotency_key: newIdempotencyKey(`act-${activateForm.receipt_reference.trim()}`)
            }),
            `${plan?.name || 'Plan'} activated`,
            () => { setActivateConfirm(false); setActivateOpen(false); setActivateForm(ACTIVATE_FORM); }
        );
    };

    const submitAdjustment = (event) => {
        event.preventDefault();
        runAction(
            () => creditsApi.adjust(selectedId, { ...adjustForm, idempotency_key: newIdempotencyKey('adj') }),
            adjustForm.direction === 'credit' ? 'Credits added' : 'Credits deducted',
            () => { setAdjustOpen(false); setAdjustForm(ADJUST_FORM); }
        );
    };

    const submitExtend = (event) => {
        event.preventDefault();
        runAction(
            () => creditsApi.extendLot(extendLot.id, {
                new_expires_at: new Date(`${extendForm.new_expires_at}T23:59:59`).toISOString(),
                reason: extendForm.reason,
                idempotency_key: newIdempotencyKey(`ext-${extendLot.id}`)
            }),
            'Validity extended',
            () => setExtendLot(null)
        );
    };

    const selectedPlan = plans.find(p => String(p.id) === String(activateForm.plan_id));
    const activateReady = activateForm.plan_id && activateForm.receipt_reference.trim().length > 0;

    return (
        <AdminPage
            title="Customer accounts"
            subtitle="Search by name, phone or email, then manage that customer's credits"
            toolbar={<SearchInput value={query} onChange={setQuery} placeholder="Search name, phone number or email" />}
        >
            {query.trim().length >= 2 && (
                <div className="ca-results">
                    {searching && <p className="ca-hint">Searching…</p>}
                    {!searching && results.length === 0 && <p className="ca-hint">No customer matches that search.</p>}
                    {results.map(row => (
                        <button
                            key={row.user_id}
                            type="button"
                            className={`ca-result${selectedId === row.user_id ? ' ca-result-on' : ''}`}
                            onClick={() => selectCustomer(row.user_id)}
                        >
                            <span className="ca-result-main">
                                <strong>{row.full_name || 'Unnamed customer'}</strong>
                                <span className="ca-result-contact">{row.phone_number || 'No phone'} · {row.email}</span>
                            </span>
                            <span className="ca-result-side">
                                <span className="ca-result-balance">₹{rupees(row.available_paise)}</span>
                                <span className="ca-result-meta">
                                    {row.active_lots} active {row.active_lots === 1 ? 'lot' : 'lots'} · {row.status}
                                </span>
                                <span className="ca-result-meta">Last order {row.last_order_at ? formatDate(row.last_order_at) : 'never'}</span>
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {loadError && <AdminErrorState message={loadError} onRetry={refresh} />}

            {customer && !loadError && (
                <>
                    <section className="ca-head">
                        <div>
                            <h2 className="ca-name">{customer.full_name || 'Unnamed customer'}</h2>
                            <p className="ca-contact">{customer.phone_number || 'No phone'} · {customer.email}</p>
                            {customer.status === 'suspended' && (
                                <p className="ca-suspended">
                                    Suspended {formatDate(customer.suspended_at)} · {customer.suspension_reason}
                                </p>
                            )}
                        </div>
                        <div className="ca-head-actions">
                            <button type="button" className="adm-btn adm-btn-primary" disabled={loadingCustomer}
                                onClick={() => setActivateOpen(true)}>Activate plan</button>
                            <button type="button" className="adm-btn adm-btn-ghost"
                                onClick={() => setAdjustOpen(true)}>Adjust credits</button>
                            {customer.status === 'active' ? (
                                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setSuspendOpen(true)}>Suspend</button>
                            ) : (
                                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setResumeOpen(true)}>Resume</button>
                            )}
                        </div>
                    </section>

                    <div className="ca-stats">
                        <div className="ca-stat ca-stat-primary">
                            <span>Spendable balance</span>
                            <strong>₹{rupees(customer.available_paise)}</strong>
                        </div>
                        <div className="ca-stat"><span>Lifetime issued</span><strong>₹{rupees(customer.lifetime_issued_paise)}</strong></div>
                        <div className="ca-stat"><span>Lifetime spent</span><strong>₹{rupees(customer.lifetime_spent_paise)}</strong></div>
                        <div className="ca-stat"><span>Account status</span><strong>{customer.status}</strong></div>
                    </div>

                    <h3 className="ca-section-title">Credit lots</h3>
                    <AdminTable
                        columns={[
                            { key: 'origin', label: 'Origin' },
                            { key: 'issued', label: 'Issued', width: '110px' },
                            { key: 'remaining', label: 'Remaining', width: '110px' },
                            { key: 'activated', label: 'Activated', width: '120px' },
                            { key: 'expires', label: 'Expires', width: '120px' },
                            { key: 'days', label: 'Days left', width: '100px' },
                            { key: 'status', label: 'Status', width: '110px' },
                            { key: 'actions', label: '', width: '90px' }
                        ]}
                        isLoading={loadingCustomer}
                        isEmpty={!loadingCustomer && customer.lots.length === 0}
                        emptyLabel="This customer has never held credits"
                    >
                        {customer.lots.map(lot => (
                            <tr key={lot.id}>
                                <td>
                                    <span className="ca-lot-origin">{lot.plan_name || lot.origin}</span>
                                    {lot.plan_name && <span className="ca-lot-meta">{lot.plan_code} v{lot.plan_version}</span>}
                                    {!lot.plan_name && <span className="ca-lot-meta">Lot #{lot.id}</span>}
                                </td>
                                <td>₹{rupees(lot.issued_paise)}</td>
                                <td>₹{rupees(lot.remaining_paise)}</td>
                                <td>{formatDate(lot.issued_at)}</td>
                                <td>{formatDate(lot.expires_at)}</td>
                                <td>{lot.status === 'active' ? `${lot.days_remaining}d` : '—'}</td>
                                <td>
                                    <span className={`adm-chip adm-chip--${lotStatusTone(lot.status, lot.days_remaining)}`}>{lot.status}</span>
                                </td>
                                <td>
                                    <button type="button" className="ca-link" onClick={() => {
                                        setExtendLot(lot);
                                        setExtendForm({ new_expires_at: toDateInputValue(lot.expires_at), reason: '' });
                                    }}>Extend</button>
                                </td>
                            </tr>
                        ))}
                    </AdminTable>

                    <h3 className="ca-section-title">Ledger</h3>
                    <AdminTable
                        columns={[
                            { key: 'ref', label: 'Ref', width: '80px' },
                            { key: 'type', label: 'Type', width: '150px' },
                            { key: 'amount', label: 'Amount', width: '110px' },
                            { key: 'balance', label: 'Balance', width: '110px' },
                            { key: 'reason', label: 'Reason' },
                            { key: 'admin', label: 'Admin', width: '140px' },
                            { key: 'when', label: 'When', width: '160px' },
                            { key: 'actions', label: '', width: '90px' }
                        ]}
                        isLoading={loadingCustomer}
                        isEmpty={!loadingCustomer && ledger.rows.length === 0}
                        emptyLabel="No credit history yet"
                    >
                        {ledger.rows.map(row => (
                            <tr key={row.id}>
                                <td className="ca-ref">#{row.id}</td>
                                <td><span className={`adm-chip adm-chip--${entryTone(row.entry_type)}`}>{entryLabel(row.entry_type)}</span></td>
                                <td className={row.amount_paise < 0 ? 'ca-neg' : 'ca-pos'}>{signedRupees(row.amount_paise)}</td>
                                <td>₹{rupees(row.balance_after_paise)}</td>
                                <td>
                                    {row.reason || '—'}
                                    {row.order_id && <span className="ca-lot-meta">Order #{row.order_id}</span>}
                                    {row.reverses_entry_id && <span className="ca-lot-meta">Reverses #{row.reverses_entry_id}</span>}
                                </td>
                                <td>{row.actor_name || row.actor_role}</td>
                                <td>{formatDateTime(row.created_at)}</td>
                                <td>
                                    {row.entry_type !== 'REVERSAL' && (
                                        <button type="button" className="ca-link ca-link-danger"
                                            onClick={() => { setReverseEntry(row); setReverseReason(''); }}>Reverse</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </AdminTable>
                </>
            )}

            {!customer && !loadError && query.trim().length < 2 && (
                <p className="ca-hint">Start typing a name, phone number or email to find a customer.</p>
            )}

            <AdminModal open={activateOpen} onClose={() => setActivateOpen(false)} title="Activate a plan">
                <div className="ca-form">
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ca-plan">Plan</label>
                        <select id="ca-plan" className="adm-input" value={activateForm.plan_id}
                            onChange={e => setActivateForm(prev => ({ ...prev, plan_id: e.target.value }))}>
                            <option value="">Choose a plan</option>
                            {plans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} — pays ₹{rupees(plan.price_paise)}, gets ₹{rupees(plan.credit_paise)}, {plan.validity_days} days
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ca-receipt">Receipt reference</label>
                        <input id="ca-receipt" className="adm-input" value={activateForm.receipt_reference}
                            onChange={e => setActivateForm(prev => ({ ...prev, receipt_reference: e.target.value }))}
                            placeholder="Counter receipt or UPI reference" />
                    </div>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ca-note">Note (optional)</label>
                        <input id="ca-note" className="adm-input" value={activateForm.note}
                            onChange={e => setActivateForm(prev => ({ ...prev, note: e.target.value }))} />
                    </div>
                    <div className="ca-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setActivateOpen(false)}>Cancel</button>
                        <button type="button" className="adm-btn adm-btn-primary" disabled={!activateReady}
                            onClick={() => setActivateConfirm(true)}>Review activation</button>
                    </div>
                </div>
            </AdminModal>

            <ConfirmDialog
                open={activateConfirm}
                title="Confirm activation"
                message={selectedPlan
                    ? `Give ${customer?.full_name || 'this customer'} ₹${rupees(selectedPlan.credit_paise)} of credits valid for ${selectedPlan.validity_days} days, against receipt ${activateForm.receipt_reference}. Confirm you have collected ₹${rupees(selectedPlan.price_paise)}.`
                    : ''}
                confirmLabel="Activate plan"
                loading={busy}
                onConfirm={submitActivation}
                onCancel={() => setActivateConfirm(false)}
            />

            <AdminModal open={adjustOpen} onClose={() => setAdjustOpen(false)} title="Manual adjustment">
                <form className="ca-form" onSubmit={submitAdjustment}>
                    <div className="ca-seg">
                        {['credit', 'debit'].map(dir => (
                            <button key={dir} type="button"
                                className={`ca-seg-btn${adjustForm.direction === dir ? ' ca-seg-on' : ''}`}
                                onClick={() => setAdjustForm(prev => ({ ...prev, direction: dir }))}>
                                {dir === 'credit' ? 'Add credits' : 'Deduct credits'}
                            </button>
                        ))}
                    </div>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ca-amt">Amount (₹)</label>
                        <input id="ca-amt" className="adm-input" type="number" min="1" step="0.01" required
                            value={adjustForm.amount_rupees}
                            onChange={e => setAdjustForm(prev => ({ ...prev, amount_rupees: e.target.value }))} />
                    </div>
                    {adjustForm.direction === 'credit' && (
                        <div className="adm-field">
                            <label className="adm-label" htmlFor="ca-val">Validity (days)</label>
                            <input id="ca-val" className="adm-input" type="number" min="1" step="1" required
                                value={adjustForm.validity_days}
                                onChange={e => setAdjustForm(prev => ({ ...prev, validity_days: e.target.value }))} />
                        </div>
                    )}
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ca-reason">Reason (required)</label>
                        <textarea id="ca-reason" className="adm-textarea" rows="3" required
                            value={adjustForm.reason}
                            onChange={e => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Explain why this adjustment is being made. This is permanent and attributed to you." />
                    </div>
                    <div className="ca-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setAdjustOpen(false)}>Cancel</button>
                        <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>
                            {busy ? 'Saving' : 'Record adjustment'}
                        </button>
                    </div>
                </form>
            </AdminModal>

            <AdminModal open={suspendOpen} onClose={() => setSuspendOpen(false)} title="Suspend this account">
                <div className="ca-form">
                    <div className="ca-warning">
                        <p><strong>Suspending will:</strong> block new plan activations, block manual credits, and stop these credits being used at checkout.</p>
                        <p><strong>It will not:</strong> delete credits, expire them early, change any lot, or alter ledger history. Everything remaining becomes usable again on resume.</p>
                    </div>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ca-susp">Reason (required)</label>
                        <textarea id="ca-susp" className="adm-textarea" rows="3" value={suspendReason}
                            onChange={e => setSuspendReason(e.target.value)} />
                    </div>
                    <div className="ca-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setSuspendOpen(false)}>Cancel</button>
                        <button type="button" className="adm-btn adm-btn-primary" disabled={busy || !suspendReason.trim()}
                            onClick={() => runAction(
                                () => creditsApi.setStatus(selectedId, { status: 'suspended', reason: suspendReason }),
                                'Account suspended',
                                () => { setSuspendOpen(false); setSuspendReason(''); }
                            )}>Suspend account</button>
                    </div>
                </div>
            </AdminModal>

            <ConfirmDialog
                open={resumeOpen}
                title="Resume this account?"
                message="All remaining valid credits become usable again immediately. Anything that expired while suspended stays expired."
                confirmLabel="Resume account"
                loading={busy}
                onConfirm={() => runAction(
                    () => creditsApi.setStatus(selectedId, { status: 'active', reason: null }),
                    'Account resumed',
                    () => setResumeOpen(false)
                )}
                onCancel={() => setResumeOpen(false)}
            />

            <AdminModal open={extendLot !== null} onClose={() => setExtendLot(null)} title="Extend this lot">
                <form className="ca-form" onSubmit={submitExtend}>
                    <p className="ca-hint">
                        Lot #{extendLot?.id} currently expires {formatDate(extendLot?.expires_at)} with
                        ₹{rupees(extendLot?.remaining_paise)} remaining. This affects only this lot.
                    </p>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ca-newexp">New expiry date</label>
                        <input id="ca-newexp" className="adm-input" type="date" required
                            value={extendForm.new_expires_at}
                            onChange={e => setExtendForm(prev => ({ ...prev, new_expires_at: e.target.value }))} />
                    </div>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ca-extreason">Reason (required)</label>
                        <textarea id="ca-extreason" className="adm-textarea" rows="3" required
                            value={extendForm.reason}
                            onChange={e => setExtendForm(prev => ({ ...prev, reason: e.target.value }))} />
                    </div>
                    <div className="ca-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setExtendLot(null)}>Cancel</button>
                        <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>Extend validity</button>
                    </div>
                </form>
            </AdminModal>

            <AdminModal open={reverseEntry !== null} onClose={() => setReverseEntry(null)} title="Reverse this entry">
                <div className="ca-form">
                    <p className="ca-hint">
                        Entry #{reverseEntry?.id}, {entryLabel(reverseEntry?.entry_type)}, {signedRupees(reverseEntry?.amount_paise)}.
                        History is never edited. This appends an opposing entry that points at the original.
                    </p>
                    <div className="adm-field">
                        <label className="adm-label" htmlFor="ca-revreason">Reason (required)</label>
                        <textarea id="ca-revreason" className="adm-textarea" rows="3" value={reverseReason}
                            onChange={e => setReverseReason(e.target.value)} />
                    </div>
                    <div className="ca-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setReverseEntry(null)}>Cancel</button>
                        <button type="button" className="adm-btn adm-btn-primary" disabled={busy || !reverseReason.trim()}
                            onClick={() => runAction(
                                () => creditsApi.reverseEntry(reverseEntry.id, {
                                    reason: reverseReason,
                                    idempotency_key: newIdempotencyKey(`rev-${reverseEntry.id}`)
                                }),
                                'Entry reversed',
                                () => setReverseEntry(null)
                            )}>Append reversal</button>
                    </div>
                </div>
            </AdminModal>

            <style>{`
                .ca-results { display: flex; flex-direction: column; gap: var(--fr-s2); margin-bottom: var(--fr-s5); }
                .ca-result { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--fr-s4); width: 100%; padding: var(--fr-s4); background: var(--adm-surface); border: 1px solid var(--adm-line); border-radius: 10px; text-align: left; cursor: pointer; }
                .ca-result:hover { border-color: var(--fr-brand); }
                .ca-result-on { border-color: var(--fr-brand); background: var(--adm-surface-2); }
                .ca-result-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
                .ca-result-contact { font-size: var(--fr-fs-caption); color: var(--adm-text-2); }
                .ca-result-side { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
                .ca-result-balance { font-family: var(--fr-font-sans); font-size: 1rem; font-weight: 700; color: var(--fr-brand); font-variant-numeric: tabular-nums; }
                .ca-result-meta { font-size: var(--fr-fs-label); color: var(--adm-text-2); }
                .ca-hint { font-size: var(--fr-fs-caption); color: var(--adm-text-2); margin: 0 0 var(--fr-s4); }
                .ca-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--fr-s4); padding-bottom: var(--fr-s4); border-bottom: 1px solid var(--adm-line); margin-bottom: var(--fr-s5); }
                .ca-name { margin: 0; font-family: var(--fr-font-display); font-size: 1.25rem; font-weight: 700; color: var(--adm-text); }
                .ca-contact { margin: 2px 0 0; font-size: var(--fr-fs-caption); color: var(--adm-text-2); }
                .ca-suspended { margin: 6px 0 0; font-size: var(--fr-fs-caption); color: #B23A2E; font-weight: 600; }
                .ca-head-actions { display: flex; flex-wrap: wrap; gap: var(--fr-s3); }
                .ca-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--fr-s4); margin-bottom: var(--fr-s6); }
                .ca-stat { display: flex; flex-direction: column; gap: 4px; padding: var(--fr-s4); background: var(--adm-surface); border: 1px solid var(--adm-line); border-radius: 10px; }
                .ca-stat span { font-size: var(--fr-fs-label); color: var(--adm-text-2); }
                .ca-stat strong { font-family: var(--fr-font-sans); font-size: 1.125rem; font-weight: 700; color: var(--adm-text); font-variant-numeric: tabular-nums; }
                .ca-stat-primary strong { color: var(--fr-brand); font-size: 1.5rem; }
                .ca-section-title { margin: var(--fr-s6) 0 var(--fr-s3); font-family: var(--fr-font-sans); font-size: 0.9375rem; font-weight: 700; color: var(--adm-text); }
                .ca-lot-origin { display: block; font-weight: 600; text-transform: capitalize; }
                .ca-lot-meta { display: block; font-size: var(--fr-fs-label); color: var(--adm-text-2); }
                .ca-ref { font-family: var(--fr-font-mono); font-size: var(--fr-fs-label); color: var(--adm-text-2); }
                .ca-pos { color: #1B7A4B; font-weight: 600; font-variant-numeric: tabular-nums; }
                .ca-neg { color: #B23A2E; font-weight: 600; font-variant-numeric: tabular-nums; }
                .ca-link { background: none; border: none; padding: 0; font-family: inherit; font-size: var(--fr-fs-caption); font-weight: 600; color: var(--fr-brand); cursor: pointer; }
                .ca-link:hover { text-decoration: underline; }
                .ca-link-danger { color: #B23A2E; }
                .ca-form { display: flex; flex-direction: column; gap: var(--fr-s4); }
                .ca-form-actions { display: flex; justify-content: flex-end; gap: var(--fr-s3); }
                .ca-seg { display: flex; gap: var(--fr-s2); }
                .ca-seg-btn { flex: 1; min-height: 42px; background: var(--adm-surface); border: 1px solid var(--adm-line); border-radius: 8px; font-family: inherit; font-size: var(--fr-fs-caption); font-weight: 600; color: var(--adm-text-2); cursor: pointer; }
                .ca-seg-on { background: var(--fr-brand); border-color: var(--fr-brand); color: var(--fr-on-brand); }
                .ca-warning { padding: var(--fr-s4); background: #FFF8E6; border: 1px solid #E8D9A8; border-radius: 8px; font-size: var(--fr-fs-caption); line-height: 1.55; color: #6B5518; }
                .ca-warning p { margin: 0 0 var(--fr-s2); }
                .ca-warning p:last-child { margin: 0; }
                @media (max-width: 900px) { .ca-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (max-width: 620px) {
                    .ca-result { flex-direction: column; }
                    .ca-result-side { align-items: flex-start; }
                    .ca-head-actions .adm-btn { flex: 1; }
                }
            `}</style>
        </AdminPage>
    );
}
