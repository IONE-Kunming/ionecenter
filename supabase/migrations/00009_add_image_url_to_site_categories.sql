-- Add image_url column to site_categories if it doesn't already exist
ALTER TABLE site_categories ADD COLUMN IF NOT EXISTS image_url TEXT;
