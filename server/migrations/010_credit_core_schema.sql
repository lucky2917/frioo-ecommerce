CREATE TABLE IF NOT EXISTS public.credit_plans (
    id             bigserial PRIMARY KEY,
    code           text        NOT NULL,
    version        integer     NOT NULL DEFAULT 1,
    name           text        NOT NULL,
    price_paise    bigint      NOT NULL,
    credit_paise   bigint      NOT NULL,
    validity_days  integer     NOT NULL,
    is_active      boolean     NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    created_by     uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
    archived_at    timestamptz,
    archived_by    uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
    CONSTRAINT credit_plans_code_version_key UNIQUE (code, version),
    CONSTRAINT credit_plans_price_positive   CHECK (price_paise > 0),
    CONSTRAINT credit_plans_credit_positive  CHECK (credit_paise > 0),
    CONSTRAINT credit_plans_validity_positive CHECK (validity_days > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS credit_plans_one_active_per_code_idx
    ON public.credit_plans (code) WHERE is_active;

CREATE TABLE IF NOT EXISTS public.credit_accounts (
    id                    bigserial PRIMARY KEY,
    user_id               uuid        NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE RESTRICT,
    status                text        NOT NULL DEFAULT 'active',
    ledger_balance_paise  bigint      NOT NULL DEFAULT 0,
    lifetime_issued_paise bigint      NOT NULL DEFAULT 0,
    lifetime_spent_paise  bigint      NOT NULL DEFAULT 0,
    suspended_at          timestamptz,
    suspended_by          uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
    suspension_reason     text,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT credit_accounts_status_check  CHECK (status IN ('active', 'suspended')),
    CONSTRAINT credit_accounts_balance_check CHECK (ledger_balance_paise >= 0)
);

CREATE TABLE IF NOT EXISTS public.credit_lots (
    id              bigserial PRIMARY KEY,
    account_id      bigint      NOT NULL REFERENCES public.credit_accounts (id) ON DELETE RESTRICT,
    origin          text        NOT NULL,
    plan_id         bigint      REFERENCES public.credit_plans (id) ON DELETE RESTRICT,
    issued_paise    bigint      NOT NULL,
    remaining_paise bigint      NOT NULL,
    paid_paise      bigint      NOT NULL DEFAULT 0,
    issued_at       timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz NOT NULL,
    status          text        NOT NULL DEFAULT 'active',
    created_by      uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
    CONSTRAINT credit_lots_origin_check CHECK (origin IN (
        'plan', 'grace', 'bonus', 'promotional', 'referral', 'cashback', 'birthday', 'manual'
    )),
    CONSTRAINT credit_lots_status_check    CHECK (status IN ('active', 'exhausted', 'expired', 'reversed')),
    CONSTRAINT credit_lots_issued_positive CHECK (issued_paise > 0),
    CONSTRAINT credit_lots_remaining_range CHECK (remaining_paise >= 0 AND remaining_paise <= issued_paise),
    CONSTRAINT credit_lots_paid_range      CHECK (paid_paise >= 0),
    CONSTRAINT credit_lots_plan_origin     CHECK ((origin = 'plan') = (plan_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS credit_lots_consumption_idx
    ON public.credit_lots (account_id, expires_at, issued_at, remaining_paise, id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS credit_lots_expiry_sweep_idx
    ON public.credit_lots (expires_at) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS credit_lots_account_idx ON public.credit_lots (account_id);

CREATE TABLE IF NOT EXISTS public.credit_ledger (
    id                  bigserial PRIMARY KEY,
    account_id          bigint      NOT NULL REFERENCES public.credit_accounts (id) ON DELETE RESTRICT,
    lot_id              bigint      REFERENCES public.credit_lots (id) ON DELETE RESTRICT,
    entry_type          text        NOT NULL,
    amount_paise        bigint      NOT NULL,
    balance_after_paise bigint      NOT NULL,
    order_id            bigint      REFERENCES public.orders (id) ON DELETE RESTRICT,
    reverses_entry_id   bigint      REFERENCES public.credit_ledger (id) ON DELETE RESTRICT,
    reason              text,
    actor_id            uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
    actor_role          text        NOT NULL DEFAULT 'system',
    idempotency_key     text,
    metadata            jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT credit_ledger_entry_type_check CHECK (entry_type IN (
        'PLAN_ACTIVATION', 'BONUS_GRANT', 'ORDER_DEBIT', 'REFUND',
        'EXPIRY', 'ADJUSTMENT', 'EXTENSION', 'REVERSAL'
    )),
    CONSTRAINT credit_ledger_actor_role_check CHECK (actor_role IN ('admin', 'system', 'customer')),
    CONSTRAINT credit_ledger_balance_check    CHECK (balance_after_paise >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_idempotency_idx
    ON public.credit_ledger (account_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS credit_ledger_account_time_idx ON public.credit_ledger (account_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS credit_ledger_order_idx        ON public.credit_ledger (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS credit_ledger_type_time_idx    ON public.credit_ledger (entry_type, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_ledger_lot_idx          ON public.credit_ledger (lot_id) WHERE lot_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.credit_allocations (
    id              bigserial PRIMARY KEY,
    order_id        bigint      NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
    account_id      bigint      NOT NULL REFERENCES public.credit_accounts (id) ON DELETE RESTRICT,
    lot_id          bigint      NOT NULL REFERENCES public.credit_lots (id) ON DELETE RESTRICT,
    entry_id        bigint      NOT NULL REFERENCES public.credit_ledger (id) ON DELETE RESTRICT,
    amount_paise    bigint      NOT NULL,
    refunded_paise  bigint      NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT credit_allocations_amount_positive CHECK (amount_paise > 0),
    CONSTRAINT credit_allocations_refund_range    CHECK (refunded_paise >= 0 AND refunded_paise <= amount_paise)
);

CREATE INDEX IF NOT EXISTS credit_allocations_order_idx   ON public.credit_allocations (order_id);
CREATE INDEX IF NOT EXISTS credit_allocations_account_idx ON public.credit_allocations (account_id);

ALTER TABLE public.order_payments
    DROP CONSTRAINT IF EXISTS order_payments_ledger_entry_fkey;

ALTER TABLE public.order_payments
    ADD CONSTRAINT order_payments_ledger_entry_fkey
        FOREIGN KEY (ledger_entry_id) REFERENCES public.credit_ledger (id) ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION public.reject_credit_ledger_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'credit_ledger is append only. Append a REVERSAL entry instead of altering entry %.',
        COALESCE(OLD.id::text, 'row');
END;
$$;

DROP TRIGGER IF EXISTS credit_ledger_no_update ON public.credit_ledger;
CREATE TRIGGER credit_ledger_no_update
    BEFORE UPDATE ON public.credit_ledger
    FOR EACH ROW EXECUTE FUNCTION public.reject_credit_ledger_mutation();

DROP TRIGGER IF EXISTS credit_ledger_no_delete ON public.credit_ledger;
CREATE TRIGGER credit_ledger_no_delete
    BEFORE DELETE ON public.credit_ledger
    FOR EACH ROW EXECUTE FUNCTION public.reject_credit_ledger_mutation();

CREATE OR REPLACE FUNCTION public.reject_issued_plan_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.credit_lots WHERE plan_id = OLD.id) THEN
        RAISE EXCEPTION
            'Plan % has issued credits and can only be archived, never deleted.', OLD.id;
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS credit_plans_no_delete_when_issued ON public.credit_plans;
CREATE TRIGGER credit_plans_no_delete_when_issued
    BEFORE DELETE ON public.credit_plans
    FOR EACH ROW EXECUTE FUNCTION public.reject_issued_plan_delete();

CREATE OR REPLACE FUNCTION public.touch_credit_account()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS credit_accounts_touch ON public.credit_accounts;
CREATE TRIGGER credit_accounts_touch
    BEFORE UPDATE ON public.credit_accounts
    FOR EACH ROW EXECUTE FUNCTION public.touch_credit_account();

ALTER TABLE public.credit_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_lots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_plans_service_all ON public.credit_plans;
CREATE POLICY credit_plans_service_all ON public.credit_plans
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS credit_plans_admin_read ON public.credit_plans;
CREATE POLICY credit_plans_admin_read ON public.credit_plans
    FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS credit_accounts_service_all ON public.credit_accounts;
CREATE POLICY credit_accounts_service_all ON public.credit_accounts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS credit_accounts_read ON public.credit_accounts;
CREATE POLICY credit_accounts_read ON public.credit_accounts
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS credit_lots_service_all ON public.credit_lots;
CREATE POLICY credit_lots_service_all ON public.credit_lots
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS credit_lots_read ON public.credit_lots;
CREATE POLICY credit_lots_read ON public.credit_lots
    FOR SELECT TO authenticated USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.credit_accounts a
            WHERE a.id = credit_lots.account_id AND a.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS credit_ledger_service_all ON public.credit_ledger;
CREATE POLICY credit_ledger_service_all ON public.credit_ledger
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS credit_ledger_read ON public.credit_ledger;
CREATE POLICY credit_ledger_read ON public.credit_ledger
    FOR SELECT TO authenticated USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.credit_accounts a
            WHERE a.id = credit_ledger.account_id AND a.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS credit_allocations_service_all ON public.credit_allocations;
CREATE POLICY credit_allocations_service_all ON public.credit_allocations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS credit_allocations_read ON public.credit_allocations;
CREATE POLICY credit_allocations_read ON public.credit_allocations
    FOR SELECT TO authenticated USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.credit_accounts a
            WHERE a.id = credit_allocations.account_id AND a.user_id = auth.uid()
        )
    );

COMMENT ON TABLE public.credit_ledger IS
    'Append only. Single source of truth for every credit movement. Corrections are REVERSAL entries, never edits.';
COMMENT ON COLUMN public.credit_accounts.ledger_balance_paise IS
    'Cached sum of ledger amounts. Spendable balance is derived from unexpired lots and may be lower until the expiry sweep materialises EXPIRY entries.';
COMMENT ON COLUMN public.credit_lots.paid_paise IS
    'Cash the customer actually paid for this lot. issued_paise minus paid_paise is the bonus, which is a discount at redemption rather than revenue at sale.';
