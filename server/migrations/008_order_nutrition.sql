ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS nutrition_summary jsonb;

COMMENT ON COLUMN public.orders.nutrition_summary IS
    'Snapshot of estimated nutrition for the order at the time it was placed. Null when no item in the order had a nutrition profile. Never recomputed, so historical orders keep the figures the customer actually saw.';
