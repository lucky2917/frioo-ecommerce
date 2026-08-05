ALTER TABLE IF EXISTS public.products_backup_fresh_fruit_20260803 ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reject_order_payment_mutation()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $fn$
BEGIN
    RAISE EXCEPTION
        'order_payments is append only. Record a correcting entry instead of altering %.',
        COALESCE(OLD.id::text, 'row');
END;
$fn$;

CREATE OR REPLACE FUNCTION public.reject_credit_ledger_mutation()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $fn$
BEGIN
    RAISE EXCEPTION
        'credit_ledger is append only. Append a REVERSAL entry instead of altering entry %.',
        COALESCE(OLD.id::text, 'row');
END;
$fn$;

CREATE OR REPLACE FUNCTION public.reject_issued_plan_delete()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $fn$
BEGIN
    IF EXISTS (SELECT 1 FROM public.credit_lots WHERE plan_id = OLD.id) THEN
        RAISE EXCEPTION
            'Plan % has issued credits and can only be archived, never deleted.', OLD.id;
    END IF;
    RETURN OLD;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.touch_credit_account()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $fn$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$fn$;
