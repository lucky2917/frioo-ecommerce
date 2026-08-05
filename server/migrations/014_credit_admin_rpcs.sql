CREATE OR REPLACE FUNCTION public.credit_plan_save(
    p_plan_id bigint, p_code text, p_name text, p_price_paise bigint,
    p_credit_paise bigint, p_validity_days integer, p_actor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_old public.credit_plans;
    v_code text;
    v_next integer;
    v_new_id bigint;
    v_issued boolean := false;
BEGIN
    IF p_name IS NULL OR btrim(p_name) = '' THEN RAISE EXCEPTION 'Plan name is required'; END IF;
    IF p_price_paise <= 0 OR p_credit_paise <= 0 THEN RAISE EXCEPTION 'Price and credits must be positive'; END IF;
    IF p_validity_days <= 0 THEN RAISE EXCEPTION 'Validity must be at least one day'; END IF;

    IF p_plan_id IS NULL THEN
        v_code := upper(regexp_replace(COALESCE(NULLIF(btrim(p_code), ''), p_name), '[^a-zA-Z0-9]+', '_', 'g'));
        SELECT COALESCE(MAX(version), 0) + 1 INTO v_next FROM public.credit_plans WHERE code = v_code;
        UPDATE public.credit_plans SET is_active = false, archived_at = now(), archived_by = p_actor_id
        WHERE code = v_code AND is_active;

        INSERT INTO public.credit_plans (code, version, name, price_paise, credit_paise, validity_days, created_by)
        VALUES (v_code, v_next, btrim(p_name), p_price_paise, p_credit_paise, p_validity_days, p_actor_id)
        RETURNING id INTO v_new_id;

        RETURN jsonb_build_object('status', 'created', 'plan_id', v_new_id, 'code', v_code, 'version', v_next);
    END IF;

    SELECT * INTO v_old FROM public.credit_plans WHERE id = p_plan_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Plan % not found', p_plan_id USING ERRCODE = 'no_data_found'; END IF;

    SELECT EXISTS (SELECT 1 FROM public.credit_lots WHERE plan_id = p_plan_id) INTO v_issued;

    IF NOT v_issued THEN
        UPDATE public.credit_plans
        SET name = btrim(p_name), price_paise = p_price_paise,
            credit_paise = p_credit_paise, validity_days = p_validity_days
        WHERE id = p_plan_id;
        RETURN jsonb_build_object('status', 'updated_in_place', 'plan_id', p_plan_id,
                                  'code', v_old.code, 'version', v_old.version);
    END IF;

    SELECT MAX(version) + 1 INTO v_next FROM public.credit_plans WHERE code = v_old.code;

    UPDATE public.credit_plans SET is_active = false, archived_at = now(), archived_by = p_actor_id
    WHERE code = v_old.code AND is_active;

    INSERT INTO public.credit_plans (code, version, name, price_paise, credit_paise, validity_days, created_by)
    VALUES (v_old.code, v_next, btrim(p_name), p_price_paise, p_credit_paise, p_validity_days, p_actor_id)
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('status', 'new_version', 'plan_id', v_new_id,
                              'code', v_old.code, 'version', v_next, 'previous_plan_id', p_plan_id);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_plan_set_active(
    p_plan_id bigint, p_active boolean, p_actor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE v_plan public.credit_plans;
BEGIN
    SELECT * INTO v_plan FROM public.credit_plans WHERE id = p_plan_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Plan % not found', p_plan_id USING ERRCODE = 'no_data_found'; END IF;

    IF p_active THEN
        UPDATE public.credit_plans SET is_active = false, archived_at = now(), archived_by = p_actor_id
        WHERE code = v_plan.code AND is_active AND id <> p_plan_id;
    END IF;

    UPDATE public.credit_plans
    SET is_active = p_active,
        archived_at = CASE WHEN p_active THEN NULL ELSE now() END,
        archived_by = CASE WHEN p_active THEN NULL ELSE p_actor_id END
    WHERE id = p_plan_id;

    RETURN jsonb_build_object('status', CASE WHEN p_active THEN 'activated' ELSE 'archived' END,
                              'plan_id', p_plan_id);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_plan_delete(p_plan_id bigint)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
BEGIN
    IF EXISTS (SELECT 1 FROM public.credit_lots WHERE plan_id = p_plan_id) THEN
        RAISE EXCEPTION 'Plan % has issued credits and can only be archived, never deleted.', p_plan_id
            USING ERRCODE = 'check_violation';
    END IF;
    DELETE FROM public.credit_plans WHERE id = p_plan_id;
    RETURN jsonb_build_object('status', 'deleted', 'plan_id', p_plan_id);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_search_customers(p_query text, p_limit integer DEFAULT 20)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
    SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.full_name NULLS LAST), '[]'::jsonb)
    FROM (
        SELECT p.id AS user_id, p.full_name, p.email, p.phone_number,
               COALESCE(a.status, 'active') AS status,
               COALESCE((SELECT SUM(l.remaining_paise) FROM public.credit_lots l
                         WHERE l.account_id = a.id AND l.status = 'active' AND l.expires_at > now()), 0) AS available_paise,
               COALESCE((SELECT COUNT(*) FROM public.credit_lots l
                         WHERE l.account_id = a.id AND l.status = 'active' AND l.expires_at > now()), 0) AS active_lots,
               (SELECT MAX(o.created_at) FROM public.orders o WHERE o.user_id = p.id) AS last_order_at
        FROM public.profiles p
        LEFT JOIN public.credit_accounts a ON a.user_id = p.id
        WHERE btrim(COALESCE(p_query, '')) <> '' AND (
              p.full_name ILIKE '%' || btrim(p_query) || '%'
           OR p.email ILIKE '%' || btrim(p_query) || '%'
           OR regexp_replace(COALESCE(p.phone_number, ''), '[^0-9]', '', 'g')
              LIKE '%' || regexp_replace(btrim(p_query), '[^0-9]', '', 'g') || '%'
              AND regexp_replace(btrim(p_query), '[^0-9]', '', 'g') <> ''
        )
        LIMIT GREATEST(p_limit, 1)
    ) r;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_customer_detail(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_profile public.profiles;
    v_account public.credit_accounts;
    v_lots jsonb;
BEGIN
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Customer not found' USING ERRCODE = 'no_data_found'; END IF;

    SELECT * INTO v_account FROM public.credit_accounts WHERE user_id = p_user_id;

    SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.expires_at DESC), '[]'::jsonb) INTO v_lots
    FROM (
        SELECT l.id, l.origin, l.plan_id, pl.name AS plan_name, pl.code AS plan_code, pl.version AS plan_version,
               l.issued_paise, l.remaining_paise, l.paid_paise, l.issued_at, l.expires_at,
               CASE WHEN l.status = 'active' AND l.expires_at <= now() THEN 'expired' ELSE l.status END AS status,
               GREATEST(0, EXTRACT(day FROM l.expires_at - now())::integer) AS days_remaining
        FROM public.credit_lots l
        LEFT JOIN public.credit_plans pl ON pl.id = l.plan_id
        WHERE l.account_id = v_account.id
    ) x;

    RETURN jsonb_build_object(
        'user_id', v_profile.id,
        'full_name', v_profile.full_name,
        'email', v_profile.email,
        'phone_number', v_profile.phone_number,
        'account_exists', v_account.id IS NOT NULL,
        'account_id', v_account.id,
        'status', COALESCE(v_account.status, 'active'),
        'suspension_reason', v_account.suspension_reason,
        'suspended_at', v_account.suspended_at,
        'available_paise', COALESCE((SELECT SUM(l.remaining_paise) FROM public.credit_lots l
             WHERE l.account_id = v_account.id AND l.status = 'active' AND l.expires_at > now()), 0),
        'ledger_balance_paise', COALESCE(v_account.ledger_balance_paise, 0),
        'lifetime_issued_paise', COALESCE(v_account.lifetime_issued_paise, 0),
        'lifetime_spent_paise', COALESCE(v_account.lifetime_spent_paise, 0),
        'lots', v_lots
    );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_ledger_search(
    p_user_id uuid DEFAULT NULL, p_entry_type text DEFAULT NULL,
    p_from timestamptz DEFAULT NULL, p_to timestamptz DEFAULT NULL,
    p_query text DEFAULT NULL, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE v_rows jsonb; v_total bigint;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM public.credit_ledger e
    JOIN public.credit_accounts a ON a.id = e.account_id
    JOIN public.profiles p ON p.id = a.user_id
    WHERE (p_user_id IS NULL OR a.user_id = p_user_id)
      AND (p_entry_type IS NULL OR e.entry_type = p_entry_type)
      AND (p_from IS NULL OR e.created_at >= p_from)
      AND (p_to IS NULL OR e.created_at <= p_to)
      AND (btrim(COALESCE(p_query, '')) = '' OR
           p.full_name ILIKE '%' || btrim(p_query) || '%' OR
           p.email ILIKE '%' || btrim(p_query) || '%' OR
           COALESCE(e.reason, '') ILIKE '%' || btrim(p_query) || '%' OR
           e.id::text = btrim(p_query));

    SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC, r.id DESC), '[]'::jsonb) INTO v_rows
    FROM (
        SELECT e.id, e.entry_type, e.amount_paise, e.balance_after_paise, e.reason,
               e.order_id, e.lot_id, e.created_at, e.actor_role, e.reverses_entry_id, e.metadata,
               a.user_id, p.full_name, p.email,
               act.full_name AS actor_name, act.email AS actor_email
        FROM public.credit_ledger e
        JOIN public.credit_accounts a ON a.id = e.account_id
        JOIN public.profiles p ON p.id = a.user_id
        LEFT JOIN public.profiles act ON act.id = e.actor_id
        WHERE (p_user_id IS NULL OR a.user_id = p_user_id)
          AND (p_entry_type IS NULL OR e.entry_type = p_entry_type)
          AND (p_from IS NULL OR e.created_at >= p_from)
          AND (p_to IS NULL OR e.created_at <= p_to)
          AND (btrim(COALESCE(p_query, '')) = '' OR
               p.full_name ILIKE '%' || btrim(p_query) || '%' OR
               p.email ILIKE '%' || btrim(p_query) || '%' OR
               COALESCE(e.reason, '') ILIKE '%' || btrim(p_query) || '%' OR
               e.id::text = btrim(p_query))
        ORDER BY e.created_at DESC, e.id DESC
        LIMIT GREATEST(p_limit, 1) OFFSET GREATEST(p_offset, 0)
    ) r;

    RETURN jsonb_build_object('total', v_total, 'rows', v_rows);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE v jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_credit_sales_paise', COALESCE((SELECT SUM(paid_paise) FROM public.credit_lots), 0),
        'total_credits_issued_paise', COALESCE((SELECT SUM(issued_paise) FROM public.credit_lots), 0),
        'total_bonus_paise', COALESCE((SELECT SUM(issued_paise - paid_paise) FROM public.credit_lots), 0),
        'outstanding_liability_paise', COALESCE((SELECT SUM(remaining_paise) FROM public.credit_lots
            WHERE status = 'active' AND expires_at > now()), 0),
        'redeemed_paise', COALESCE((SELECT SUM(-amount_paise) FROM public.credit_ledger
            WHERE entry_type = 'ORDER_DEBIT'), 0),
        'expired_paise', COALESCE((SELECT SUM(-amount_paise) FROM public.credit_ledger
            WHERE entry_type = 'EXPIRY'), 0),
        'refunded_paise', COALESCE((SELECT SUM(amount_paise) FROM public.credit_ledger
            WHERE entry_type = 'REFUND'), 0),
        'active_accounts', COALESCE((SELECT COUNT(DISTINCT account_id) FROM public.credit_lots
            WHERE status = 'active' AND expires_at > now() AND remaining_paise > 0), 0),
        'suspended_accounts', COALESCE((SELECT COUNT(*) FROM public.credit_accounts WHERE status = 'suspended'), 0),
        'expiring_7_days_paise', COALESCE((SELECT SUM(remaining_paise) FROM public.credit_lots
            WHERE status = 'active' AND expires_at > now() AND expires_at <= now() + interval '7 days'), 0),
        'expiring_7_days_accounts', COALESCE((SELECT COUNT(DISTINCT account_id) FROM public.credit_lots
            WHERE status = 'active' AND expires_at > now() AND expires_at <= now() + interval '7 days'), 0),
        'redeemed_online_paise', COALESCE((SELECT SUM(-e.amount_paise) FROM public.credit_ledger e
            JOIN public.orders o ON o.id = e.order_id
            WHERE e.entry_type = 'ORDER_DEBIT' AND o.channel = 'online'), 0),
        'redeemed_in_store_paise', COALESCE((SELECT SUM(-e.amount_paise) FROM public.credit_ledger e
            JOIN public.orders o ON o.id = e.order_id
            WHERE e.entry_type = 'ORDER_DEBIT' AND o.channel = 'in_store'), 0),
        'top_customers', COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT p.full_name, p.email, SUM(-e.amount_paise) AS redeemed_paise
                FROM public.credit_ledger e
                JOIN public.credit_accounts a ON a.id = e.account_id
                JOIN public.profiles p ON p.id = a.user_id
                WHERE e.entry_type = 'ORDER_DEBIT'
                GROUP BY p.full_name, p.email
                ORDER BY SUM(-e.amount_paise) DESC LIMIT 5
            ) t), '[]'::jsonb),
        'top_plans', COALESCE((
            SELECT jsonb_agg(t) FROM (
                SELECT pl.name, pl.code, pl.version, COUNT(*) AS activations,
                       SUM(l.paid_paise) AS revenue_paise
                FROM public.credit_lots l JOIN public.credit_plans pl ON pl.id = l.plan_id
                WHERE l.origin = 'plan'
                GROUP BY pl.name, pl.code, pl.version
                ORDER BY COUNT(*) DESC LIMIT 5
            ) t), '[]'::jsonb),
        'reconciliation_drift_rows', COALESCE((SELECT COUNT(*) FROM public.credit_reconcile()), 0)
    ) INTO v;
    RETURN v;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION
    public.credit_plan_save(bigint, text, text, bigint, bigint, integer, uuid),
    public.credit_plan_set_active(bigint, boolean, uuid),
    public.credit_plan_delete(bigint),
    public.credit_search_customers(text, integer),
    public.credit_customer_detail(uuid),
    public.credit_ledger_search(uuid, text, timestamptz, timestamptz, text, integer, integer),
    public.credit_dashboard_metrics()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.credit_plan_save(bigint, text, text, bigint, bigint, integer, uuid),
    public.credit_plan_set_active(bigint, boolean, uuid),
    public.credit_plan_delete(bigint),
    public.credit_search_customers(text, integer),
    public.credit_customer_detail(uuid),
    public.credit_ledger_search(uuid, text, timestamptz, timestamptz, text, integer, integer),
    public.credit_dashboard_metrics()
TO service_role;
