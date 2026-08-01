-- Store availability, opening hours and delivery pricing.
-- Single settings row the storefront reads and admins edit.
-- Adds orders.delivery_fee so a placed order keeps the fee it was charged
-- even if the threshold changes later.
-- Runs as one atomic transaction and is safely re-runnable.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS public.store_settings (
  id boolean PRIMARY KEY DEFAULT true,
  is_open boolean NOT NULL DEFAULT true,
  closed_message text,
  unavailable_categories text[] NOT NULL DEFAULT '{}'::text[],
  opens_at_hour smallint NOT NULL DEFAULT 8,
  closes_at_hour smallint NOT NULL DEFAULT 22,
  delivery_fee_cents integer NOT NULL DEFAULT 2900,
  free_delivery_threshold_cents integer NOT NULL DEFAULT 31900,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_singleton CHECK (id),
  CONSTRAINT store_settings_opens_range CHECK (opens_at_hour >= 0 AND opens_at_hour <= 23),
  CONSTRAINT store_settings_closes_range CHECK (closes_at_hour >= 1 AND closes_at_hour <= 24),
  CONSTRAINT store_settings_window CHECK (closes_at_hour > opens_at_hour),
  CONSTRAINT store_settings_fee CHECK (delivery_fee_cents >= 0),
  CONSTRAINT store_settings_threshold CHECK (free_delivery_threshold_cents >= 0)
);

INSERT INTO public.store_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_settings_public_read ON public.store_settings;
CREATE POLICY store_settings_public_read
  ON public.store_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS store_settings_admin_write ON public.store_settings;
CREATE POLICY store_settings_admin_write
  ON public.store_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS store_settings_no_insert ON public.store_settings;
CREATE POLICY store_settings_no_insert
  ON public.store_settings FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS store_settings_no_delete ON public.store_settings;
CREATE POLICY store_settings_no_delete
  ON public.store_settings FOR DELETE
  TO authenticated
  USING (false);

CREATE OR REPLACE FUNCTION public.touch_store_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_settings_touch ON public.store_settings;
CREATE TRIGGER store_settings_touch
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_store_settings();

COMMIT;
