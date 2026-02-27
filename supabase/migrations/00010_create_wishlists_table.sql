-- Migration: 00010_create_wishlists_table
-- Wishlist / My List feature

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id, created_at DESC);
CREATE INDEX idx_wishlists_product ON wishlists(product_id);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Users can only read their own wishlist items
CREATE POLICY "Users can read own wishlist" ON wishlists
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Users can add to their own wishlist
CREATE POLICY "Users can insert own wishlist" ON wishlists
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Users can remove from their own wishlist
CREATE POLICY "Users can delete own wishlist" ON wishlists
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Service role can manage all wishlists
CREATE POLICY "Service role can manage wishlists" ON wishlists
  FOR ALL USING (auth.role() = 'service_role');
