export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const ORIGIN_OPTIONS = ['Indian', 'Imported'];

export const PER_100G_FIELDS = [
    { key: 'calories_kcal', label: 'Calories (kcal)' },
    { key: 'protein_g', label: 'Protein (g)' },
    { key: 'carbohydrates_g', label: 'Carbohydrates (g)' },
    { key: 'natural_sugar_g', label: 'Natural sugar (g)' },
    { key: 'dietary_fiber_g', label: 'Dietary fiber (g)' },
    { key: 'total_fat_g', label: 'Total fat (g)' },
    { key: 'saturated_fat_g', label: 'Saturated fat (g)' },
    { key: 'vitamin_c_mg', label: 'Vitamin C (mg)' },
    { key: 'vitamin_a_mcg_rae', label: 'Vitamin A (mcg RAE)' },
    { key: 'vitamin_k_mcg', label: 'Vitamin K (mcg)' },
    { key: 'vitamin_e_mg', label: 'Vitamin E (mg)' },
    { key: 'vitamin_b6_mg', label: 'Vitamin B6 (mg)' },
    { key: 'folate_mcg', label: 'Folate (mcg)' },
    { key: 'potassium_mg', label: 'Potassium (mg)' },
    { key: 'magnesium_mg', label: 'Magnesium (mg)' },
    { key: 'calcium_mg', label: 'Calcium (mg)' },
    { key: 'iron_mg', label: 'Iron (mg)' },
    { key: 'sodium_mg', label: 'Sodium (mg)' },
    { key: 'water_g', label: 'Water (g)' },
    { key: 'glycemic_index', label: 'Glycemic index' }
];

export const PROFILE_TEXT_FIELDS = [
    { key: 'english_name', label: 'English name', placeholder: 'Apple' },
    { key: 'telugu_name', label: 'Telugu name', placeholder: 'యాపిల్' },
    { key: 'scientific_name', label: 'Scientific name', placeholder: 'Malus domestica' },
    { key: 'nutrition_source', label: 'Nutrition source', placeholder: 'USDA FoodData Central - Apples, with skin, raw' }
];

export const BENEFIT_SUGGESTIONS = [
    'Heart Health', 'Immunity', 'Digestion', 'Weight Management', 'Skin Health',
    'Hair Health', 'Eye Health', 'Bone Health', 'Hydration', 'Brain Health',
    'Pregnancy Nutrition', 'Sports Recovery', 'Blood Pressure Support',
    'Diabetes Friendly', 'Anemia Support', 'Constipation Relief',
    'Gut Health', 'Energy Support'
];

export const SUITABILITY_SUGGESTIONS = [
    '6 Months+', '8 Months+', '12 Months+', 'Children', 'Teenagers', 'Adults',
    'Seniors', 'Pregnant Women', 'Breastfeeding Mothers', 'Athletes', 'Diabetics'
];

const PER_100G_KEYS = PER_100G_FIELDS.map(({ key }) => key);

export const MIRROR_KEYS = ['calories', 'protein', 'carbs', 'fat'];

export const PROFILE_KEYS = [
    'product_name', 'english_name', 'telugu_name', 'scientific_name', 'origin',
    'season_india', 'average_weight_g', 'edible_portion_percent',
    'nutrition_source', 'nutrition_per_100g', 'health_benefits', 'suitable_for',
    'description_en', 'description_te'
];

const MANAGED_KEYS = [...MIRROR_KEYS, ...PROFILE_KEYS];

const asText = (value) => (value === null || value === undefined ? '' : String(value));

const asNumberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const asList = (value) => (Array.isArray(value) ? value.filter(Boolean).map(String) : []);

export const EMPTY_PROFILE = {
    english_name: '',
    telugu_name: '',
    scientific_name: '',
    origin: '',
    season_india: [],
    average_weight_g: '',
    edible_portion_percent: '',
    nutrition_source: '',
    description_te: '',
    health_benefits: [],
    suitable_for: [],
    per_100g: Object.fromEntries(PER_100G_KEYS.map((key) => [key, '']))
};

