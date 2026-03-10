-- Pinned categories for seller "View as Buyer" preview mode
CREATE TABLE IF NOT EXISTS pinned_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Each seller can only pin a given category once
CREATE UNIQUE INDEX IF NOT EXISTS pinned_categories_seller_category
  ON pinned_categories (seller_id, category_name);

-- Enable RLS
ALTER TABLE pinned_categories ENABLE ROW LEVEL SECURITY;

-- Sellers can read their own pinned categories
CREATE POLICY "Sellers can read own pinned categories"
  ON pinned_categories FOR SELECT
  USING (seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Service role can manage all pinned categories
CREATE POLICY "Service role can manage pinned categories"
  ON pinned_categories FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
