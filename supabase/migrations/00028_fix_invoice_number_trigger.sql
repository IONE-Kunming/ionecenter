-- The generate_invoice_number() function returns TEXT, which is not a valid return
-- type for a trigger function.  If the generate_invoice_number_trigger was manually
-- created on the invoices table (BEFORE INSERT … EXECUTE FUNCTION generate_invoice_number()),
-- any INSERT into invoices fails with "function must return type trigger".
--
-- Fix: create a proper BEFORE INSERT trigger function that calls
-- generate_invoice_number() to obtain a sequential number and stores it on NEW,
-- then returns NEW.  The trigger only sets invoice_number when the caller has not
-- already supplied one, so existing code that provides invoice_number explicitly
-- continues to work without double-incrementing the counter.

CREATE OR REPLACE FUNCTION set_invoice_number_if_missing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the broken trigger (if it exists) with the corrected one.
DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON invoices;
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number_if_missing();

-- Ensure the invoice_counter seed row exists so generate_invoice_number()
-- never returns NULL due to a missing row.
INSERT INTO invoice_counter (id, year, last_number)
VALUES (1, EXTRACT(YEAR FROM NOW())::INTEGER, 0)
ON CONFLICT (id) DO NOTHING;

-- Re-create the order-level trigger (from migration 00027) in case it was
-- never applied to this Supabase instance.
CREATE OR REPLACE FUNCTION create_invoice_for_order()
RETURNS TRIGGER AS $$
DECLARE
  inv_number TEXT;
BEGIN
  -- Idempotent: skip if an invoice already exists for this order.
  IF EXISTS (SELECT 1 FROM invoices WHERE order_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Generate the number explicitly so we can validate it before inserting.
  -- The set_invoice_number_if_missing() BEFORE INSERT trigger also calls
  -- generate_invoice_number(), but only when invoice_number IS NULL.
  -- Because we supply a non-NULL value here, the trigger is a no-op for this
  -- INSERT — there is no double-increment of the counter.
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

DROP TRIGGER IF EXISTS trigger_create_invoice_on_order_insert ON orders;
CREATE TRIGGER trigger_create_invoice_on_order_insert
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_for_order();
