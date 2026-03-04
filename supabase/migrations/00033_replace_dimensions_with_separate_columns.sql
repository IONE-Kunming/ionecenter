-- Replace the single "dimensions" text column with separate numeric columns
ALTER TABLE packing_list_items DROP COLUMN IF EXISTS dimensions;

ALTER TABLE packing_list_items ADD COLUMN IF NOT EXISTS height numeric DEFAULT 0;
ALTER TABLE packing_list_items ADD COLUMN IF NOT EXISTS length numeric DEFAULT 0;
ALTER TABLE packing_list_items ADD COLUMN IF NOT EXISTS width  numeric DEFAULT 0;

-- Reload PostgREST schema cache so new columns are visible immediately
NOTIFY pgrst, 'reload schema';
