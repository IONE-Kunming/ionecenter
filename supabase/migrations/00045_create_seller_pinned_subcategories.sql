-- Pinned subcategories for seller "View as Buyer" preview mode
CREATE TABLE IF NOT EXISTS seller_pinned_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES site_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Each seller can only pin a given subcategory once
CREATE UNIQUE INDEX IF NOT EXISTS seller_pinned_subcategories_seller_category
  ON seller_pinned_subcategories (seller_id, category_id);

-- Enable RLS
ALTER TABLE seller_pinned_subcategories ENABLE ROW LEVEL SECURITY;

-- Service role can manage all pinned subcategories
CREATE POLICY "Service role can manage pinned subcategories"
  ON seller_pinned_subcategories FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
