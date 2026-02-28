-- Update order status CHECK constraint to match new lifecycle
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'under_review', 'confirmed', 'in_production', 'out_of_production', 'shipped', 'arrived_at_port', 'delivered'));

-- Update any existing 'draft' or 'processing' or 'cancelled' orders to valid statuses
UPDATE orders SET status = 'pending' WHERE status = 'draft';
UPDATE orders SET status = 'confirmed' WHERE status = 'processing';
UPDATE orders SET status = 'pending' WHERE status = 'cancelled';

-- Set default to 'pending'
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';
