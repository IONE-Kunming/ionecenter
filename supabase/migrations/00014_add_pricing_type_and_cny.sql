-- Add pricing_type column (standard or customized)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS pricing_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (pricing_type IN ('standard', 'customized'));

-- Add price_cny column for CNY price
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_cny DECIMAL(10,2) DEFAULT NULL;
