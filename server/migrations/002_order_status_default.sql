-- Sets the canonical lowercase status default and normalizes any legacy-cased rows.
-- The server always sets status explicitly on insert, so this only fixes the latent default.
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';
UPDATE public.orders SET status = lower(status) WHERE status <> lower(status);
