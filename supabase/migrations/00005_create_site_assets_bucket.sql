-- Create the site-assets storage bucket for videos, category images, and other site content
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to read/download site assets (public access)
CREATE POLICY "Site assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

-- Allow service role to manage all site assets (upload, update, delete)
CREATE POLICY "Service role can manage site assets"
  ON storage.objects FOR ALL
  USING (bucket_id = 'site-assets' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'site-assets' AND auth.role() = 'service_role');
