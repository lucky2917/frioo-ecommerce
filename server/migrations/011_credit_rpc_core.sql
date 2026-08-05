CREATE OR REPLACE FUNCTION public.credit__account_for_update(p_user_id uuid, p_create boolean DEFAULT true)
RETURNS public.credit_accounts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_account public.credit_accounts;
BEGIN
    SELECT * INTO v_account FROM public.credit_accounts WHERE user_id = p_user_id FOR UPDATE;

    IF NOT FOUND AND p_create THEN
        INSERT INTO public.credit_accounts (user_id) VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        SELECT * INTO v_account FROM public.credit_accounts WHERE user_id = p_user_id FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No credit account for user %', p_user_id USING ERRCODE = 'no_data_found';
    END IF;

    RETURN v_account;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit__append_entry(
    p_account_id bigint, p_lot_id bigint, p_entry_type text, p_amount_paise bigint,
    p_order_id bigint, p_reverses bigint, p_reason text, p_actor_id uuid,
    p_actor_role text, p_idempotency_key text, p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_balance bigint;
    v_entry_id bigint;
BEGIN
    SELECT ledger_balance_paise INTO v_balance
    FROM public.credit_accounts WHERE id = p_account_id;

    v_balance := v_balance + p_amount_paise;

    IF v_balance < 0 THEN
        RAISE EXCEPTION 'Entry would drive balance negative on account %', p_account_id
            USING ERRCODE = 'check_violation';
    END IF;

    INSERT INTO public.credit_ledger (
        account_id, lot_id, entry_type, amount_paise, balance_after_paise,
        order_id, reverses_entry_id, reason, actor_id, actor_role, idempotency_key, metadata
    ) VALUES (
        p_account_id, p_lot_id, p_entry_type, p_amount_paise, v_balance,
        p_order_id, p_reverses, p_reason, p_actor_id,
        COALESCE(p_actor_role, 'system'), p_idempotency_key, COALESCE(p_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_entry_id;

    UPDATE public.credit_accounts
    SET ledger_balance_paise = v_balance,
        lifetime_issued_paise = lifetime_issued_paise + GREATEST(p_amount_paise, 0),
        lifetime_spent_paise  = lifetime_spent_paise + GREATEST(-p_amount_paise, 0)
    WHERE id = p_account_id;

    RETURN v_entry_id;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_available_paise(p_user_id uuid)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
    SELECT COALESCE(SUM(l.remaining_paise), 0)::bigint
    FROM public.credit_lots l
    JOIN public.credit_accounts a ON a.id = l.account_id
    WHERE a.user_id = p_user_id
      AND l.status = 'active'
      AND l.expires_at > now();
$fn$;

CREATE OR REPLACE FUNCTION public.credit_account_summary(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_account public.credit_accounts;
    v_lots jsonb;
BEGIN
    SELECT * INTO v_account FROM public.credit_accounts WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'exists', false, 'status', 'active',
            'available_paise', 0, 'ledger_balance_paise', 0, 'lots', '[]'::jsonb
        );
    END IF;

    SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.expires_at), '[]'::jsonb) INTO v_lots
    FROM (
        SELECT l.id, l.origin, l.plan_id, l.issued_paise, l.remaining_paise,
               l.issued_at, l.expires_at
        FROM public.credit_lots l
        WHERE l.account_id = v_account.id AND l.status = 'active' AND l.expires_at > now()
    ) x;

    RETURN jsonb_build_object(
        'exists', true,
        'account_id', v_account.id,
        'status', v_account.status,
        'available_paise', public.credit_available_paise(p_user_id),
        'ledger_balance_paise', v_account.ledger_balance_paise,
        'lifetime_issued_paise', v_account.lifetime_issued_paise,
        'lifetime_spent_paise', v_account.lifetime_spent_paise,
        'lots', v_lots
    );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_activate_plan(
    p_user_id uuid, p_plan_id bigint, p_receipt_reference text,
    p_actor_id uuid, p_idempotency_key text, p_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_account public.credit_accounts;
    v_plan public.credit_plans;
    v_existing bigint;
    v_lot_id bigint;
    v_entry_id bigint;
    v_expires timestamptz;
BEGIN
    IF p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
        RAISE EXCEPTION 'Idempotency key is required for plan activation';
    END IF;
    IF p_actor_id IS NULL THEN
        RAISE EXCEPTION 'Activation requires an admin actor';
    END IF;

    v_account := public.credit__account_for_update(p_user_id, true);

    SELECT id INTO v_existing FROM public.credit_ledger
    WHERE account_id = v_account.id AND idempotency_key = p_idempotency_key;

    IF FOUND THEN
        RETURN jsonb_build_object('status', 'duplicate', 'entry_id', v_existing,
                                  'available_paise', public.credit_available_paise(p_user_id));
    END IF;

    IF v_account.status <> 'active' THEN
        RAISE EXCEPTION 'Account is suspended and cannot receive new activations'
            USING ERRCODE = 'check_violation';
    END IF;

    SELECT * INTO v_plan FROM public.credit_plans WHERE id = p_plan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan % not found', p_plan_id USING ERRCODE = 'no_data_found';
    END IF;
    IF NOT v_plan.is_active THEN
        RAISE EXCEPTION 'Plan % is archived and cannot be activated', p_plan_id
            USING ERRCODE = 'check_violation';
    END IF;

    v_expires := now() + make_interval(days => v_plan.validity_days);

    INSERT INTO public.credit_lots (
        account_id, origin, plan_id, issued_paise, remaining_paise,
        paid_paise, expires_at, created_by
    ) VALUES (
        v_account.id, 'plan', v_plan.id, v_plan.credit_paise, v_plan.credit_paise,
        v_plan.price_paise, v_expires, p_actor_id
    ) RETURNING id INTO v_lot_id;

    v_entry_id := public.credit__append_entry(
        v_account.id, v_lot_id, 'PLAN_ACTIVATION', v_plan.credit_paise,
        NULL, NULL,
        COALESCE(p_note, format('%s activated, receipt %s', v_plan.name, COALESCE(p_receipt_reference, 'n/a'))),
        p_actor_id, 'admin', p_idempotency_key,
        jsonb_build_object(
            'plan_code', v_plan.code, 'plan_version', v_plan.version,
            'price_paise', v_plan.price_paise, 'bonus_paise', v_plan.credit_paise - v_plan.price_paise,
            'receipt_reference', p_receipt_reference, 'validity_days', v_plan.validity_days
        )
    );

    RETURN jsonb_build_object(
        'status', 'activated', 'entry_id', v_entry_id, 'lot_id', v_lot_id,
        'issued_paise', v_plan.credit_paise, 'expires_at', v_expires,
        'available_paise', public.credit_available_paise(p_user_id)
    );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_grant(
    p_user_id uuid, p_origin text, p_amount_paise bigint, p_validity_days integer,
    p_reason text, p_actor_id uuid, p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_account public.credit_accounts;
    v_existing bigint;
    v_lot_id bigint;
    v_entry_id bigint;
    v_expires timestamptz;
BEGIN
    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'A reason is required for every credit grant';
    END IF;
    IF p_amount_paise <= 0 THEN
        RAISE EXCEPTION 'Grant amount must be positive';
    END IF;
    IF p_validity_days <= 0 THEN
        RAISE EXCEPTION 'Validity must be at least one day';
    END IF;
    IF p_origin = 'plan' THEN
        RAISE EXCEPTION 'Use credit_activate_plan for plan credits';
    END IF;

    v_account := public.credit__account_for_update(p_user_id, true);

    SELECT id INTO v_existing FROM public.credit_ledger
    WHERE account_id = v_account.id AND idempotency_key = p_idempotency_key;

    IF FOUND THEN
        RETURN jsonb_build_object('status', 'duplicate', 'entry_id', v_existing,
                                  'available_paise', public.credit_available_paise(p_user_id));
    END IF;

    IF v_account.status <> 'active' THEN
        RAISE EXCEPTION 'Account is suspended and cannot receive credits'
            USING ERRCODE = 'check_violation';
    END IF;

    v_expires := now() + make_interval(days => p_validity_days);

    INSERT INTO public.credit_lots (
        account_id, origin, issued_paise, remaining_paise, paid_paise, expires_at, created_by
    ) VALUES (
        v_account.id, p_origin, p_amount_paise, p_amount_paise, 0, v_expires, p_actor_id
    ) RETURNING id INTO v_lot_id;

    v_entry_id := public.credit__append_entry(
        v_account.id, v_lot_id, 'BONUS_GRANT', p_amount_paise, NULL, NULL,
        p_reason, p_actor_id, CASE WHEN p_actor_id IS NULL THEN 'system' ELSE 'admin' END,
        p_idempotency_key, jsonb_build_object('origin', p_origin, 'validity_days', p_validity_days)
    );

    RETURN jsonb_build_object(
        'status', 'granted', 'entry_id', v_entry_id, 'lot_id', v_lot_id,
        'issued_paise', p_amount_paise, 'expires_at', v_expires,
        'available_paise', public.credit_available_paise(p_user_id)
    );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_apply_to_order(
    p_user_id uuid, p_order_id bigint, p_max_paise bigint DEFAULT NULL,
    p_actor_id uuid DEFAULT NULL, p_idempotency_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_account public.credit_accounts;
    v_order public.orders;
    v_cap bigint;
    v_remaining bigint;
    v_applied bigint := 0;
    v_lot record;
    v_take bigint;
    v_entry_id bigint;
    v_first_entry bigint;
BEGIN
    v_account := public.credit__account_for_update(p_user_id, true);

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id USING ERRCODE = 'no_data_found';
    END IF;
    IF v_order.user_id IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'Order % does not belong to this customer', p_order_id
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF EXISTS (SELECT 1 FROM public.credit_allocations WHERE order_id = p_order_id) THEN
        RETURN jsonb_build_object(
            'status', 'already_applied',
            'applied_paise', v_order.credits_applied_paise,
            'amount_due_paise', v_order.amount_due_paise
        );
    END IF;

    IF v_account.status <> 'active' THEN
        RETURN jsonb_build_object(
            'status', 'account_suspended', 'applied_paise', 0,
            'amount_due_paise', v_order.amount_due_paise
        );
    END IF;

    v_cap := LEAST(COALESCE(p_max_paise, v_order.amount_due_paise), v_order.amount_due_paise);
    IF v_cap <= 0 THEN
        RETURN jsonb_build_object('status', 'nothing_due', 'applied_paise', 0,
                                  'amount_due_paise', v_order.amount_due_paise);
    END IF;

    v_remaining := v_cap;

    FOR v_lot IN
        SELECT id, remaining_paise FROM public.credit_lots
        WHERE account_id = v_account.id AND status = 'active'
          AND expires_at > now() AND remaining_paise > 0
        ORDER BY expires_at ASC, issued_at ASC, remaining_paise ASC, id ASC
        FOR UPDATE
    LOOP
        EXIT WHEN v_remaining <= 0;

        v_take := LEAST(v_lot.remaining_paise, v_remaining);

        UPDATE public.credit_lots
        SET remaining_paise = remaining_paise - v_take,
            status = CASE WHEN remaining_paise - v_take = 0 THEN 'exhausted' ELSE status END
        WHERE id = v_lot.id;

        v_entry_id := public.credit__append_entry(
            v_account.id, v_lot.id, 'ORDER_DEBIT', -v_take, p_order_id, NULL,
            format('Order #%s', p_order_id), p_actor_id,
            CASE WHEN p_actor_id IS NULL THEN 'system' ELSE 'admin' END,
            CASE WHEN p_idempotency_key IS NULL THEN NULL
                 ELSE p_idempotency_key || ':' || v_lot.id END,
            jsonb_build_object('channel', v_order.channel)
        );

        v_first_entry := COALESCE(v_first_entry, v_entry_id);

        INSERT INTO public.credit_allocations (order_id, account_id, lot_id, entry_id, amount_paise)
        VALUES (p_order_id, v_account.id, v_lot.id, v_entry_id, v_take);

        v_applied := v_applied + v_take;
        v_remaining := v_remaining - v_take;
    END LOOP;

    IF v_applied = 0 THEN
        RETURN jsonb_build_object('status', 'no_credits', 'applied_paise', 0,
                                  'amount_due_paise', v_order.amount_due_paise);
    END IF;

    UPDATE public.orders
    SET credits_applied_paise = credits_applied_paise + v_applied,
        amount_due_paise = total_amount_paise - (credits_applied_paise + v_applied),
        payment_status = CASE
            WHEN total_amount_paise - (credits_applied_paise + v_applied) = 0 THEN 'settled'
            ELSE 'partly_settled' END
    WHERE id = p_order_id;

    INSERT INTO public.order_payments (order_id, method, amount_paise, reference, ledger_entry_id, recorded_by, idempotency_key)
    VALUES (p_order_id, 'credits', v_applied, 'frioo-credits', v_first_entry, p_actor_id,
            COALESCE(p_idempotency_key, 'credits:' || p_order_id));

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'status', 'applied', 'applied_paise', v_applied,
        'amount_due_paise', v_order.amount_due_paise,
        'payment_status', v_order.payment_status,
        'available_paise', public.credit_available_paise(p_user_id)
    );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_set_account_status(
    p_user_id uuid, p_status text, p_reason text, p_actor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_account public.credit_accounts;
BEGIN
    IF p_status NOT IN ('active', 'suspended') THEN
        RAISE EXCEPTION 'Status must be active or suspended';
    END IF;
    IF p_status = 'suspended' AND (p_reason IS NULL OR btrim(p_reason) = '') THEN
        RAISE EXCEPTION 'A reason is required to suspend an account';
    END IF;

    v_account := public.credit__account_for_update(p_user_id, true);

    UPDATE public.credit_accounts
    SET status = p_status,
        suspended_at = CASE WHEN p_status = 'suspended' THEN now() ELSE NULL END,
        suspended_by = CASE WHEN p_status = 'suspended' THEN p_actor_id ELSE NULL END,
        suspension_reason = CASE WHEN p_status = 'suspended' THEN p_reason ELSE NULL END
    WHERE id = v_account.id;

    RETURN jsonb_build_object(
        'status', p_status, 'account_id', v_account.id,
        'available_paise', public.credit_available_paise(p_user_id)
    );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION
    public.credit__account_for_update(uuid, boolean),
    public.credit__append_entry(bigint, bigint, text, bigint, bigint, bigint, text, uuid, text, text, jsonb),
    public.credit_activate_plan(uuid, bigint, text, uuid, text, text),
    public.credit_grant(uuid, text, bigint, integer, text, uuid, text),
    public.credit_apply_to_order(uuid, bigint, bigint, uuid, text),
    public.credit_set_account_status(uuid, text, text, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.credit_activate_plan(uuid, bigint, text, uuid, text, text),
    public.credit_grant(uuid, text, bigint, integer, text, uuid, text),
    public.credit_apply_to_order(uuid, bigint, bigint, uuid, text),
    public.credit_set_account_status(uuid, text, text, uuid)
TO service_role;

GRANT EXECUTE ON FUNCTION
    public.credit_available_paise(uuid),
    public.credit_account_summary(uuid)
TO authenticated, service_role;
