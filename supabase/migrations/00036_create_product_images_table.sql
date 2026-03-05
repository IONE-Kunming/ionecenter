-- Create the product_images table for multiple image support
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by product
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Sellers can manage images for their own products
CREATE POLICY "Sellers can insert images for own products"
  ON product_images FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM products WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can update images for own products"
  ON product_images FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM products WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can delete images for own products"
  ON product_images FOR DELETE
  USING (
    product_id IN (
      SELECT id FROM products WHERE seller_id = auth.uid()
    )
  );

-- Everyone can view product images (buyers, guests via service role)
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  USING (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
