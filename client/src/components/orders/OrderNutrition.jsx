import { KEY_NUTRIENTS, formatNutrient, formatGrams } from '../../utils/nutritionMath';

export default function OrderNutrition({ summary, compact = false }) {
    if (!summary?.values) return null;

    const { values, partial = {}, edible_grams: edibleGrams, excluded_count: excludedCount = 0 } = summary;
    const shown = compact ? KEY_NUTRIENTS.slice(0, 4) : KEY_NUTRIENTS;

    return (
        <section className="on" aria-label="Nutrition in this order">
            <div className="on-head">
                <h3 className="on-title">Nutrition you ordered</h3>
                {Number.isFinite(edibleGrams) && edibleGrams > 0 && (
                    <span className="on-weight">{formatGrams(edibleGrams)} edible</span>
                )}
            </div>

            <dl className="on-grid">
                {shown.map(({ key, label, unit, decimals }) => (
                    <div key={key} className="on-item">
                        <dt className="on-label">{label}</dt>
                        <dd className="on-value">
                            {partial[key] > 0 && <span className="on-approx" aria-hidden="true">at least </span>}
                            <strong>{formatNutrient(values[key], decimals)}</strong>
                            <span className="on-unit">{unit}</span>
                        </dd>
                    </div>
                ))}
            </dl>

            <p className="on-note">
                Estimated from USDA and ICMR reference values at the time you ordered.
                {excludedCount > 0 && ` ${excludedCount} ${excludedCount === 1 ? 'item was' : 'items were'} not counted.`}
            </p>

            <style>{`
                .on { padding: var(--fr-s5); background: var(--fr-surface-2, #F4F7F4); border: 1px solid var(--fr-line); border-radius: var(--fr-r-card, 12px); }
                .on-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fr-s3); margin-bottom: var(--fr-s4); }
                .on-title { margin: 0; font-family: var(--fr-font-display); font-size: var(--fr-fs-body-lg, 1rem); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-text-1); }
                .on-weight { font-family: var(--fr-font-mono); font-size: var(--fr-fs-label); color: var(--fr-text-3); white-space: nowrap; }
                .on-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--fr-s4) var(--fr-s3); margin: 0 0 var(--fr-s3); }
                .on-item { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
                .on-label { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); font-weight: var(--fr-fw-medium); color: var(--fr-text-3); }
                .on-value { margin: 0; display: flex; align-items: baseline; gap: 3px; flex-wrap: wrap; font-variant-numeric: tabular-nums; }
                .on-value strong { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); color: var(--fr-brand); }
                .on-unit { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .on-approx { font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); color: var(--fr-text-3); }
                .on-note { margin: 0; font-family: var(--fr-font-sans); font-size: var(--fr-fs-label); line-height: 1.5; color: var(--fr-text-3); }
                @media (max-width: 560px) {
                    .on-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </section>
    );
}
