import { rupees } from '../../utils/creditFormat';

export default function OrderPaymentBreakdown({ order, compact = false }) {
    const credits = Number(order?.credits_applied_paise || 0);
    if (credits <= 0) return null;

    const total = Number(order?.total_amount_paise || 0);
    const due = Number(order?.amount_due_paise || 0);
    const fullyCovered = due === 0;

    return (
        <section className={`opb${compact ? ' opb-compact' : ''}`} aria-label="Payment breakdown">
            <div className="opb-head">
                <h3 className="opb-title">
                    {fullyCovered ? 'Paid using Frioo Credits' : 'Payment split'}
                </h3>
                <span className="opb-ref">Order #{order.id}</span>
            </div>

            <dl className="opb-rows">
                <div><dt>Order total</dt><dd>₹{rupees(total)}</dd></div>
                <div className="opb-credit"><dt>Frioo Credits used</dt><dd>−₹{rupees(credits)}</dd></div>
                <div className="opb-due">
                    <dt>{fullyCovered ? 'Nothing further to pay' : 'Paid another way'}</dt>
                    <dd>₹{rupees(due)}</dd>
                </div>
            </dl>

            <style>{`
                .opb { padding: var(--fr-s5); background: var(--fr-brand-tint, #E8F2EA); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card); }
                .opb-compact { padding: var(--fr-s4); }
                .opb-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fr-s3); margin-bottom: var(--fr-s3); }
                .opb-title { margin: 0; font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
                .opb-ref { font-family: var(--fr-font-mono); font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .opb-rows { display: flex; flex-direction: column; gap: var(--fr-s2); margin: 0; }
                .opb-rows > div { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fr-s3); font-size: var(--fr-fs-caption); color: var(--fr-text-2); font-variant-numeric: tabular-nums; }
                .opb-rows dt { margin: 0; }
                .opb-rows dd { margin: 0; }
                .opb-credit dd { font-weight: var(--fr-fw-bold); color: var(--fr-brand); }
                .opb-due { padding-top: var(--fr-s2); border-top: 1px solid var(--fr-line); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-bold); color: var(--fr-text-1); }
            `}</style>
        </section>
    );
}
