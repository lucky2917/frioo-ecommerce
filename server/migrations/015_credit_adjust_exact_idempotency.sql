CREATE OR REPLACE FUNCTION public.credit_adjust(
    p_user_id uuid, p_amount_paise bigint, p_validity_days integer,
    p_reason text, p_actor_id uuid, p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_account public.credit_accounts;
    v_existing bigint;
    v_lot_id bigint;
    v_entry_id bigint;
    v_remaining bigint;
    v_lot record;
    v_take bigint;
    v_seq integer := 0;
BEGIN
    IF p_reason IS NULL OR btrim(p_reason) = '' THEN
        RAISE EXCEPTION 'A reason is required for every manual adjustment';
    END IF;
    IF p_actor_id IS NULL THEN
        RAISE EXCEPTION 'Manual adjustments require an admin actor';
    END IF;
    IF p_amount_paise = 0 THEN
        RAISE EXCEPTION 'Adjustment amount cannot be zero';
    END IF;
    IF p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
        RAISE EXCEPTION 'Idempotency key is required for manual adjustments';
    END IF;

    v_account := public.credit__account_for_update(p_user_id, true);

    SELECT id INTO v_existing FROM public.credit_ledger
    WHERE account_id = v_account.id AND idempotency_key = p_idempotency_key || ':1';

    IF FOUND THEN
        RETURN jsonb_build_object('status', 'duplicate', 'entry_id', v_existing,
                                  'available_paise', public.credit_available_paise(p_user_id));
    END IF;

    IF p_amount_paise > 0 THEN
        INSERT INTO public.credit_lots (
            account_id, origin, issued_paise, remaining_paise, paid_paise, expires_at, created_by
        ) VALUES (
            v_account.id, 'manual', p_amount_paise, p_amount_paise, 0,
            now() + make_interval(days => COALESCE(NULLIF(p_validity_days, 0), 30)), p_actor_id
        ) RETURNING id INTO v_lot_id;

        v_entry_id := public.credit__append_entry(
            v_account.id, v_lot_id, 'ADJUSTMENT', p_amount_paise, NULL, NULL,
            p_reason, p_actor_id, 'admin', p_idempotency_key || ':1', '{}'::jsonb
        );

        RETURN jsonb_build_object('status', 'credited', 'entry_id', v_entry_id, 'lot_id', v_lot_id,
                                  'available_paise', public.credit_available_paise(p_user_id));
    END IF;

    v_remaining := -p_amount_paise;

    IF v_remaining > public.credit_available_paise(p_user_id) THEN
        RAISE EXCEPTION 'Cannot deduct % when only % is available',
            v_remaining, public.credit_available_paise(p_user_id) USING ERRCODE = 'check_violation';
    END IF;

    FOR v_lot IN
        SELECT id, remaining_paise FROM public.credit_lots
        WHERE account_id = v_account.id AND status = 'active'
          AND expires_at > now() AND remaining_paise > 0
        ORDER BY expires_at ASC, issued_at ASC, remaining_paise ASC, id ASC
        FOR UPDATE
    LOOP
        EXIT WHEN v_remaining <= 0;
        v_take := LEAST(v_lot.remaining_paise, v_remaining);
        v_seq := v_seq + 1;

        UPDATE public.credit_lots
        SET remaining_paise = remaining_paise - v_take,
            status = CASE WHEN remaining_paise - v_take = 0 THEN 'exhausted' ELSE status END
        WHERE id = v_lot.id;

        v_entry_id := public.credit__append_entry(
            v_account.id, v_lot.id, 'ADJUSTMENT', -v_take, NULL, NULL,
            p_reason, p_actor_id, 'admin', p_idempotency_key || ':' || v_seq, '{}'::jsonb
        );

        v_remaining := v_remaining - v_take;
    END LOOP;

    RETURN jsonb_build_object('status', 'deducted', 'deducted_paise', -p_amount_paise,
                              'available_paise', public.credit_available_paise(p_user_id));
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.credit_adjust(uuid, bigint, integer, text, uuid, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_adjust(uuid, bigint, integer, text, uuid, text)
    TO service_role;
