-- Create gallery_folders table to store folder metadata like cover images
CREATE TABLE IF NOT EXISTS gallery_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_path TEXT NOT NULL,
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, folder_path)
);

-- Enable RLS
ALTER TABLE gallery_folders ENABLE ROW LEVEL SECURITY;

-- Sellers can manage their own folder metadata
CREATE POLICY "Users can manage their own gallery folders"
  ON gallery_folders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups by user
CREATE INDEX idx_gallery_folders_user_id ON gallery_folders(user_id);
