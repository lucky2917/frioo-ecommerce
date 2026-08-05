import { useEffect, useMemo, useRef, useState } from 'react';
import { useProducts } from './useProducts';
import { detectCartChanges, summariseChanges } from '../utils/cartPricing';

export const useCartSync = (cartItems) => {
    const { products, loading, refetch } = useProducts();
    const [checkedAt, setCheckedAt] = useState(null);
    const revalidatedRef = useRef(false);

    useEffect(() => {
        if (revalidatedRef.current) return;
        revalidatedRef.current = true;

        void Promise.resolve(refetch()).finally(() => setCheckedAt(Date.now()));
    }, [refetch]);

    const productsById = useMemo(() => {
        const map = new Map();
        for (const product of products) map.set(product.id, product);
        return map;
    }, [products]);

    const { changes, priceUpdates } = useMemo(() => {
        if (products.length === 0) return { changes: [], priceUpdates: {} };
        return detectCartChanges(cartItems, productsById);
    }, [cartItems, productsById, products.length]);

    const summary = useMemo(() => summariseChanges(changes), [changes]);

    return {
        ...summary,
        changes,
        priceUpdates,
        changeByKey: useMemo(
            () => new Map(changes.filter(c => c.type === 'price').map(c => [c.key, c])),
            [changes]
        ),
        checking: loading && products.length === 0,
        checkedAt
    };
};
