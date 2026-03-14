-- Create the admin_gallery_folders table for admin gallery management
CREATE TABLE IF NOT EXISTS admin_gallery_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_name TEXT NOT NULL,
  folder_path TEXT NOT NULL UNIQUE,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow service role full access (admin operations use service role key)
ALTER TABLE admin_gallery_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage admin gallery folders"
  ON admin_gallery_folders FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
