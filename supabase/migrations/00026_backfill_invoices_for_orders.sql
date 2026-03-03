-- Ensure invoice_counter has the initial row (in case it was missing)
INSERT INTO invoice_counter (id, year, last_number)
VALUES (1, EXTRACT(YEAR FROM NOW())::INTEGER, 0)
ON CONFLICT (id) DO NOTHING;

-- Backfill invoices for all orders that do not already have a corresponding invoice
DO $$
DECLARE
  o RECORD;
  inv_number TEXT;
  inv_id UUID;
BEGIN
  FOR o IN
    SELECT ord.*
    FROM orders ord
    WHERE NOT EXISTS (
      SELECT 1 FROM invoices inv WHERE inv.order_id = ord.id
    )
    ORDER BY ord.created_at ASC
  LOOP
    -- Generate a sequential invoice number using the existing function
    SELECT generate_invoice_number() INTO inv_number;

    -- Insert the invoice record mirroring the order totals
    INSERT INTO invoices (
      invoice_number,
      order_id,
      buyer_id,
      seller_id,
      subtotal,
      tax,
      total,
      deposit_paid,
      remaining_balance,
      status,
      paid_at,
      created_at,
      updated_at
    ) VALUES (
      inv_number,
      o.id,
      o.buyer_id,
      o.seller_id,
      o.subtotal,
      o.tax,
      o.total,
      o.deposit_amount,
      o.remaining_balance,
      CASE WHEN o.remaining_balance <= 0 THEN 'paid' ELSE 'issued' END,
      CASE WHEN o.remaining_balance <= 0 THEN NOW() ELSE NULL END,
      o.created_at,
      o.updated_at
    )
    RETURNING id INTO inv_id;

    -- Copy the order items into invoice_items
    INSERT INTO invoice_items (invoice_id, name, quantity, unit, price, subtotal)
    SELECT
      inv_id,
      oi.name,
      oi.quantity,
      'm', -- unit is always 'meters' for fabric products (consistent with createInvoice in lib/actions/invoices.ts)
      COALESCE(
        oi.price_per_meter,
        CASE WHEN oi.quantity > 0 THEN ROUND((oi.price / oi.quantity)::numeric, 2) ELSE 0 END
      ),
      oi.price
    FROM order_items oi
    WHERE oi.order_id = o.id;

  END LOOP;
END $$;
