import { useMemo } from 'react';
import { useProducts } from './useProducts';
import { summariseNutrition } from '../utils/nutritionMath';

export const useCartNutrition = (cartItems) => {
    const { products, loading } = useProducts();

    const productsById = useMemo(() => {
        const map = new Map();
        for (const product of products) map.set(product.id, product);
        return map;
    }, [products]);

    const summary = useMemo(() => {
        const lines = cartItems.map((item) => {
            const product = productsById.get(item.id);
            return {
                title: item.title,
                qty: item.qty,
                variant: item.variant,
                unit: product?.unit ?? null,
                nutrition: product?.nutrition ?? null
            };
        });
        return summariseNutrition(lines);
    }, [cartItems, productsById]);

    const ready = !loading || products.length > 0;

    return { ...summary, ready };
};
