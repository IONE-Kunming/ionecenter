-- Ensure products are readable by all roles (anon, authenticated, service_role).
-- The original policy "Products are publicly readable" uses USING (true), which
-- should allow reads for every role.  Re-create it here as a safety net so that
-- buyers authenticated via Clerk (whose Supabase role resolves to anon or
-- authenticated) are never blocked by RLS.

DO $$
BEGIN
  -- Drop and recreate only if needed (idempotent)
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'products' AND policyname = 'Products are publicly readable'
  ) THEN
    DROP POLICY "Products are publicly readable" ON products;
  END IF;
END
$$;

CREATE POLICY "Products are publicly readable" ON products
  FOR SELECT
  USING (true);

-- Reload PostgREST schema cache so any recent column additions are visible
NOTIFY pgrst, 'reload schema';
