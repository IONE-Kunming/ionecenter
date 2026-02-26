-- Create the product-images storage bucket as public
-- This is required for getPublicUrl to return accessible URLs
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to read/download product images (public access)
CREATE POLICY "Product images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Allow service role to manage all product images (upload, update, delete)
CREATE POLICY "Service role can manage product images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'product-images' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'service_role');