export const splitUnmanagedNutrition = (nutrition) => {
    if (!nutrition || typeof nutrition !== 'object') return {};
    return Object.fromEntries(
        Object.entries(nutrition).filter(([key]) => !MANAGED_KEYS.includes(key))
    );
};

export const toProfileForm = (nutrition) => {
    if (!nutrition || typeof nutrition !== 'object') return EMPTY_PROFILE;

    const per100g = nutrition.nutrition_per_100g || {};

    return {
        english_name: asText(nutrition.english_name),
        telugu_name: asText(nutrition.telugu_name),
        scientific_name: asText(nutrition.scientific_name),
        origin: asText(nutrition.origin),
        season_india: asList(nutrition.season_india),
        average_weight_g: asText(nutrition.average_weight_g),
        edible_portion_percent: asText(nutrition.edible_portion_percent),
        nutrition_source: asText(nutrition.nutrition_source),
        description_te: asText(nutrition.description_te),
        health_benefits: asList(nutrition.health_benefits),
        suitable_for: asList(nutrition.suitable_for),
        per_100g: Object.fromEntries(
            PER_100G_KEYS.map((key) => [key, asText(per100g[key])])
        )
    };
};

export const isProfileFilled = (profile) => {
    if (!profile) return false;

    const {
        english_name, telugu_name, scientific_name, origin, nutrition_source,
        description_te, season_india, health_benefits, suitable_for,
        average_weight_g, edible_portion_percent, per_100g
    } = profile;

    const hasText = [
        english_name, telugu_name, scientific_name, origin,
        nutrition_source, description_te, average_weight_g, edible_portion_percent
    ].some((value) => asText(value).trim() !== '');

    const hasList = [season_india, health_benefits, suitable_for]
        .some((list) => asList(list).length > 0);

    const hasNutrient = PER_100G_KEYS.some((key) => asText(per_100g?.[key]).trim() !== '');

    return hasText || hasList || hasNutrient;
};

const buildMirrors = (profile, manual) => {
    if (!isProfileFilled(profile)) {
        return {
            calories: asNumberOrNull(manual?.calories) ?? 0,
            protein: asNumberOrNull(manual?.protein) ?? 0,
            carbs: asNumberOrNull(manual?.carbs) ?? 0,
            fat: asNumberOrNull(manual?.fat) ?? 0
        };
    }

    const { per_100g: per100g } = profile;

    return {
        calories: asNumberOrNull(per100g?.calories_kcal) ?? 0,
        protein: asNumberOrNull(per100g?.protein_g) ?? 0,
        carbs: asNumberOrNull(per100g?.carbohydrates_g) ?? 0,
        fat: asNumberOrNull(per100g?.total_fat_g) ?? 0
    };
};

export const buildNutritionPayload = ({ profile, manual, unmanaged, title, description }) => {
    const base = { ...(unmanaged || {}), ...buildMirrors(profile, manual) };

    if (!isProfileFilled(profile)) return base;

    return {
        ...base,
        product_name: title || '',
        english_name: profile.english_name.trim(),
        telugu_name: profile.telugu_name.trim(),
        scientific_name: profile.scientific_name.trim(),
        origin: profile.origin.trim(),
        season_india: asList(profile.season_india),
        average_weight_g: asNumberOrNull(profile.average_weight_g),
        edible_portion_percent: asNumberOrNull(profile.edible_portion_percent),
        nutrition_source: profile.nutrition_source.trim(),
        nutrition_per_100g: Object.fromEntries(
            PER_100G_KEYS.map((key) => [key, asNumberOrNull(profile.per_100g?.[key])])
        ),
        health_benefits: asList(profile.health_benefits),
        suitable_for: asList(profile.suitable_for),
        description_en: description || '',
        description_te: profile.description_te.trim()
    };
};
