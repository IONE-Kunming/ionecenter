-- Ensure required storage buckets exist
-- Safe to re-run: uses ON CONFLICT DO UPDATE to ensure public flag is set

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure storage policies exist (uses IF NOT EXISTS pattern via DO block)
DO $$
BEGIN
  -- product-images policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Product images are publicly accessible' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Product images are publicly accessible"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage product images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Service role can manage product images"
      ON storage.objects FOR ALL
      USING (bucket_id = 'product-images' AND auth.role() = 'service_role')
      WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'service_role');
  END IF;

  -- site-assets policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Site assets are publicly accessible' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Site assets are publicly accessible"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'site-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage site assets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Service role can manage site assets"
      ON storage.objects FOR ALL
      USING (bucket_id = 'site-assets' AND auth.role() = 'service_role')
      WITH CHECK (bucket_id = 'site-assets' AND auth.role() = 'service_role');
  END IF;
END;
$$;
