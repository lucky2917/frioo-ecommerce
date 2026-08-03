import { useState } from 'react';
import {
    MONTHS, ORIGIN_OPTIONS, PER_100G_FIELDS, PROFILE_TEXT_FIELDS,
    BENEFIT_SUGGESTIONS, SUITABILITY_SUGGESTIONS
} from '../../utils/productProfile';

function TagField({ id, label, hint, value, suggestions, placeholder, onChange }) {
    const [draft, setDraft] = useState('');

    const addTag = (raw) => {
        const tag = raw.trim();
        if (!tag || value.includes(tag)) return;
        onChange([...value, tag]);
        setDraft('');
    };

    const removeTag = (tag) => onChange(value.filter((item) => item !== tag));

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addTag(draft);
            return;
        }
        if (event.key === 'Backspace' && draft === '' && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    return (
        <div className="adm-field pnp-full">
            <label className="adm-label" htmlFor={id}>{label}</label>
            {hint && <p className="pnp-hint">{hint}</p>}

            {value.length > 0 && (
                <ul className="pnp-tags">
                    {value.map((tag) => (
                        <li key={tag} className="pnp-tag">
                            <span>{tag}</span>
                            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="pnp-tag-entry">
                <input
                    id={id}
                    className="adm-input"
                    type="text"
                    list={`${id}-options`}
                    value={draft}
                    placeholder={placeholder}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => addTag(draft)} disabled={!draft.trim()}>Add</button>
            </div>

            <datalist id={`${id}-options`}>
                {suggestions.filter((item) => !value.includes(item)).map((item) => (
                    <option key={item} value={item} />
                ))}
            </datalist>
        </div>
    );
}

export default function ProductNutritionProfile({ value, onChange }) {
    const setField = (key, fieldValue) => onChange({ ...value, [key]: fieldValue });

    const setNutrient = (key, fieldValue) => onChange({
        ...value,
        per_100g: { ...value.per_100g, [key]: fieldValue }
    });

    const toggleMonth = (month) => {
        const active = value.season_india.includes(month);
        const next = active
            ? value.season_india.filter((item) => item !== month)
            : [...value.season_india, month];
        setField('season_india', MONTHS.filter((item) => next.includes(item)));
    };

    return (
        <div className="pnp">
            <div className="pnp-grid">
                {PROFILE_TEXT_FIELDS.map(({ key, label, placeholder }) => (
                    <div key={key} className={`adm-field${key === 'nutrition_source' ? ' pnp-full' : ''}`}>
                        <label className="adm-label" htmlFor={`pnp-${key}`}>{label}</label>
                        <input
                            id={`pnp-${key}`}
                            className="adm-input"
                            type="text"
                            value={value[key]}
                            placeholder={placeholder}
                            onChange={(event) => setField(key, event.target.value)}
                        />
                    </div>
                ))}

                <div className="adm-field">
                    <label className="adm-label" htmlFor="pnp-origin">Origin</label>
                    <select id="pnp-origin" className="adm-input" value={value.origin} onChange={(event) => setField('origin', event.target.value)}>
                        <option value="">Not set</option>
                        {ORIGIN_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                </div>

                <div className="adm-field">
                    <label className="adm-label" htmlFor="pnp-weight">Average weight (g)</label>
                    <input id="pnp-weight" className="adm-input" type="number" step="1" min="0" value={value.average_weight_g} placeholder="Leave blank if sold by weight" onChange={(event) => setField('average_weight_g', event.target.value)} />
                </div>

                <div className="adm-field">
                    <label className="adm-label" htmlFor="pnp-edible">Edible portion (%)</label>
                    <input id="pnp-edible" className="adm-input" type="number" step="1" min="0" max="100" value={value.edible_portion_percent} placeholder="90" onChange={(event) => setField('edible_portion_percent', event.target.value)} />
                </div>
            </div>

            <div className="adm-field pnp-full">
                <span className="adm-label">Season in India</span>
                <p className="pnp-hint">Select every month this product is normally in season.</p>
                <div className="pnp-months">
                    {MONTHS.map((month) => {
                        const active = value.season_india.includes(month);
                        return (
                            <button
                                key={month}
                                type="button"
                                className={`pnp-month${active ? ' pnp-month-on' : ''}`}
                                aria-pressed={active}
                                onClick={() => toggleMonth(month)}
                            >
                                {month.slice(0, 3)}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="adm-field pnp-full">
                <span className="adm-label">Nutrition per 100g edible portion</span>
                <p className="pnp-hint">Leave a field blank when no trustworthy source exists. Blank is stored as no value, which is different from zero.</p>
                <div className="pnp-nutrients">
                    {PER_100G_FIELDS.map(({ key, label }) => (
                        <div key={key} className="adm-field">
                            <label className="pnp-nutrient-label" htmlFor={`pnp-n-${key}`}>{label}</label>
                            <input
                                id={`pnp-n-${key}`}
                                className="adm-input"
                                type="number"
                                step="0.001"
                                min="0"
                                value={value.per_100g[key]}
                                onChange={(event) => setNutrient(key, event.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <TagField
                id="pnp-benefits"
                label="Health benefits"
                hint="Only evidence supported benefits. Type and press Enter, or pick a suggestion."
                value={value.health_benefits}
                suggestions={BENEFIT_SUGGESTIONS}
                placeholder="Heart Health"
                onChange={(next) => setField('health_benefits', next)}
            />

            <TagField
                id="pnp-suitable"
                label="Suitable for"
                hint="Age groups and lifestyles this product suits."
                value={value.suitable_for}
                suggestions={SUITABILITY_SUGGESTIONS}
                placeholder="Adults"
                onChange={(next) => setField('suitable_for', next)}
            />

            <div className="adm-field pnp-full">
                <label className="adm-label" htmlFor="pnp-desc-te">Telugu description</label>
                <textarea
                    id="pnp-desc-te"
                    className="adm-textarea"
                    rows="4"
                    value={value.description_te}
                    placeholder="సహజ తీపి మరియు ఫైబర్ సమృద్ధిగా ఉండే పండు."
                    onChange={(event) => setField('description_te', event.target.value)}
                />
            </div>

            <style>{`
                .pnp { display: flex; flex-direction: column; gap: var(--fr-s5); }
                .pnp-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--fr-s4); }
                .pnp-full { grid-column: 1 / -1; }
                .pnp-hint { margin: 0 0 var(--fr-s2); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); line-height: 1.5; color: var(--adm-text-2); }
                .pnp-months { display: flex; flex-wrap: wrap; gap: var(--fr-s2); }
                .pnp-month { min-height: 36px; padding: 0 var(--fr-s3); background: var(--adm-surface); border: 1px solid var(--adm-line); border-radius: 6px; font-family: inherit; font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-semibold); color: var(--adm-text-2); cursor: pointer; }
                .pnp-month:hover { border-color: var(--fr-brand); color: var(--fr-brand); }
                .pnp-month:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 2px; }
                .pnp-month-on { background: var(--fr-brand); border-color: var(--fr-brand); color: var(--fr-on-brand); }
                .pnp-nutrients { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--fr-s3); }
                .pnp-nutrient-label { font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-medium); color: var(--adm-text-2); }
                .pnp-tags { display: flex; flex-wrap: wrap; gap: var(--fr-s2); list-style: none; margin: 0 0 var(--fr-s2); padding: 0; }
                .pnp-tag { display: inline-flex; align-items: center; gap: var(--fr-s2); padding: 4px 6px 4px 10px; background: var(--adm-surface-2); border: 1px solid var(--adm-line); border-radius: 999px; font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-semibold); color: var(--adm-text); }
                .pnp-tag button { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: none; border: none; border-radius: 50%; color: var(--adm-text-2); cursor: pointer; }
                .pnp-tag button:hover { background: var(--adm-line); color: var(--adm-text); }
                .pnp-tag button:focus-visible { outline: 2px solid var(--fr-brand); outline-offset: 1px; }
                .pnp-tag-entry { display: flex; gap: var(--fr-s2); }
                .pnp-tag-entry .adm-input { flex: 1; }
                @media (max-width: 720px) {
                    .pnp-grid { grid-template-columns: 1fr; }
                    .pnp-nutrients { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
}
