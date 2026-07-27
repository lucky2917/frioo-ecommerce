-- Atomic stock decrement primitive consumed by order placement.
-- Computes stock = stock - qty inside the row lock so concurrent orders cannot oversell.
-- Returns true when decremented or when stock is unlimited (NULL), false when insufficient or missing.
-- Execute is locked to service_role so only the server can call it.
CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_id bigint, p_qty integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.products
    SET stock = stock - p_qty
    WHERE id = p_id AND stock >= p_qty;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count > 0 THEN
    RETURN true;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.products WHERE id = p_id AND stock IS NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_product_stock(bigint, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_product_stock(bigint, integer) FROM anon;
REVOKE ALL ON FUNCTION public.decrement_product_stock(bigint, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(bigint, integer) TO service_role;
