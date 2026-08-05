ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS channel               text   NOT NULL DEFAULT 'online',
    ADD COLUMN IF NOT EXISTS total_amount_paise    bigint,
    ADD COLUMN IF NOT EXISTS credits_applied_paise bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS amount_due_paise      bigint,
    ADD COLUMN IF NOT EXISTS payment_status        text   NOT NULL DEFAULT 'pending';

UPDATE public.orders
SET total_amount_paise = ROUND(COALESCE(total_amount, 0) * 100)::bigint
WHERE total_amount_paise IS NULL;

UPDATE public.orders
SET amount_due_paise = total_amount_paise - credits_applied_paise
WHERE amount_due_paise IS NULL;

UPDATE public.orders
SET payment_status = CASE
        WHEN status = 'delivered' THEN 'settled'
        WHEN status = 'cancelled' THEN 'void'
        ELSE 'pending'
    END
WHERE payment_status = 'pending' AND status IN ('delivered', 'cancelled');

ALTER TABLE public.orders
    ALTER COLUMN total_amount_paise SET NOT NULL,
    ALTER COLUMN amount_due_paise   SET NOT NULL;

ALTER TABLE public.orders
    DROP CONSTRAINT IF EXISTS orders_channel_check,
    DROP CONSTRAINT IF EXISTS orders_payment_status_check,
    DROP CONSTRAINT IF EXISTS orders_paise_non_negative_check,
    DROP CONSTRAINT IF EXISTS orders_amount_due_balances_check;

ALTER TABLE public.orders
    ADD CONSTRAINT orders_channel_check
        CHECK (channel IN ('online', 'in_store')),
    ADD CONSTRAINT orders_payment_status_check
        CHECK (payment_status IN ('pending', 'partly_settled', 'settled', 'void')),
    ADD CONSTRAINT orders_paise_non_negative_check
        CHECK (total_amount_paise >= 0 AND credits_applied_paise >= 0 AND amount_due_paise >= 0),
    ADD CONSTRAINT orders_amount_due_balances_check
        CHECK (amount_due_paise = total_amount_paise - credits_applied_paise);

CREATE INDEX IF NOT EXISTS orders_channel_idx        ON public.orders (channel);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders (payment_status);

CREATE TABLE IF NOT EXISTS public.order_payments (
    id              bigserial PRIMARY KEY,
    order_id        bigint      NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
    method          text        NOT NULL,
    amount_paise    bigint      NOT NULL,
    reference       text,
    ledger_entry_id bigint,
    idempotency_key text,
    recorded_by     uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
    recorded_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT order_payments_method_check
        CHECK (method IN ('credits', 'cash', 'upi', 'card', 'gateway')),
    CONSTRAINT order_payments_amount_positive_check
        CHECK (amount_paise > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS order_payments_idempotency_idx
    ON public.order_payments (order_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS order_payments_order_idx  ON public.order_payments (order_id);
CREATE INDEX IF NOT EXISTS order_payments_method_idx ON public.order_payments (method);

CREATE OR REPLACE FUNCTION public.reject_order_payment_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'order_payments is append only. Record a correcting entry instead of altering %.',
        COALESCE(OLD.id::text, 'row');
END;
$$;

DROP TRIGGER IF EXISTS order_payments_no_update ON public.order_payments;
CREATE TRIGGER order_payments_no_update
    BEFORE UPDATE ON public.order_payments
    FOR EACH ROW EXECUTE FUNCTION public.reject_order_payment_mutation();

DROP TRIGGER IF EXISTS order_payments_no_delete ON public.order_payments;
CREATE TRIGGER order_payments_no_delete
    BEFORE DELETE ON public.order_payments
    FOR EACH ROW EXECUTE FUNCTION public.reject_order_payment_mutation();

ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_payments_service_role_all ON public.order_payments;
CREATE POLICY order_payments_service_role_all
    ON public.order_payments FOR ALL TO service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS order_payments_admin_read ON public.order_payments;
CREATE POLICY order_payments_admin_read
    ON public.order_payments FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS order_payments_own_read ON public.order_payments;
CREATE POLICY order_payments_own_read
    ON public.order_payments FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_payments.order_id AND o.user_id = auth.uid()
    ));

COMMENT ON COLUMN public.orders.channel IS
    'online for storefront orders, in_store for counter charges recorded by an admin.';
COMMENT ON COLUMN public.orders.total_amount_paise IS
    'Authoritative order total in integer paise. total_amount (numeric) is retained for backward compatibility and will be dropped once nothing reads it.';
COMMENT ON COLUMN public.orders.credits_applied_paise IS
    'Frioo Credits applied to this order. Written only by the credit RPC layer.';
COMMENT ON TABLE public.order_payments IS
    'Append only tender record. One row per payment against an order, whatever the method. Credits rows reference the credit ledger entry that moved them.';
