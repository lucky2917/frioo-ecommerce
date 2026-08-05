import { useState } from 'react';
import { rupees, formatDateTime } from '../../utils/creditFormat';

const REQUEST_STATUS = {
    pending: { label: 'Waiting for the store to call you', tone: 'wait' },
    contacted: { label: 'The store has been in touch', tone: 'wait' },
    approved: { label: 'Activated', tone: 'done' },
    rejected: { label: 'Not activated', tone: 'stop' },
    cancelled: { label: 'Cancelled', tone: 'stop' }
};

export default function PlanCatalogue({
    plans, openRequest, phone, busy, onRequest, onCancel, heading = 'Buy Frioo Credits'
}) {
    const [chosen, setChosen] = useState(null);
    const [note, setNote] = useState('');
    const [contact, setContact] = useState(phone || '');

    if (openRequest) {
        const meta = REQUEST_STATUS[openRequest.status] || REQUEST_STATUS.pending;
        return (
            <section className="pc" aria-label="Your plan request">
                <div className={`pc-status pc-status-${meta.tone}`}>
                    <p className="pc-status-label">{meta.label}</p>
                    <h2 className="pc-status-plan">{openRequest.plan_name}</h2>
                    <p className="pc-status-terms">
                        Pay ₹{rupees(openRequest.price_paise)} at the store, receive ₹{rupees(openRequest.credit_paise)} in credits,
                        valid {openRequest.validity_days} days.
                    </p>
                    <p className="pc-status-meta">Requested {formatDateTime(openRequest.created_at)}</p>

                    <p className="pc-status-next">
                        Our team will call you to arrange payment. Credits appear here the moment they activate your plan.
                        Nothing is charged online.
                    </p>

                    <button type="button" className="pc-cancel" disabled={busy}
                        onClick={() => onCancel(openRequest.id)}>
                        {busy ? 'Cancelling…' : 'Cancel this request'}
                    </button>
                </div>
            </section>
        );
    }

    if (!plans || plans.length === 0) return null;

    return (
        <section className="pc" aria-label="Frioo Credit plans">
            <h2 className="pc-title">{heading}</h2>
            <p className="pc-sub">
                Pay once at the store and spend it across your orders. Choose a plan and we will call you to arrange payment.
            </p>

            <ul className="pc-list">
                {plans.map((plan) => {
                    const bonus = plan.credit_paise - plan.price_paise;
                    const perDay = Math.round(plan.credit_paise / 100 / plan.validity_days);
                    const active = chosen === plan.id;
                    return (
                        <li key={plan.id}>
                            <button
                                type="button"
                                className={`pc-plan${active ? ' pc-plan-on' : ''}`}
                                aria-pressed={active}
                                onClick={() => setChosen(active ? null : plan.id)}
                            >
                                <span className="pc-plan-head">
                                    <span className="pc-plan-name">{plan.name}</span>
                                    {bonus > 0 && <span className="pc-plan-bonus">₹{rupees(bonus)} extra</span>}
                                </span>
                                <span className="pc-plan-value">
                                    <span className="pc-plan-pay">Pay ₹{rupees(plan.price_paise)}</span>
                                    <span className="pc-plan-get">Get ₹{rupees(plan.credit_paise)}</span>
                                </span>
                                <span className="pc-plan-meta">
                                    Valid {plan.validity_days} days · about ₹{perDay.toLocaleString('en-IN')} of fruit a day to use it all
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            {chosen && (
                <div className="pc-form">
                    <div className="pc-field">
                        <label className="pc-label" htmlFor="pc-phone">Phone number to call you on</label>
                        <input id="pc-phone" className="pc-input" type="tel" value={contact}
                            onChange={(event) => setContact(event.target.value)}
                            placeholder="98480 12345" />
                    </div>
                    <div className="pc-field">
                        <label className="pc-label" htmlFor="pc-note">Anything we should know? (optional)</label>
                        <input id="pc-note" className="pc-input" type="text" value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Best time to call, or which store" />
                    </div>
                    <button
                        type="button"
                        className="pc-submit"
                        disabled={busy || contact.trim().length < 6}
                        onClick={() => onRequest({ plan_id: chosen, contact_phone: contact.trim(), note: note.trim() })}
                    >
                        {busy ? 'Sending…' : 'Request this plan'}
                    </button>
                    <p className="pc-disclaimer">
                        This sends a request to our team. No payment is taken online and nothing is charged now.
                    </p>
                </div>
            )}

            <style>{`
                .pc { padding: var(--fr-s6); background: var(--fr-surface-2); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); margin-bottom: var(--fr-s6); }
                .pc-title { margin: 0 0 4px; font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .pc-sub { margin: 0 0 var(--fr-s5); font-size: var(--fr-fs-caption); line-height: 1.55; color: var(--fr-text-2); }
                .pc-list { list-style: none; margin: 0 0 var(--fr-s4); padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--fr-s3); }
                .pc-plan { display: flex; flex-direction: column; gap: var(--fr-s2); width: 100%; padding: var(--fr-s5); background: var(--fr-surface); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); text-align: left; cursor: pointer; transition: border-color var(--fr-dur-quick) var(--fr-ease-standard); }
                .pc-plan:hover { border-color: var(--fr-brand); }
                .pc-plan:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
                .pc-plan-on { border-color: var(--fr-brand); box-shadow: inset 0 0 0 1px var(--fr-brand); }
                .pc-plan-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fr-s2); }
                .pc-plan-name { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .pc-plan-bonus { padding: 2px 8px; border-radius: var(--fr-r-pill); background: var(--fr-brand-tint, #E8F2EA); color: var(--fr-brand); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-semibold); white-space: nowrap; }
                .pc-plan-value { display: flex; align-items: baseline; gap: var(--fr-s3); font-variant-numeric: tabular-nums; }
                .pc-plan-pay { font-size: var(--fr-fs-caption); color: var(--fr-text-2); }
                .pc-plan-get { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); color: var(--fr-brand); }
                .pc-plan-meta { font-size: var(--fr-fs-label); line-height: 1.5; color: var(--fr-text-3); }
                .pc-form { display: flex; flex-direction: column; gap: var(--fr-s3); padding-top: var(--fr-s4); border-top: 1px solid var(--fr-line); }
                .pc-field { display: flex; flex-direction: column; gap: 4px; }
                .pc-label { font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); color: var(--fr-text-2); }
                .pc-input { min-height: 48px; padding: 0 var(--fr-s4); background: var(--fr-surface); border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: inherit; font-size: var(--fr-fs-body); color: var(--fr-text-1); }
                .pc-input:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 1px; }
                .pc-submit { min-height: 52px; background: var(--fr-brand); color: var(--fr-on-brand); border: none; border-radius: var(--fr-r-control); font-family: inherit; font-size: var(--fr-fs-control); font-weight: var(--fr-fw-bold); cursor: pointer; }
                .pc-submit:disabled { opacity: 0.55; cursor: default; }
                .pc-disclaimer { margin: 0; font-size: var(--fr-fs-label); line-height: 1.5; color: var(--fr-text-3); }
                .pc-status { padding: var(--fr-s5); background: var(--fr-surface); border: 1px solid var(--fr-line); border-left: 3px solid var(--fr-brand); border-radius: var(--fr-r-card); }
                .pc-status-stop { border-left-color: #B23A2E; }
                .pc-status-done { border-left-color: #1B7A4B; }
                .pc-status-label { margin: 0; font-family: var(--fr-font-mono); font-size: var(--fr-fs-label); letter-spacing: 0.08em; text-transform: uppercase; color: var(--fr-text-3); }
                .pc-status-plan { margin: 4px 0 var(--fr-s2); font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .pc-status-terms { margin: 0 0 var(--fr-s2); font-size: var(--fr-fs-caption); line-height: 1.55; color: var(--fr-text-2); }
                .pc-status-meta { margin: 0 0 var(--fr-s4); font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .pc-status-next { margin: 0 0 var(--fr-s4); padding: var(--fr-s3) var(--fr-s4); background: var(--fr-surface-2); border-radius: var(--fr-r-card); font-size: var(--fr-fs-caption); line-height: 1.55; color: var(--fr-text-2); }
                .pc-cancel { min-height: 44px; padding: 0 var(--fr-s5); background: none; border: 1px solid var(--fr-line-strong); border-radius: var(--fr-r-control); font-family: inherit; font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-semibold); color: var(--fr-text-2); cursor: pointer; }
                .pc-cancel:hover:not(:disabled) { border-color: #B23A2E; color: #B23A2E; }
                .pc-cancel:disabled { opacity: 0.6; cursor: default; }
                @media (prefers-reduced-motion: reduce) { .pc-plan { transition: none; } }
            `}</style>
        </section>
    );
}
