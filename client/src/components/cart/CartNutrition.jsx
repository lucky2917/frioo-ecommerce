import { KEY_NUTRIENTS, formatNutrient, formatGrams } from '../../utils/nutritionMath';

export default function CartNutrition({ totals, included, excluded, edibleGrams, ready, heading = 'What you are getting' }) {
    if (!ready || included.length === 0) return null;

    const partialNutrients = KEY_NUTRIENTS.filter(({ key }) => totals[key].missingFrom.length > 0);

    return (
        <section className="cn" aria-label="Nutrition in your bag">
            <div className="cn-head">
                <h2 className="cn-title">{heading}</h2>
                <span className="cn-weight">{formatGrams(edibleGrams)} edible</span>
            </div>

            <dl className="cn-grid">
                {KEY_NUTRIENTS.map(({ key, label, unit, decimals }) => {
                    const { value, missingFrom } = totals[key];
                    const partial = missingFrom.length > 0;
                    return (
                        <div key={key} className="cn-item">
                            <dt className="cn-label">{label}</dt>
                            <dd className="cn-value">
                                {partial && <span className="cn-approx" aria-hidden="true">at least </span>}
                                <strong>{formatNutrient(value, decimals)}</strong>
                                <span className="cn-unit">{unit}</span>
                            </dd>
                        </div>
                    );
                })}
            </dl>

            <p className="cn-note">
                Estimated from USDA and ICMR reference values for {included.length} {included.length === 1 ? 'item' : 'items'}.
                Fresh produce varies with ripeness and variety, so treat these as a guide rather than a label.
            </p>

            {partialNutrients.length > 0 && (
                <p className="cn-note">
                    Shown as a minimum for {partialNutrients.map(({ label }) => label.toLowerCase()).join(', ')}, because no
                    published value exists for every item in your bag.
                </p>
            )}

            {excluded.length > 0 && (
                <p className="cn-note">
                    Not counted: {excluded.map(({ title }) => title).join(', ')}.
                </p>
            )}

            <style>{`
                .cn { padding: var(--fr-s5); background: var(--fr-surface-2, #F4F7F4); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card, 12px); }
                .cn-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fr-s3); margin-bottom: var(--fr-s4); }
                .cn-title { margin: 0; font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text-1); }
                .cn-weight { font-family: var(--fr-font-mono); font-size: var(--fr-fs-label); color: var(--fr-text-3); white-space: nowrap; }
                .cn-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--fr-s4) var(--fr-s3); margin: 0 0 var(--fr-s4); }
                .cn-item { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
                .cn-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); color: var(--fr-text-3); }
                .cn-value { margin: 0; display: flex; align-items: baseline; gap: 3px; flex-wrap: wrap; font-variant-numeric: tabular-nums; }
                .cn-value strong { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-brand); }
                .cn-unit { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .cn-approx { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .cn-note { margin: 0 0 var(--fr-s2); font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-regular); line-height: 1.5; color: var(--fr-text-3); }
                .cn-note:last-of-type { margin-bottom: 0; }
                @media (max-width: 560px) {
                    .cn-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </section>
    );
}
