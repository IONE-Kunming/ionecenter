-- Add length and width columns to offline_invoice_items for customized products
ALTER TABLE offline_invoice_items ADD COLUMN IF NOT EXISTS length NUMERIC;
ALTER TABLE offline_invoice_items ADD COLUMN IF NOT EXISTS width NUMERIC;
