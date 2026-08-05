CREATE OR REPLACE FUNCTION public.credit__return_to_lot(
    p_account_id bigint, p_lot_id bigint, p_amount bigint, p_order_id bigint,
    p_reason text, p_actor_id uuid, p_idempotency_key text, p_grace_days integer DEFAULT 7
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_lot public.credit_lots;
    v_target_lot bigint;
    v_entry_id bigint;
    v_grace boolean := false;
BEGIN
    SELECT * INTO v_lot FROM public.credit_lots WHERE id = p_lot_id FOR UPDATE;

    IF FOUND AND v_lot.expires_at > now() AND v_lot.status IN ('active', 'exhausted') THEN
        UPDATE public.credit_lots
        SET remaining_paise = remaining_paise + p_amount, status = 'active'
        WHERE id = p_lot_id;
        v_target_lot := p_lot_id;
    ELSE
        INSERT INTO public.credit_lots (
            account_id, origin, issued_paise, remaining_paise, paid_paise, expires_at, created_by
        ) VALUES (
            p_account_id, 'grace', p_amount, p_amount, 0,
            now() + make_interval(days => p_grace_days), p_actor_id
        ) RETURNING id INTO v_target_lot;
        v_grace := true;
    END IF;

    v_entry_id := public.credit__append_entry(
        p_account_id, v_target_lot, 'REFUND', p_amount, p_order_id, NULL,
        p_reason, p_actor_id, CASE WHEN p_actor_id IS NULL THEN 'system' ELSE 'admin' END,
        p_idempotency_key,
        jsonb_build_object('grace_lot', v_grace, 'source_lot_id', p_lot_id)
    );

    RETURN jsonb_build_object('entry_id', v_entry_id, 'lot_id', v_target_lot, 'grace', v_grace);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_refund_order(
    p_order_id bigint, p_refund_total_paise bigint, p_reason text,
    p_actor_id uuid, p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_order public.orders;
    v_account public.credit_accounts;
    v_credit_share bigint;
    v_cash_share bigint;
    v_outstanding bigint;
    v_alloc record;
    v_take bigint;
    v_existing bigint;
    v_results jsonb := '[]'::jsonb;
    v_step jsonb;
    v_seq integer := 0;
BEGIN
    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'A reason is required for every refund';
    END IF;
    IF p_refund_total_paise <= 0 THEN
        RAISE EXCEPTION 'Refund amount must be positive';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id USING ERRCODE = 'no_data_found';
    END IF;
    IF p_refund_total_paise > v_order.total_amount_paise THEN
        RAISE EXCEPTION 'Refund exceeds order total';
    END IF;

    v_credit_share := CASE
        WHEN v_order.total_amount_paise = 0 THEN 0
        ELSE ROUND(p_refund_total_paise::numeric * v_order.credits_applied_paise / v_order.total_amount_paise)::bigint
    END;
    v_cash_share := p_refund_total_paise - v_credit_share;

    IF v_credit_share = 0 THEN
        RETURN jsonb_build_object('status', 'cash_only', 'credit_refund_paise', 0,
                                  'cash_refund_paise', v_cash_share);
    END IF;

    v_account := public.credit__account_for_update(v_order.user_id, true);

    SELECT id INTO v_existing FROM public.credit_ledger
    WHERE account_id = v_account.id AND idempotency_key = p_idempotency_key || ':1';
    IF FOUND THEN
        RETURN jsonb_build_object('status', 'duplicate', 'entry_id', v_existing);
    END IF;

    v_outstanding := v_credit_share;

    FOR v_alloc IN
        SELECT id, lot_id, amount_paise, refunded_paise
        FROM public.credit_allocations
        WHERE order_id = p_order_id AND refunded_paise < amount_paise
        ORDER BY lot_id ASC, id ASC
        FOR UPDATE
    LOOP
        EXIT WHEN v_outstanding <= 0;

        v_take := LEAST(v_alloc.amount_paise - v_alloc.refunded_paise, v_outstanding);
        v_seq := v_seq + 1;

        v_step := public.credit__return_to_lot(
            v_account.id, v_alloc.lot_id, v_take, p_order_id, p_reason, p_actor_id,
            p_idempotency_key || ':' || v_seq
        );

        UPDATE public.credit_allocations
        SET refunded_paise = refunded_paise + v_take
        WHERE id = v_alloc.id;

        v_results := v_results || v_step;
        v_outstanding := v_outstanding - v_take;
    END LOOP;

    IF v_outstanding > 0 THEN
        RAISE EXCEPTION 'Refund of % exceeds credits still refundable on order %',
            v_credit_share, p_order_id USING ERRCODE = 'check_violation';
    END IF;

    IF p_refund_total_paise = v_order.total_amount_paise THEN
        UPDATE public.orders SET payment_status = 'void' WHERE id = p_order_id;
    END IF;

    RETURN jsonb_build_object(
        'status', 'refunded',
        'credit_refund_paise', v_credit_share,
        'cash_refund_paise', v_cash_share,
        'entries', v_results,
        'available_paise', public.credit_available_paise(v_order.user_id)
    );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_extend_lot(
    p_lot_id bigint, p_new_expires_at timestamptz, p_reason text,
    p_actor_id uuid, p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_lot public.credit_lots;
    v_old timestamptz;
    v_entry_id bigint;
BEGIN
    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'A reason is required to extend validity';
    END IF;

    SELECT * INTO v_lot FROM public.credit_lots WHERE id = p_lot_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lot % not found', p_lot_id USING ERRCODE = 'no_data_found';
    END IF;
    IF p_new_expires_at <= v_lot.expires_at THEN
        RAISE EXCEPTION 'New expiry must be later than the current expiry';
    END IF;

    PERFORM 1 FROM public.credit_accounts WHERE id = v_lot.account_id FOR UPDATE;

    v_old := v_lot.expires_at;

    UPDATE public.credit_lots
    SET expires_at = p_new_expires_at,
        status = CASE WHEN status = 'expired' AND remaining_paise > 0 THEN 'active' ELSE status END
    WHERE id = p_lot_id;

    v_entry_id := public.credit__append_entry(
        v_lot.account_id, p_lot_id, 'EXTENSION', 0, NULL, NULL,
        p_reason, p_actor_id, 'admin', p_idempotency_key,
        jsonb_build_object('previous_expires_at', v_old, 'new_expires_at', p_new_expires_at)
    );

    RETURN jsonb_build_object('status', 'extended', 'entry_id', v_entry_id,
                              'lot_id', p_lot_id, 'expires_at', p_new_expires_at);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_reverse_entry(
    p_entry_id bigint, p_reason text, p_actor_id uuid, p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_entry public.credit_ledger;
    v_lot public.credit_lots;
    v_entry_id bigint;
BEGIN
    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'A reason is required for every reversal';
    END IF;

    SELECT * INTO v_entry FROM public.credit_ledger WHERE id = p_entry_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entry % not found', p_entry_id USING ERRCODE = 'no_data_found';
    END IF;
    IF v_entry.entry_type = 'REVERSAL' THEN
        RAISE EXCEPTION 'Cannot reverse a reversal. Append a fresh adjustment instead.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.credit_ledger WHERE reverses_entry_id = p_entry_id) THEN
        RAISE EXCEPTION 'Entry % has already been reversed', p_entry_id;
    END IF;

    PERFORM 1 FROM public.credit_accounts WHERE id = v_entry.account_id FOR UPDATE;

    IF v_entry.lot_id IS NOT NULL THEN
        SELECT * INTO v_lot FROM public.credit_lots WHERE id = v_entry.lot_id FOR UPDATE;

        IF v_entry.amount_paise > 0 THEN
            IF v_lot.remaining_paise < v_entry.amount_paise THEN
                RAISE EXCEPTION
                    'Cannot reverse entry %: % already spent from this lot. Use a manual adjustment instead.',
                    p_entry_id, v_entry.amount_paise - v_lot.remaining_paise
                    USING ERRCODE = 'check_violation';
            END IF;
            UPDATE public.credit_lots
            SET remaining_paise = remaining_paise - v_entry.amount_paise,
                status = CASE WHEN remaining_paise - v_entry.amount_paise = 0 THEN 'reversed' ELSE status END
            WHERE id = v_entry.lot_id;
        ELSE
            UPDATE public.credit_lots
            SET remaining_paise = remaining_paise + (-v_entry.amount_paise), status = 'active'
            WHERE id = v_entry.lot_id;
        END IF;
    END IF;

    v_entry_id := public.credit__append_entry(
        v_entry.account_id, v_entry.lot_id, 'REVERSAL', -v_entry.amount_paise,
        v_entry.order_id, p_entry_id, p_reason, p_actor_id, 'admin', p_idempotency_key,
        jsonb_build_object('reversed_type', v_entry.entry_type)
    );

    RETURN jsonb_build_object('status', 'reversed', 'entry_id', v_entry_id,
                              'reversed_entry_id', p_entry_id);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_expire_due_lots(p_limit integer DEFAULT 500)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_lot record;
    v_expired_count integer := 0;
    v_expired_paise bigint := 0;
BEGIN
    FOR v_lot IN
        SELECT id, account_id, remaining_paise FROM public.credit_lots
        WHERE status = 'active' AND expires_at <= now()
        ORDER BY expires_at ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    LOOP
        PERFORM 1 FROM public.credit_accounts WHERE id = v_lot.account_id FOR UPDATE;

        IF v_lot.remaining_paise > 0 THEN
            PERFORM public.credit__append_entry(
                v_lot.account_id, v_lot.id, 'EXPIRY', -v_lot.remaining_paise, NULL, NULL,
                'Credits expired', NULL, 'system',
                'expiry:' || v_lot.id, '{}'::jsonb
            );
            v_expired_paise := v_expired_paise + v_lot.remaining_paise;
        END IF;

        UPDATE public.credit_lots
        SET remaining_paise = 0, status = 'expired'
        WHERE id = v_lot.id;

        v_expired_count := v_expired_count + 1;
    END LOOP;

    RETURN jsonb_build_object('lots_expired', v_expired_count, 'paise_expired', v_expired_paise);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_reconcile()
RETURNS TABLE (
    account_id bigint, user_id uuid, cached_balance_paise bigint,
    ledger_sum_paise bigint, lot_remaining_paise bigint, drift_paise bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
    SELECT a.id, a.user_id, a.ledger_balance_paise,
           COALESCE(l.total, 0)::bigint,
           COALESCE(k.total, 0)::bigint,
           (a.ledger_balance_paise - COALESCE(l.total, 0))::bigint
    FROM public.credit_accounts a
    LEFT JOIN (
        SELECT account_id, SUM(amount_paise) AS total
        FROM public.credit_ledger GROUP BY account_id
    ) l ON l.account_id = a.id
    LEFT JOIN (
        SELECT account_id, SUM(remaining_paise) AS total
        FROM public.credit_lots WHERE status IN ('active', 'exhausted') GROUP BY account_id
    ) k ON k.account_id = a.id
    WHERE a.ledger_balance_paise <> COALESCE(l.total, 0)
       OR a.ledger_balance_paise <> COALESCE(k.total, 0);
$fn$;

REVOKE EXECUTE ON FUNCTION
    public.credit__return_to_lot(bigint, bigint, bigint, bigint, text, uuid, text, integer),
    public.credit_refund_order(bigint, bigint, text, uuid, text),
    public.credit_extend_lot(bigint, timestamptz, text, uuid, text),
    public.credit_reverse_entry(bigint, text, uuid, text),
    public.credit_expire_due_lots(integer),
    public.credit_reconcile()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.credit_refund_order(bigint, bigint, text, uuid, text),
    public.credit_extend_lot(bigint, timestamptz, text, uuid, text),
    public.credit_reverse_entry(bigint, text, uuid, text),
    public.credit_expire_due_lots(integer),
    public.credit_reconcile()
TO service_role;
