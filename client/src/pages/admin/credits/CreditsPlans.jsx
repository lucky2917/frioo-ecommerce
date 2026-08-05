import { useState, useEffect, useCallback, useMemo } from 'react';
import { creditsApi } from '../../../lib/creditsApi';
import { notify } from '../../../lib/feedbackStore';
import { logger } from '../../../utils/logger';
import { rupees, formatDate } from '../../../utils/creditFormat';
import { AdminPage, AdminTable, AdminModal, ConfirmDialog, AdminErrorState } from '../../../components/admin/ui';

const EMPTY_FORM = { plan_id: null, code: '', name: '', price_rupees: '', credit_rupees: '', validity_days: '' };

export default function CreditsPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            setPlans(await creditsApi.listPlans());
        } catch (err) {
            logger.error('Plans load failed:', err);
            setLoadError(err.message || 'Could not load plans');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const visible = useMemo(
        () => plans.filter(plan => showArchived || plan.is_active),
        [plans, showArchived]
    );

    const bonusOf = (plan) => plan.credit_paise - plan.price_paise;

    const openCreate = () => { setForm(EMPTY_FORM); setIsModalOpen(true); };

    const openEdit = (plan) => {
        setForm({
            plan_id: plan.id,
            code: plan.code,
            name: plan.name,
            price_rupees: (plan.price_paise / 100).toString(),
            credit_rupees: (plan.credit_paise / 100).toString(),
            validity_days: plan.validity_days.toString(),
            has_issued: plan.has_issued
        });
        setIsModalOpen(true);
    };

    const handleSave = async (event) => {
        event.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const result = await creditsApi.savePlan(form);
            const message = result.status === 'new_version'
                ? `Saved as version ${result.version}. Existing customers keep their original terms.`
                : result.status === 'created' ? 'Plan created' : 'Plan updated';
            notify.success(message);
            setIsModalOpen(false);
            await load();
        } catch (err) {
            notify.error(err.message || 'Could not save plan');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (plan) => {
        setBusyId(plan.id);
        try {
            await creditsApi.setPlanActive(plan.id, !plan.is_active);
            notify.success(plan.is_active ? 'Plan archived' : 'Plan set as the active version');
            await load();
        } catch (err) {
            notify.error(err.message || 'Could not update plan');
        } finally {
            setBusyId(null);
        }
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        setBusyId(pendingDelete.id);
        try {
            await creditsApi.deletePlan(pendingDelete.id);
            notify.success('Plan deleted');
            setPendingDelete(null);
            await load();
        } catch (err) {
            notify.error(err.message || 'Could not delete plan');
            setPendingDelete(null);
        } finally {
            setBusyId(null);
        }
    };

    if (loadError) {
        return (
            <AdminPage title="Credit plans" subtitle="Prepaid plans sold at the counter">
                <AdminErrorState message={loadError} onRetry={load} />
            </AdminPage>
        );
    }

    return (
        <AdminPage
            title="Credit plans"
            subtitle="Editing a plan that has issued credits creates a new version. Existing customers keep their original terms."
            actions={<button type="button" className="adm-btn adm-btn-primary" onClick={openCreate}>New plan</button>}
            toolbar={
                <label className="cp-toggle">
                    <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                    <span>Show archived versions</span>
                </label>
            }
        >
            <AdminTable
                columns={[
                    { key: 'name', label: 'Plan' },
                    { key: 'price', label: 'Customer pays', width: '130px' },
                    { key: 'credit', label: 'Credits given', width: '130px' },
                    { key: 'bonus', label: 'Bonus', width: '120px' },
                    { key: 'validity', label: 'Validity', width: '100px' },
                    { key: 'status', label: 'Status', width: '110px' },
                    { key: 'actions', label: '', width: '190px' }
                ]}
                isLoading={loading}
                isEmpty={!loading && visible.length === 0}
                emptyLabel="No plans yet. Create one to start selling credits."
            >
                {visible.map(plan => (
                    <tr key={plan.id}>
                        <td>
                            <span className="cp-name">{plan.name}</span>
                            <span className="cp-meta">{plan.code} · v{plan.version} · {formatDate(plan.created_at)}</span>
                        </td>
                        <td>₹{rupees(plan.price_paise)}</td>
                        <td>₹{rupees(plan.credit_paise)}</td>
                        <td>
                            ₹{rupees(bonusOf(plan))}
                            <span className="cp-meta">{((bonusOf(plan) / plan.price_paise) * 100).toFixed(1)}%</span>
                        </td>
                        <td>{plan.validity_days} days</td>
                        <td>
                            <span className={`adm-chip adm-chip--${plan.is_active ? 'success' : 'default'}`}>
                                {plan.is_active ? 'Active' : 'Archived'}
                            </span>
                        </td>
                        <td>
                            <div className="cp-actions">
                                <button type="button" className="cp-link" onClick={() => openEdit(plan)}>Edit</button>
                                <button type="button" className="cp-link" disabled={busyId === plan.id} onClick={() => toggleActive(plan)}>
                                    {plan.is_active ? 'Archive' : 'Make active'}
                                </button>
                                {!plan.has_issued && (
                                    <button type="button" className="cp-link cp-link-danger" onClick={() => setPendingDelete(plan)}>Delete</button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </AdminTable>

            <AdminModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={form.plan_id ? 'Edit plan' : 'New plan'}
            >
                <form onSubmit={handleSave} className="cp-form">
                    {form.plan_id && form.has_issued && (
                        <p className="cp-notice">
                            This plan has already issued credits, so saving creates a new version.
                            Customers holding the current version keep their original price, credits and validity.
                        </p>
                    )}

                    <div className="adm-field">
                        <label className="adm-label" htmlFor="cp-name">Plan name</label>
                        <input id="cp-name" className="adm-input" value={form.name} required
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Frioo Plan A" />
                    </div>

                    <div className="cp-row">
                        <div className="adm-field">
                            <label className="adm-label" htmlFor="cp-price">Customer pays (₹)</label>
                            <input id="cp-price" className="adm-input" type="number" min="1" step="1" required
                                value={form.price_rupees}
                                onChange={e => setForm(prev => ({ ...prev, price_rupees: e.target.value }))} placeholder="3000" />
                        </div>
                        <div className="adm-field">
                            <label className="adm-label" htmlFor="cp-credit">Credits received (₹)</label>
                            <input id="cp-credit" className="adm-input" type="number" min="1" step="1" required
                                value={form.credit_rupees}
                                onChange={e => setForm(prev => ({ ...prev, credit_rupees: e.target.value }))} placeholder="3300" />
                        </div>
                    </div>

                    <div className="adm-field">
                        <label className="adm-label" htmlFor="cp-validity">Validity (days)</label>
                        <input id="cp-validity" className="adm-input" type="number" min="1" step="1" required
                            value={form.validity_days}
                            onChange={e => setForm(prev => ({ ...prev, validity_days: e.target.value }))} placeholder="30" />
                    </div>

                    {form.price_rupees && form.credit_rupees && Number(form.credit_rupees) > Number(form.price_rupees) && (
                        <p className="cp-preview">
                            Bonus ₹{(Number(form.credit_rupees) - Number(form.price_rupees)).toLocaleString('en-IN')}
                            {form.validity_days && Number(form.validity_days) > 0 && (
                                <> · customer must spend about ₹{Math.round(Number(form.credit_rupees) / Number(form.validity_days)).toLocaleString('en-IN')} a day to use it all</>
                            )}
                        </p>
                    )}

                    <div className="cp-form-actions">
                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
                            {submitting ? 'Saving' : form.plan_id ? 'Save plan' : 'Create plan'}
                        </button>
                    </div>
                </form>
            </AdminModal>

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete this plan?"
                message="This plan has never issued credits, so it can be removed permanently. Plans with issued credits can only be archived."
                confirmLabel="Delete plan"
                loading={busyId === pendingDelete?.id}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />

            <style>{`
                .cp-toggle { display: inline-flex; align-items: center; gap: var(--fr-s2); font-size: var(--fr-fs-caption); color: var(--adm-text-2); cursor: pointer; }
                .cp-name { display: block; font-weight: 600; color: var(--adm-text); }
                .cp-meta { display: block; font-size: var(--fr-fs-label); color: var(--adm-text-2); }
                .cp-actions { display: flex; flex-wrap: wrap; gap: var(--fr-s3); }
                .cp-link { background: none; border: none; padding: 0; font-family: inherit; font-size: var(--fr-fs-caption); font-weight: 600; color: var(--fr-brand); cursor: pointer; }
                .cp-link:hover { text-decoration: underline; }
                .cp-link:disabled { opacity: 0.5; cursor: default; }
                .cp-link-danger { color: #B23A2E; }
                .cp-form { display: flex; flex-direction: column; gap: var(--fr-s4); }
                .cp-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fr-s4); }
                .cp-notice { margin: 0; padding: var(--fr-s3) var(--fr-s4); background: #FFF8E6; border: 1px solid #E8D9A8; border-radius: 8px; font-size: var(--fr-fs-caption); line-height: 1.5; color: #6B5518; }
                .cp-preview { margin: 0; font-size: var(--fr-fs-caption); color: var(--adm-text-2); }
                .cp-form-actions { display: flex; justify-content: flex-end; gap: var(--fr-s3); margin-top: var(--fr-s2); }
                @media (max-width: 620px) { .cp-row { grid-template-columns: 1fr; } }
            `}</style>
        </AdminPage>
    );
}
