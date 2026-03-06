-- Add length and width columns to order_items for customized products
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS length NUMERIC;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS width NUMERIC;

-- Add length and width columns to invoice_items for customized products
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS length NUMERIC;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS width NUMERIC;
