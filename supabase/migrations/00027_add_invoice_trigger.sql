-- Ensure invoice_counter always has its initial row so that
-- generate_invoice_number() never returns NULL.
INSERT INTO invoice_counter (id, year, last_number)
VALUES (1, EXTRACT(YEAR FROM NOW())::INTEGER, 0)
ON CONFLICT (id) DO NOTHING;

-- Trigger function: automatically creates an invoice record whenever
-- a new order is inserted.  Invoice items are NOT added here because
-- order_items are inserted by the application after the order row;
-- the application's createInvoice() call will add them once they exist.
CREATE OR REPLACE FUNCTION create_invoice_for_order()
RETURNS TRIGGER AS $$
DECLARE
  inv_number TEXT;
BEGIN
  -- Skip if an invoice already exists for this order (idempotent)
  IF EXISTS (SELECT 1 FROM invoices WHERE order_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Ensure the counter row exists before generating a number
  INSERT INTO invoice_counter (id, year, last_number)
  VALUES (1, EXTRACT(YEAR FROM NOW())::INTEGER, 0)
  ON CONFLICT (id) DO NOTHING;

  SELECT generate_invoice_number() INTO inv_number;

  IF inv_number IS NULL THEN
    RAISE WARNING 'generate_invoice_number() returned NULL for order %', NEW.id;
    RETURN NEW;
  END IF;

  INSERT INTO invoices (
    invoice_number, order_id, buyer_id, seller_id,
    subtotal, tax, total, deposit_paid, remaining_balance,
    status, paid_at
  ) VALUES (
    inv_number, NEW.id, NEW.buyer_id, NEW.seller_id,
    NEW.subtotal, NEW.tax, NEW.total, NEW.deposit_amount, NEW.remaining_balance,
    CASE WHEN NEW.remaining_balance <= 0 THEN 'paid' ELSE 'issued' END,
    CASE WHEN NEW.remaining_balance <= 0 THEN NOW() ELSE NULL END
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block order creation due to invoice errors; log and continue.
  RAISE WARNING 'Failed to create invoice for order %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the orders table
DROP TRIGGER IF EXISTS trigger_create_invoice_on_order_insert ON orders;
CREATE TRIGGER trigger_create_invoice_on_order_insert
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_for_order();
