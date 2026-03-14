-- Admin-assigned categories for sellers (one main category + multiple subcategories)
CREATE TABLE IF NOT EXISTS seller_categories (
  seller_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  main_category TEXT NOT NULL,
  subcategories TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE seller_categories ENABLE ROW LEVEL SECURITY;

-- Service role can manage all seller categories
CREATE POLICY "Service role can manage seller categories"
  ON seller_categories FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Sellers can read their own categories
CREATE POLICY "Sellers can read own categories"
  ON seller_categories FOR SELECT
  USING (seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));
