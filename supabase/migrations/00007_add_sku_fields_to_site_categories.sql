-- Add IONE SKU code and factory SKU code columns to site_categories
ALTER TABLE site_categories ADD COLUMN IF NOT EXISTS ione_sku TEXT;
ALTER TABLE site_categories ADD COLUMN IF NOT EXISTS factory_sku TEXT;
