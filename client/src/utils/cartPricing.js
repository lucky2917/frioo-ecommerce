const WEIGHT_VARIANT_MULTIPLIERS = { '250g': 0.25, '500g': 0.5, '1kg': 1 };

const supportsWeightVariants = (product) =>
    product?.category === 'Fresh Fruit' && product?.unit === 'kg';

export const resolveVariantMultiplier = (variant, product) => {
    const label = typeof variant === 'string' ? variant.trim() : '';
    const multiplier = WEIGHT_VARIANT_MULTIPLIERS[label];

    if (multiplier === undefined) return 1;
    if (!supportsWeightVariants(product)) return 1;

    return multiplier;
};

export const currentUnitPrice = (product, variant) => {
    const base = Number(product?.price_cents ?? 0) / 100;
    return base * resolveVariantMultiplier(variant, product);
};

const differs = (a, b) => Math.abs(Number(a) - Number(b)) > 0.005;

export const detectCartChanges = (cartItems, productsById) => {
    const changes = [];
    const priceUpdates = {};

    for (const item of cartItems) {
        const product = productsById.get(item.id);

        if (!product) {
            changes.push({
                key: item.originalKey,
                title: item.title,
                type: 'removed'
            });
            continue;
        }

        if (product.stock === 0) {
            changes.push({
                key: item.originalKey,
                title: item.title,
                type: 'unavailable'
            });
        }

        const expected = currentUnitPrice(product, item.variant);

        if (differs(expected, item.price)) {
            changes.push({
                key: item.originalKey,
                title: item.title,
                type: 'price',
                variant: item.variant,
                from: Number(item.price),
                to: expected,
                direction: expected > Number(item.price) ? 'up' : 'down'
            });
            priceUpdates[item.originalKey] = expected;
        }
    }

    return { changes, priceUpdates };
};

export const summariseChanges = (changes) => {
    const priceChanges = changes.filter((change) => change.type === 'price');
    const blocked = changes.filter((change) => change.type !== 'price');

    return {
        priceChanges,
        blocked,
        hasPriceChanges: priceChanges.length > 0,
        hasBlocking: blocked.length > 0
    };
};
