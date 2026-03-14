-- Update seller_categories from junction table to single-row-per-seller design
-- New schema: one row per seller with main_category (text) + subcategories (text array)
DROP TABLE IF EXISTS seller_categories;

CREATE TABLE seller_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  main_category TEXT NOT NULL,
  subcategories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (seller_id)
);

-- Enable RLS
ALTER TABLE seller_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read seller categories
CREATE POLICY "Seller categories are publicly readable"
  ON seller_categories FOR SELECT USING (true);

-- Only service role can modify seller categories
CREATE POLICY "Service role can manage seller categories"
  ON seller_categories FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
