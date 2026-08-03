export const KEY_NUTRIENTS = [
    { key: 'calories', source: 'calories_kcal', label: 'Calories', unit: 'kcal', decimals: 0 },
    { key: 'protein', source: 'protein_g', label: 'Protein', unit: 'g', decimals: 1 },
    { key: 'carbs', source: 'carbohydrates_g', label: 'Carbs', unit: 'g', decimals: 1 },
    { key: 'sugar', source: 'natural_sugar_g', label: 'Natural sugar', unit: 'g', decimals: 1 },
    { key: 'fiber', source: 'dietary_fiber_g', label: 'Fiber', unit: 'g', decimals: 1 },
    { key: 'fat', source: 'total_fat_g', label: 'Fat', unit: 'g', decimals: 1 },
    { key: 'vitaminC', source: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg', decimals: 0 },
    { key: 'potassium', source: 'potassium_mg', label: 'Potassium', unit: 'mg', decimals: 0 }
];

const GRAM_VARIANT = /^(\d+(?:\.\d+)?)\s*g$/i;
const KILO_VARIANT = /^(\d+(?:\.\d+)?)\s*kg$/i;

export const resolveUnitGrams = ({ variant, unit, averageWeightG }) => {
    const label = typeof variant === 'string' ? variant.trim() : '';

    const gramMatch = label.match(GRAM_VARIANT);
    if (gramMatch) return Number(gramMatch[1]);

    const kiloMatch = label.match(KILO_VARIANT);
    if (kiloMatch) return Number(kiloMatch[1]) * 1000;

    if (unit === 'kg') return 1000;

    const weight = Number(averageWeightG);
    return Number.isFinite(weight) && weight > 0 ? weight : null;
};

export const resolveEdibleGrams = ({ variant, unit, averageWeightG, ediblePortionPercent, qty }) => {
    const unitGrams = resolveUnitGrams({ variant, unit, averageWeightG });
    if (unitGrams === null) return null;

    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0) return null;

    const percent = Number(ediblePortionPercent);
    const edibleFactor = Number.isFinite(percent) && percent > 0 ? percent / 100 : 1;

    return unitGrams * quantity * edibleFactor;
};

const emptyTotals = () => Object.fromEntries(
    KEY_NUTRIENTS.map(({ key }) => [key, { value: 0, missingFrom: [] }])
);

export const summariseNutrition = (lines) => {
    const totals = emptyTotals();
    const included = [];
    const excluded = [];
    let edibleGrams = 0;

    for (const line of lines) {
        const { title, qty, variant, unit, nutrition } = line;
        const per100g = nutrition?.nutrition_per_100g;

        if (!per100g) {
            excluded.push({ title, reason: 'no-profile' });
            continue;
        }

        const grams = resolveEdibleGrams({
            variant,
            unit,
            averageWeightG: nutrition.average_weight_g,
            ediblePortionPercent: nutrition.edible_portion_percent,
            qty
        });

        if (grams === null) {
            excluded.push({ title, reason: 'no-weight' });
            continue;
        }

        edibleGrams += grams;
        included.push({ title, grams });

        for (const { key, source } of KEY_NUTRIENTS) {
            const per100 = per100g[source];
            if (per100 === null || per100 === undefined || !Number.isFinite(Number(per100))) {
                totals[key].missingFrom.push(title);
                continue;
            }
            totals[key].value += (Number(per100) * grams) / 100;
        }
    }

    return { totals, included, excluded, edibleGrams };
};

export const formatNutrient = (value, decimals) => {
    if (!Number.isFinite(value)) return '0';
    if (decimals === 0) return Math.round(value).toLocaleString('en-IN');
    const rounded = Math.round(value * 10 ** decimals) / 10 ** decimals;
    return rounded.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatGrams = (grams) => {
    if (!Number.isFinite(grams) || grams <= 0) return '0 g';
    if (grams >= 1000) {
        const kg = Math.round((grams / 1000) * 100) / 100;
        return `${kg.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`;
    }
    return `${Math.round(grams).toLocaleString('en-IN')} g`;
};

export const toOrderNutritionSnapshot = (summary) => {
    const { totals, edibleGrams, excluded } = summary;
    return {
        edible_grams: Math.round(edibleGrams),
        excluded_count: excluded.length,
        values: Object.fromEntries(
            KEY_NUTRIENTS.map(({ key, decimals }) => [
                key,
                Number(totals[key].value.toFixed(decimals))
            ])
        ),
        partial: Object.fromEntries(
            KEY_NUTRIENTS
                .filter(({ key }) => totals[key].missingFrom.length > 0)
                .map(({ key }) => [key, totals[key].missingFrom.length])
        )
    };
};
