CREATE OR REPLACE FUNCTION public.orders_fill_paise_columns()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $fn$
BEGIN
    IF NEW.total_amount_paise IS NULL THEN
        NEW.total_amount_paise := ROUND(COALESCE(NEW.total_amount, 0) * 100)::bigint;
    END IF;

    IF NEW.credits_applied_paise IS NULL THEN
        NEW.credits_applied_paise := 0;
    END IF;

    IF NEW.amount_due_paise IS NULL THEN
        NEW.amount_due_paise := NEW.total_amount_paise - NEW.credits_applied_paise;
    END IF;

    RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS orders_fill_paise ON public.orders;
CREATE TRIGGER orders_fill_paise
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.orders_fill_paise_columns();

COMMENT ON FUNCTION public.orders_fill_paise_columns() IS
    'Derives the integer paise columns from total_amount when a caller omits them. Keeps order placement working for application code deployed before migration 009.';
