-- Create the gallery_folders table
CREATE TABLE IF NOT EXISTS gallery_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  folder_path TEXT NOT NULL,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one folder_path per seller
ALTER TABLE gallery_folders ADD CONSTRAINT gallery_folders_seller_path_unique UNIQUE (seller_id, folder_path);

-- RLS
ALTER TABLE gallery_folders ENABLE ROW LEVEL SECURITY;

-- Sellers can manage their own folders
CREATE POLICY "Sellers can view own gallery folders"
  ON gallery_folders FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert own gallery folders"
  ON gallery_folders FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update own gallery folders"
  ON gallery_folders FOR UPDATE
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete own gallery folders"
  ON gallery_folders FOR DELETE
  USING (seller_id = auth.uid());
