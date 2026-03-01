-- Add price_usd column for explicit USD price
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10,2) DEFAULT NULL;

-- Force PostgREST to reload its schema cache so new columns
-- (pricing_type, price_usd, price_cny) are visible to the API.
NOTIFY pgrst, 'reload schema';
