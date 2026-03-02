-- Add video_urls column to products table to support multiple videos per product
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_urls TEXT[];

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
