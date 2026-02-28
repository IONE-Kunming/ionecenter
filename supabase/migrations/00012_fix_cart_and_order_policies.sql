-- Fix cart and order-related RLS policies so buyers can place orders
-- Migration: 00012_fix_cart_and_order_policies

-- ============================================================
-- CART POLICIES
-- ============================================================
-- Replace the single FOR ALL policy with explicit per-operation
-- policies that include WITH CHECK clauses for INSERT/UPDATE,
-- ensuring upsert operations work reliably for buyers.

-- Drop existing cart policy
DROP POLICY IF EXISTS "Users can manage own cart" ON carts;

-- Buyers can read their own cart
CREATE POLICY "Users can read own cart" ON carts
  FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Buyers can create their own cart (first add-to-cart creates the row)
CREATE POLICY "Users can insert own cart" ON carts
  FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Buyers can update their own cart (subsequent add-to-cart / upsert updates)
CREATE POLICY "Users can update own cart" ON carts
  FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Buyers can delete their own cart
CREATE POLICY "Users can delete own cart" ON carts
  FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Service role can manage all carts (used to clear cart after checkout)
CREATE POLICY "Service role can manage carts" ON carts
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- INVOICE POLICIES
-- ============================================================
-- Add UPDATE policy for invoices so that order participants
-- (buyer, seller, admin) can update invoice status, e.g. when
-- processing remaining payment via processRemainingPayment().

CREATE POLICY "Order participants can update invoices" ON invoices
  FOR UPDATE
  USING (
    buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
  )
  WITH CHECK (
    buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
  );
