-- Adds the updated_at column the admin order-status API writes to.
-- Additive and idempotent. Existing reads use (updated_at || created_at), so NULL is safe.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz;
