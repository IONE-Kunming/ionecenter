-- Improve indexes and RLS policies for the cart → checkout → order flow
-- Migration: 00013_cart_order_indexes_and_policies

-- ============================================================
-- INDEXES
-- ============================================================

-- Fast lookup of order items when loading order details
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Fast lookup of invoices for a given order
CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);

-- Filter orders by payment status (e.g. pending, deposit_paid, paid)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Composite index for buyer order queries filtered by status
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_id, status);

-- Composite index for seller order queries filtered by status
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders(seller_id, status);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Ensure carts.updated_at is kept current on every update
CREATE TRIGGER IF NOT EXISTS update_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS POLICY REFINEMENTS
-- ============================================================

-- Allow service role full access to orders (needed for admin operations
-- and invoice-creation flow that reads the order with admin client)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Service role can manage orders'
  ) THEN
    CREATE POLICY "Service role can manage orders" ON orders
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Allow service role full access to order_items (used during invoice creation)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Service role can manage order items'
  ) THEN
    CREATE POLICY "Service role can manage order items" ON order_items
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
