CREATE TABLE IF NOT EXISTS public.credit_plan_requests (
    id                  bigserial PRIMARY KEY,
    user_id             uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    plan_id             bigint      NOT NULL REFERENCES public.credit_plans (id) ON DELETE RESTRICT,
    plan_name           text        NOT NULL,
    plan_code           text        NOT NULL,
    plan_version        integer     NOT NULL,
    price_paise         bigint      NOT NULL,
    credit_paise        bigint      NOT NULL,
    validity_days       integer     NOT NULL,
    status              text        NOT NULL DEFAULT 'pending',
    contact_phone       text,
    customer_note       text,
    admin_note          text,
    handled_by          uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
    handled_at          timestamptz,
    activation_entry_id bigint      REFERENCES public.credit_ledger (id) ON DELETE RESTRICT,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT credit_plan_requests_status_check CHECK (
        status IN ('pending', 'contacted', 'approved', 'rejected', 'cancelled')
    ),
    CONSTRAINT credit_plan_requests_amounts_check CHECK (
        price_paise > 0 AND credit_paise > 0 AND validity_days > 0
    ),
    CONSTRAINT credit_plan_requests_approved_has_entry CHECK (
        status <> 'approved' OR activation_entry_id IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS credit_plan_requests_one_open_idx
    ON public.credit_plan_requests (user_id)
    WHERE status IN ('pending', 'contacted');

CREATE INDEX IF NOT EXISTS credit_plan_requests_queue_idx
    ON public.credit_plan_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_plan_requests_user_idx
    ON public.credit_plan_requests (user_id, created_at DESC);

DROP TRIGGER IF EXISTS credit_plan_requests_touch ON public.credit_plan_requests;
CREATE TRIGGER credit_plan_requests_touch
    BEFORE UPDATE ON public.credit_plan_requests
    FOR EACH ROW EXECUTE FUNCTION public.touch_credit_account();

ALTER TABLE public.credit_plan_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_plan_requests_service_all ON public.credit_plan_requests;
CREATE POLICY credit_plan_requests_service_all ON public.credit_plan_requests
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS credit_plan_requests_read ON public.credit_plan_requests;
CREATE POLICY credit_plan_requests_read ON public.credit_plan_requests
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.credit_request_create(
    p_user_id uuid, p_plan_id bigint, p_contact_phone text, p_customer_note text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_plan public.credit_plans;
    v_open public.credit_plan_requests;
    v_id bigint;
    v_status text;
BEGIN
    SELECT status INTO v_status FROM public.credit_accounts WHERE user_id = p_user_id;
    IF v_status = 'suspended' THEN
        RAISE EXCEPTION 'This account is on hold. Please contact the store.'
            USING ERRCODE = 'check_violation';
    END IF;

    SELECT * INTO v_open FROM public.credit_plan_requests
    WHERE user_id = p_user_id AND status IN ('pending', 'contacted')
    FOR UPDATE;

    IF FOUND THEN
        RETURN jsonb_build_object('status', 'already_open', 'request_id', v_open.id,
                                  'plan_name', v_open.plan_name, 'request_status', v_open.status);
    END IF;

    SELECT * INTO v_plan FROM public.credit_plans WHERE id = p_plan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan not found' USING ERRCODE = 'no_data_found';
    END IF;
    IF NOT v_plan.is_active THEN
        RAISE EXCEPTION 'That plan is no longer available' USING ERRCODE = 'check_violation';
    END IF;

    INSERT INTO public.credit_plan_requests (
        user_id, plan_id, plan_name, plan_code, plan_version,
        price_paise, credit_paise, validity_days, contact_phone, customer_note
    ) VALUES (
        p_user_id, v_plan.id, v_plan.name, v_plan.code, v_plan.version,
        v_plan.price_paise, v_plan.credit_paise, v_plan.validity_days,
        NULLIF(btrim(COALESCE(p_contact_phone, '')), ''),
        NULLIF(btrim(COALESCE(p_customer_note, '')), '')
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('status', 'created', 'request_id', v_id,
                              'plan_name', v_plan.name, 'price_paise', v_plan.price_paise);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_request_cancel(p_request_id bigint, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE v_req public.credit_plan_requests;
BEGIN
    SELECT * INTO v_req FROM public.credit_plan_requests WHERE id = p_request_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found' USING ERRCODE = 'no_data_found';
    END IF;
    IF v_req.user_id <> p_user_id THEN
        RAISE EXCEPTION 'Not your request' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF v_req.status NOT IN ('pending', 'contacted') THEN
        RAISE EXCEPTION 'This request is already %', v_req.status USING ERRCODE = 'check_violation';
    END IF;

    UPDATE public.credit_plan_requests
    SET status = 'cancelled', handled_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('status', 'cancelled', 'request_id', p_request_id);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_request_set_status(
    p_request_id bigint, p_status text, p_admin_note text, p_actor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE v_req public.credit_plan_requests;
BEGIN
    IF p_status NOT IN ('contacted', 'rejected') THEN
        RAISE EXCEPTION 'Use credit_request_approve to approve, or set contacted/rejected';
    END IF;
    IF p_status = 'rejected' AND (p_admin_note IS NULL OR btrim(p_admin_note) = '') THEN
        RAISE EXCEPTION 'A reason is required to reject a request';
    END IF;

    SELECT * INTO v_req FROM public.credit_plan_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found' USING ERRCODE = 'no_data_found';
    END IF;
    IF v_req.status NOT IN ('pending', 'contacted') THEN
        RAISE EXCEPTION 'This request is already %', v_req.status USING ERRCODE = 'check_violation';
    END IF;

    UPDATE public.credit_plan_requests
    SET status = p_status,
        admin_note = COALESCE(NULLIF(btrim(COALESCE(p_admin_note, '')), ''), admin_note),
        handled_by = p_actor_id,
        handled_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object('status', p_status, 'request_id', p_request_id);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_request_approve(
    p_request_id bigint, p_receipt_reference text, p_admin_note text,
    p_actor_id uuid, p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
    v_req public.credit_plan_requests;
    v_result jsonb;
BEGIN
    SELECT * INTO v_req FROM public.credit_plan_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found' USING ERRCODE = 'no_data_found';
    END IF;
    IF v_req.status = 'approved' THEN
        RETURN jsonb_build_object('status', 'already_approved', 'request_id', p_request_id,
                                  'entry_id', v_req.activation_entry_id);
    END IF;
    IF v_req.status NOT IN ('pending', 'contacted') THEN
        RAISE EXCEPTION 'This request is already %', v_req.status USING ERRCODE = 'check_violation';
    END IF;

    v_result := public.credit_activate_plan(
        v_req.user_id, v_req.plan_id, p_receipt_reference,
        p_actor_id, p_idempotency_key,
        format('%s activated from request #%s', v_req.plan_name, p_request_id)
    );

    IF v_result->>'status' NOT IN ('activated', 'duplicate') THEN
        RAISE EXCEPTION 'Activation did not complete: %', v_result::text;
    END IF;

    UPDATE public.credit_plan_requests
    SET status = 'approved',
        admin_note = COALESCE(NULLIF(btrim(COALESCE(p_admin_note, '')), ''), admin_note),
        handled_by = p_actor_id,
        handled_at = now(),
        activation_entry_id = (v_result->>'entry_id')::bigint
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'status', 'approved', 'request_id', p_request_id,
        'entry_id', (v_result->>'entry_id')::bigint,
        'issued_paise', v_result->>'issued_paise',
        'expires_at', v_result->>'expires_at',
        'user_id', v_req.user_id
    );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_request_queue(
    p_status text DEFAULT NULL, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE v_rows jsonb; v_total bigint; v_counts jsonb;
BEGIN
    SELECT COUNT(*) INTO v_total FROM public.credit_plan_requests r
    WHERE p_status IS NULL OR r.status = p_status;

    SELECT COALESCE(jsonb_object_agg(s, n), '{}'::jsonb) INTO v_counts
    FROM (SELECT status AS s, COUNT(*) AS n FROM public.credit_plan_requests GROUP BY status) x;

    SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC), '[]'::jsonb) INTO v_rows
    FROM (
        SELECT r.id, r.status, r.plan_name, r.plan_code, r.plan_version,
               r.price_paise, r.credit_paise, r.validity_days,
               r.contact_phone, r.customer_note, r.admin_note,
               r.created_at, r.handled_at, r.activation_entry_id,
               r.user_id, p.full_name, p.email, p.phone_number,
               h.full_name AS handled_by_name,
               COALESCE((SELECT SUM(l.remaining_paise) FROM public.credit_lots l
                         JOIN public.credit_accounts a ON a.id = l.account_id
                         WHERE a.user_id = r.user_id AND l.status = 'active'
                           AND l.expires_at > now()), 0) AS current_balance_paise
        FROM public.credit_plan_requests r
        JOIN public.profiles p ON p.id = r.user_id
        LEFT JOIN public.profiles h ON h.id = r.handled_by
        WHERE p_status IS NULL OR r.status = p_status
        ORDER BY r.created_at DESC
        LIMIT GREATEST(p_limit, 1) OFFSET GREATEST(p_offset, 0)
    ) t;

    RETURN jsonb_build_object('total', v_total, 'counts', v_counts, 'rows', v_rows);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.credit_request_mine(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
    SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC), '[]'::jsonb)
    FROM (
        SELECT id, status, plan_name, price_paise, credit_paise, validity_days,
               customer_note, admin_note, created_at, handled_at
        FROM public.credit_plan_requests
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 10
    ) t;
$fn$;

REVOKE EXECUTE ON FUNCTION
    public.credit_request_create(uuid, bigint, text, text),
    public.credit_request_cancel(bigint, uuid),
    public.credit_request_set_status(bigint, text, text, uuid),
    public.credit_request_approve(bigint, text, text, uuid, text),
    public.credit_request_queue(text, integer, integer),
    public.credit_request_mine(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.credit_request_create(uuid, bigint, text, text),
    public.credit_request_cancel(bigint, uuid),
    public.credit_request_set_status(bigint, text, text, uuid),
    public.credit_request_approve(bigint, text, text, uuid, text),
    public.credit_request_queue(text, integer, integer),
    public.credit_request_mine(uuid)
TO service_role;

COMMENT ON TABLE public.credit_plan_requests IS
    'Customer intent to buy a plan. Carries a snapshot of the plan terms as requested, so later plan versions cannot silently change what was asked for. Approval activates the exact plan version requested and records the resulting ledger entry.';
