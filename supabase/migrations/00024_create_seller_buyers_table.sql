-- Create seller_buyers table: stores each seller's personal list of buyers
CREATE TABLE IF NOT EXISTS seller_buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(seller_id, buyer_id)
);

-- Index for fast lookup by seller
CREATE INDEX IF NOT EXISTS idx_seller_buyers_seller_id ON seller_buyers(seller_id);

-- Reload PostgREST schema cache so the new table is immediately available
NOTIFY pgrst, 'reload schema';
