CREATE OR REPLACE FUNCTION public.credit_available_paise(p_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_caller uuid := auth.uid();
BEGIN
    IF v_caller IS NOT NULL AND v_caller <> p_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not permitted to read another customer balance'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    RETURN (
        SELECT COALESCE(SUM(l.remaining_paise), 0)::bigint
        FROM public.credit_lots l
        JOIN public.credit_accounts a ON a.id = l.account_id
        WHERE a.user_id = p_user_id
          AND l.status = 'active'
          AND l.expires_at > now()
    );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_account_summary(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_caller uuid := auth.uid();
    v_account public.credit_accounts;
    v_lots jsonb;
BEGIN
    IF v_caller IS NOT NULL AND v_caller <> p_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not permitted to read another customer account'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

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

REVOKE EXECUTE ON FUNCTION
    public.credit_available_paise(uuid),
    public.credit_account_summary(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
    public.credit_available_paise(uuid),
    public.credit_account_summary(uuid)
TO authenticated, service_role;
