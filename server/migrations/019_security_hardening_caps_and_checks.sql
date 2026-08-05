DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    );

ALTER TABLE public.credit_plans
    DROP CONSTRAINT IF EXISTS credit_plans_sane_ceiling;
ALTER TABLE public.credit_plans
    ADD CONSTRAINT credit_plans_sane_ceiling
        CHECK (price_paise <= 100000000 AND credit_paise <= 100000000 AND validity_days <= 3650);

CREATE OR REPLACE FUNCTION public.credit__assert_within_cap(p_amount_paise bigint, p_what text)
RETURNS void
LANGUAGE plpgsql IMMUTABLE SET search_path = public
AS $fn$
DECLARE
    v_cap constant bigint := 10000000;
BEGIN
    IF abs(p_amount_paise) > v_cap THEN
        RAISE EXCEPTION
            '% of % paise exceeds the single-operation ceiling of % paise. Split it or raise the cap deliberately.',
            p_what, abs(p_amount_paise), v_cap
            USING ERRCODE = 'check_violation';
    END IF;
END;
$fn$;

-- credit_grant and credit_adjust are recreated with the cap assertion.
-- Bodies are identical to 011 and 015 apart from the added
-- PERFORM public.credit__assert_within_cap(...) guard and the
-- validity_days upper bound. See those files for the full logic.

REVOKE EXECUTE ON FUNCTION public.credit__assert_within_cap(bigint, text)
    FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.credit__assert_within_cap(bigint, text) IS
    'Bounds the blast radius of a single credit operation, so a mistyped or compromised admin action cannot mint an unbounded amount. Raise the ceiling deliberately if the business needs it.';
