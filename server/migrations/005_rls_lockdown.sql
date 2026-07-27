-- Phase 3: RLS lockdown (Strategy B).
-- Closes: anonymous/all-user profile PII read, self role escalation,
-- direct client order-insert validation bypass, and public coupon internals read.
-- Also standardizes every admin check on public.is_admin() so no policy depends on
-- reading profiles inside another policy.
-- Runs as one atomic transaction and is safely re-runnable. Apply in the SQL Editor.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Canonical admin check. SECURITY DEFINER so the lookup bypasses RLS: it never
-- recurses into the profiles policy that calls it, and it decouples every admin
-- policy from the shape of the profiles SELECT policy. EXISTS returns false, never
-- NULL, when the caller has no profile. Least privilege: only authenticated (policy
-- evaluation) and service_role need EXECUTE; anon never reaches it.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Role guard: role is not writable by anonymous or authenticated non-admin callers.
-- Gate on the signed request JWT role claim (auth.role()), which a client cannot
-- forge, rather than on auth.uid() -- which is NULL for BOTH service_role AND anon.
-- service_role and admins pass through; anon is caught by its 'anon' role claim.
CREATE OR REPLACE FUNCTION public.enforce_profile_role_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.role := OLD.role;
    ELSE
      NEW.role := 'customer';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_profile_role_guard() FROM PUBLIC;

DROP TRIGGER IF EXISTS profile_role_guard ON public.profiles;
CREATE TRIGGER profile_role_guard
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_guard();

-- profiles: replace the world-readable SELECT with owner-or-admin.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner or admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- profiles: admin update policy on is_admin() (was an inline profiles subquery).
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- orders: remove direct client inserts. Placement is server-only via the service
-- role (bypasses RLS); this closes the server-validation bypass.
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;

-- orders: admin policy on is_admin() (was an inline profiles subquery).
DROP POLICY IF EXISTS "Admins can do everything" ON public.orders;
CREATE POLICY "Admins can do everything"
  ON public.orders
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- coupons: remove public read; the storefront reads coupons through the API.
DROP POLICY IF EXISTS "Public read access" ON public.coupons;

-- coupons: admin policy on is_admin() (was an inline profiles subquery).
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
  ON public.coupons
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- products: admin policy on is_admin() (was an inline profiles subquery).
DROP POLICY IF EXISTS "Admins can edit products" ON public.products;
CREATE POLICY "Admins can edit products"
  ON public.products
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;

-- =====================================================================
-- ROLLBACK
-- Restores the exact pre-migration state. Every recreated policy is reproduced
-- from the pg_policies dump (name, roles, command, USING, WITH CHECK), including
-- the original inline "(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'"
-- admin checks. Re-runnable. Run as one transaction.
-- =====================================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS profile_role_guard ON public.profiles;
-- DROP FUNCTION IF EXISTS public.enforce_profile_role_guard();
--
-- DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON public.profiles;
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
-- CREATE POLICY "Public profiles are viewable by everyone"
--   ON public.profiles FOR SELECT TO public USING (true);
--
-- DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
-- CREATE POLICY "Admins can update any profile"
--   ON public.profiles FOR UPDATE TO public
--   USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
--
-- DROP POLICY IF EXISTS "Admins can do everything" ON public.orders;
-- CREATE POLICY "Admins can do everything"
--   ON public.orders FOR ALL TO public
--   USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
-- DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
-- CREATE POLICY "Users can create orders"
--   ON public.orders FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
-- DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
-- CREATE POLICY "Users can insert own orders"
--   ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
--
-- DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
-- CREATE POLICY "Admins can manage coupons"
--   ON public.coupons FOR ALL TO public
--   USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
-- DROP POLICY IF EXISTS "Public read access" ON public.coupons;
-- CREATE POLICY "Public read access"
--   ON public.coupons FOR SELECT TO public USING (true);
--
-- DROP POLICY IF EXISTS "Admins can edit products" ON public.products;
-- CREATE POLICY "Admins can edit products"
--   ON public.products FOR ALL TO public
--   USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
--
-- DROP FUNCTION IF EXISTS public.is_admin();
-- COMMIT;
