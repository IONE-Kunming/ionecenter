-- Junction table linking sellers to their assigned site categories
CREATE TABLE IF NOT EXISTS seller_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES site_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (seller_id, category_id)
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
