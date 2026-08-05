import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { notify } from '../lib/feedbackStore';
import { useAuth } from '../context/auth-context';
import PlanCatalogue from '../components/credits/PlanCatalogue';
import {
    useMyCredits, fetchPublicPlans, fetchMyRequests, createPlanRequest, cancelPlanRequest
} from '../hooks/useMyCredits';
import { rupees, formatDate, formatDateTime, signedRupees } from '../utils/creditFormat';
import { expiryNotice, groupByMonth, entryCopy, originLabel } from '../utils/creditExpiry';

export default function MyCredits() {
    const { user, profile } = useAuth();
    const { summary, history, loading, error, refresh } = useMyCredits({ withHistory: true });

    const [plans, setPlans] = useState([]);
    const [requests, setRequests] = useState([]);
    const [requestBusy, setRequestBusy] = useState(false);

    const loadRequests = useCallback(async () => {
        try { setRequests(await fetchMyRequests()); }
        catch { setRequests([]); }
    }, []);

    useEffect(() => {
        fetchPublicPlans().then(setPlans);
        if (user) void loadRequests();
    }, [user, loadRequests]);

    const openRequest = useMemo(
        () => requests.find(r => r.status === 'pending' || r.status === 'contacted') ?? null,
        [requests]
    );

    const submitRequest = async (body) => {
        setRequestBusy(true);
        try {
            const result = await createPlanRequest(body);
            if (result?.result?.status === 'already_open') {
                notify.info('You already have a request waiting with our team.');
            } else {
                notify.success('Request sent. Our team will call you shortly.');
            }
            await loadRequests();
        } catch (err) {
            notify.error(err.message || 'Could not send your request');
        } finally {
            setRequestBusy(false);
        }
    };

    const cancelRequest = async (requestId) => {
        setRequestBusy(true);
        try {
            await cancelPlanRequest(requestId);
            notify.success('Request cancelled');
            await loadRequests();
        } catch (err) {
            notify.error(err.message || 'Could not cancel the request');
        } finally {
            setRequestBusy(false);
        }
    };

    const lots = useMemo(() => summary?.lots ?? [], [summary]);

    const totals = useMemo(() => {
        const issued = lots.reduce((sum, lot) => sum + Number(lot.issued_paise || 0), 0);
        const bonus = lots.reduce((sum, lot) => sum + Math.max(0, Number(lot.issued_paise || 0) - Number(lot.paid_paise || 0)), 0);
        return { issued, bonus };
    }, [lots]);

    const grouped = useMemo(() => groupByMonth(history), [history]);
    const soonest = lots.length > 0 ? lots[0] : null;
    const soonestNotice = soonest ? expiryNotice(soonest.expires_at) : null;

    if (!user) {
        return (
            <main className="mc-page">
                <SEO title="My Frioo Credits" description="Your prepaid Frioo Credits balance, expiry and history." />
                <p className="mc-signin">Sign in to see your Frioo Credits.</p>
            </main>
        );
    }

    const available = Number(summary?.available_paise || 0);
    const suspended = summary?.status === 'suspended';

    return (
        <main className="mc-page">
            <SEO title="My Frioo Credits" description="Your prepaid Frioo Credits balance, expiry and history." />

            <header className="mc-head">
                <p className="mc-eyebrow">Frioo Credits</p>
                <h1 className="mc-title">My credits</h1>
            </header>

            {error && (
                <div className="mc-error" role="alert">
                    <span>We could not load your credits just now.</span>
                    <button type="button" onClick={refresh}>Try again</button>
                </div>
            )}

            {loading && !summary && <div className="mc-skeleton" aria-hidden="true" />}

            {!loading && summary && (
                <PlanCatalogue
                    plans={plans}
                    openRequest={openRequest}
                    phone={profile?.phone_number}
                    busy={requestBusy}
                    onRequest={submitRequest}
                    onCancel={cancelRequest}
                    heading={available > 0 ? 'Top up your credits' : 'Buy Frioo Credits'}
                />
            )}

            {!loading && summary && available === 0 && lots.length === 0 && history.length === 0 && !openRequest && (
                <section className="mc-empty">
                    <h2 className="mc-empty-title">How Frioo Credits work</h2>
                    <p className="mc-empty-text">
                        Credits are prepaid balance. You pay once at our store, we add the credits here,
                        and every order after that takes the amount straight from your balance.
                        Credits closest to expiry are always used first.
                    </p>
                    <div className="mc-empty-actions">
                        <Link to="/contact" className="mc-btn mc-btn-primary">Contact the store</Link>
                        <Link to="/shop" className="mc-btn mc-btn-ghost">Browse fruit</Link>
                    </div>
                </section>
            )}

            {summary && (available > 0 || lots.length > 0 || history.length > 0) && (
                <>
                    <section className="mc-overview" aria-label="Credit balance">
                        <div className="mc-balance">
                            <span className="mc-balance-label">Available to spend</span>
                            <strong className="mc-balance-value">₹{rupees(available)}</strong>
                            {soonestNotice && available > 0 && (
                                <span className={`mc-pill mc-pill-${soonestNotice.tone}`}>
                                    ₹{rupees(soonest.remaining_paise)} · {soonestNotice.label}
                                </span>
                            )}
                        </div>

                        <dl className="mc-facts">
                            <div><dt>Active plans</dt><dd>{lots.length}</dd></div>
                            <div><dt>Credits received</dt><dd>₹{rupees(summary.lifetime_issued_paise)}</dd></div>
                            <div><dt>Credits used</dt><dd>₹{rupees(summary.lifetime_spent_paise)}</dd></div>
                            <div><dt>Bonus earned</dt><dd>₹{rupees(totals.bonus)}</dd></div>
                            <div><dt>Account</dt><dd className={suspended ? 'mc-suspended' : undefined}>{suspended ? 'Suspended' : 'Active'}</dd></div>
                        </dl>
                    </section>

                    {suspended && (
                        <p className="mc-notice" role="status">
                            Your credit account is on hold, so credits cannot be used at checkout right now.
                            Your balance is safe and nothing has been removed. Please contact the store.
                        </p>
                    )}

                    {lots.length > 0 && (
                        <section className="mc-section" aria-label="Your credit lots">
                            <h2 className="mc-section-title">Your credits</h2>
                            <p className="mc-section-hint">Used in this order, soonest expiry first.</p>

                            <ul className="mc-lots">
                                {lots.map((lot, index) => {
                                    const notice = expiryNotice(lot.expires_at);
                                    const bonus = Math.max(0, Number(lot.issued_paise || 0) - Number(lot.paid_paise || 0));
                                    return (
                                        <li key={lot.id} className="mc-lot">
                                            <span className="mc-lot-order" aria-hidden="true">{index + 1}</span>
                                            <div className="mc-lot-main">
                                                <div className="mc-lot-top">
                                                    <h3 className="mc-lot-name">{originLabel(lot.origin, lot.plan_name)}</h3>
                                                    {notice && <span className={`mc-pill mc-pill-${notice.tone}`}>{notice.label}</span>}
                                                </div>
                                                <p className="mc-lot-amounts">
                                                    <strong>₹{rupees(lot.remaining_paise)}</strong> left of ₹{rupees(lot.issued_paise)}
                                                    {bonus > 0 && <span className="mc-lot-bonus"> · ₹{rupees(bonus)} bonus</span>}
                                                </p>
                                                <div className="mc-lot-bar" aria-hidden="true">
                                                    <span style={{ width: `${Math.max(2, (lot.remaining_paise / lot.issued_paise) * 100)}%` }} />
                                                </div>
                                                <p className="mc-lot-dates">
                                                    Added {formatDate(lot.issued_at)} · expires {formatDate(lot.expires_at)}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}

                    {grouped.length > 0 && (
                        <section className="mc-section" aria-label="Credit history">
                            <h2 className="mc-section-title">History</h2>
                            {grouped.map(group => (
                                <div key={group.label} className="mc-month">
                                    <h3 className="mc-month-label">{group.label}</h3>
                                    <ul className="mc-entries">
                                        {group.entries.map(entry => {
                                            const copy = entryCopy(entry.entry_type);
                                            const positive = entry.amount_paise > 0;
                                            return (
                                                <li key={entry.id} className="mc-entry">
                                                    <div className="mc-entry-main">
                                                        <span className="mc-entry-label">{copy.label}</span>
                                                        <span className="mc-entry-hint">
                                                            {entry.reason || copy.hint}
                                                            {entry.order_id && (
                                                                <> · <Link to="/orders" className="mc-entry-link">Order #{entry.order_id}</Link></>
                                                            )}
                                                        </span>
                                                        <span className="mc-entry-meta">
                                                            Ref #{entry.id} · {formatDateTime(entry.created_at)}
                                                        </span>
                                                    </div>
                                                    <div className="mc-entry-side">
                                                        <span className={positive ? 'mc-amt-pos' : 'mc-amt-neg'}>
                                                            {signedRupees(entry.amount_paise)}
                                                        </span>
                                                        <span className="mc-entry-balance">₹{rupees(entry.balance_after_paise)}</span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </section>
                    )}

                    <section className="mc-section mc-faq" aria-label="Credits FAQ">
                        <h2 className="mc-section-title">Common questions</h2>
                        <details><summary>How do Frioo Credits work?</summary>
                            <p>You buy a plan at our store and we add the credits here. Every order then takes the amount from your balance automatically, oldest expiring credits first.</p></details>
                        <details><summary>Where can I buy a plan?</summary>
                            <p>At the Frioo store in Visakhapatnam, or by calling us. Credits cannot be bought online.</p></details>
                        <details><summary>Do credits expire?</summary>
                            <p>Yes. Each plan carries its own validity and the date is shown against every credit above. We send you a reminder before anything expires.</p></details>
                        <details><summary>Can I transfer my credits to someone else?</summary>
                            <p>No. Credits stay with the account they were issued to.</p></details>
                        <details><summary>Can I withdraw credits as cash?</summary>
                            <p>No. Credits can only be spent on Frioo orders.</p></details>
                        <details><summary>What happens if my order is refunded?</summary>
                            <p>Whatever you paid in credits comes back as credits. If those credits had already expired, we return them as fresh credits valid for 7 days.</p></details>
                    </section>
                </>
            )}

            <style>{`
                .mc-page { max-width: 860px; margin: 0 auto; padding: var(--fr-s7) var(--fr-s5) var(--fr-s10); }
                .mc-head { margin-bottom: var(--fr-s6); }
                .mc-eyebrow { margin: 0; font-family: var(--fr-font-mono); font-size: var(--fr-fs-label); letter-spacing: 0.12em; text-transform: uppercase; color: var(--fr-text-3); }
                .mc-title { margin: 4px 0 0; font-family: var(--fr-font-display); font-size: var(--fr-fs-headline); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .mc-signin { padding: var(--fr-s8) 0; text-align: center; color: var(--fr-text-2); }
                .mc-skeleton { height: 160px; border-radius: var(--fr-r-card); background: var(--fr-surface-2); }
                .mc-error { display: flex; flex-wrap: wrap; align-items: center; gap: var(--fr-s3); padding: var(--fr-s4); margin-bottom: var(--fr-s5); background: #FDF3F2; border: 1px solid #E8B4AE; border-radius: var(--fr-r-card); font-size: var(--fr-fs-caption); color: #7A2E25; }
                .mc-error button { background: none; border: none; font: inherit; font-weight: 700; color: #7A2E25; text-decoration: underline; cursor: pointer; }

                .mc-overview { padding: var(--fr-s6); background: var(--fr-surface-2); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); margin-bottom: var(--fr-s5); }
                .mc-balance { display: flex; flex-direction: column; gap: var(--fr-s2); padding-bottom: var(--fr-s5); border-bottom: 1px solid var(--fr-line); }
                .mc-balance-label { font-size: var(--fr-fs-caption); color: var(--fr-text-3); }
                .mc-balance-value { font-family: var(--fr-font-display); font-size: 2.5rem; font-weight: var(--fr-fw-bold); line-height: 1.1; color: var(--fr-brand); font-variant-numeric: tabular-nums; }
                .mc-facts { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--fr-s4); margin: var(--fr-s5) 0 0; }
                .mc-facts dt { font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .mc-facts dd { margin: 2px 0 0; font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); font-variant-numeric: tabular-nums; }
                .mc-suspended { color: #B23A2E; }

                .mc-pill { align-self: flex-start; padding: 3px 10px; border-radius: var(--fr-r-pill); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-semibold); }
                .mc-pill-soon { background: #FDECEA; color: #A3352A; }
                .mc-pill-near { background: #FFF4DA; color: #7A5B14; }
                .mc-pill-calm { background: var(--fr-brand-tint, #E8F2EA); color: var(--fr-brand); }
                .mc-pill-past { background: var(--fr-surface-2); color: var(--fr-text-3); }

                .mc-notice { padding: var(--fr-s4); margin-bottom: var(--fr-s5); background: #FFF8E6; border: 1px solid #E8D9A8; border-radius: var(--fr-r-card); font-size: var(--fr-fs-caption); line-height: 1.55; color: #6B5518; }

                .mc-section { margin-bottom: var(--fr-s7); }
                .mc-section-title { margin: 0 0 4px; font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .mc-section-hint { margin: 0 0 var(--fr-s4); font-size: var(--fr-fs-caption); color: var(--fr-text-3); }

                .mc-lots { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--fr-s3); }
                .mc-lot { display: flex; gap: var(--fr-s4); padding: var(--fr-s5); background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); }
                .mc-lot-order { flex-shrink: 0; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--fr-surface-2); font-family: var(--fr-font-mono); font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .mc-lot-main { flex: 1; min-width: 0; }
                .mc-lot-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--fr-s2); }
                .mc-lot-name { margin: 0; font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .mc-lot-amounts { margin: 6px 0 0; font-size: var(--fr-fs-caption); color: var(--fr-text-2); }
                .mc-lot-amounts strong { font-size: var(--fr-fs-body); color: var(--fr-text-1); font-variant-numeric: tabular-nums; }
                .mc-lot-bonus { color: var(--fr-brand); font-weight: var(--fr-fw-semibold); }
                .mc-lot-bar { height: 6px; margin: var(--fr-s3) 0; border-radius: 999px; background: var(--fr-surface-2); overflow: hidden; }
                .mc-lot-bar span { display: block; height: 100%; border-radius: 999px; background: var(--fr-brand); transition: width var(--fr-dur-slow, 400ms) var(--fr-ease-standard, ease); }
                .mc-lot-dates { margin: 0; font-size: var(--fr-fs-label); color: var(--fr-text-3); }

                .mc-month { margin-bottom: var(--fr-s5); }
                .mc-month-label { margin: 0 0 var(--fr-s2); font-family: var(--fr-font-mono); font-size: var(--fr-fs-label); letter-spacing: 0.1em; text-transform: uppercase; color: var(--fr-text-3); }
                .mc-entries { list-style: none; margin: 0; padding: 0; }
                .mc-entry { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--fr-s4); padding: var(--fr-s4) 0; border-bottom: 1px solid var(--fr-line); }
                .mc-entry-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
                .mc-entry-label { font-size: var(--fr-fs-body); font-weight: var(--fr-fw-semibold); color: var(--fr-text-1); }
                .mc-entry-hint { font-size: var(--fr-fs-caption); color: var(--fr-text-2); }
                .mc-entry-link { color: var(--fr-brand); }
                .mc-entry-meta { font-family: var(--fr-font-mono); font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .mc-entry-side { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; font-variant-numeric: tabular-nums; }
                .mc-amt-pos { font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: #1B7A4B; }
                .mc-amt-neg { font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .mc-entry-balance { font-size: var(--fr-fs-label); color: var(--fr-text-3); }

                .mc-faq details { border-bottom: 1px solid var(--fr-line); }
                .mc-faq summary { padding: var(--fr-s4) 0; font-size: var(--fr-fs-body); font-weight: var(--fr-fw-semibold); color: var(--fr-text-1); cursor: pointer; }
                .mc-faq summary:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
                .mc-faq p { margin: 0 0 var(--fr-s4); font-size: var(--fr-fs-caption); line-height: 1.6; color: var(--fr-text-2); }

                .mc-empty { padding: var(--fr-s7) var(--fr-s6); background: var(--fr-surface-2); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); text-align: center; }
                .mc-empty-title { margin: 0 0 var(--fr-s3); font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .mc-empty-text { max-width: 52ch; margin: 0 auto var(--fr-s6); font-size: var(--fr-fs-body); line-height: 1.6; color: var(--fr-text-2); }
                .mc-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--fr-s4); margin-bottom: var(--fr-s6); text-align: left; }
                .mc-plan { padding: var(--fr-s5); background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); }
                .mc-plan-name { margin: 0 0 var(--fr-s2); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .mc-plan-value { margin: 0; font-size: var(--fr-fs-caption); color: var(--fr-text-2); }
                .mc-plan-value strong { color: var(--fr-brand); }
                .mc-plan-meta { margin: 4px 0 0; font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .mc-empty-how { max-width: 52ch; margin: 0 auto var(--fr-s6); }
                .mc-how-title { margin: 0 0 var(--fr-s2); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .mc-empty-how p { margin: 0 0 var(--fr-s2); font-size: var(--fr-fs-caption); line-height: 1.6; color: var(--fr-text-2); }
                .mc-how-note { color: var(--fr-text-3); }
                .mc-empty-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--fr-s3); }
                .mc-btn { display: inline-flex; align-items: center; min-height: 48px; padding: 0 var(--fr-s6); border-radius: var(--fr-r-control); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-semibold); text-decoration: none; }
                .mc-btn-primary { background: var(--fr-brand); color: var(--fr-on-brand); }
                .mc-btn-ghost { background: var(--fr-surface); color: var(--fr-text-1); border: 1px solid var(--fr-line-strong); }

                @media (max-width: 720px) {
                    .mc-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .mc-balance-value { font-size: 2rem; }
                    .mc-entry { flex-direction: column; gap: var(--fr-s2); }
                    .mc-entry-side { flex-direction: row; align-items: baseline; gap: var(--fr-s3); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .mc-lot-bar span { transition: none; }
                }
            `}</style>
        </main>
    );
}
