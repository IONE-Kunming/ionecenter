-- Add offline invoice support
-- New columns for invoices created manually by sellers (without an existing order/buyer account)

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_email TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT FALSE;

-- Add description column to invoice_items for product descriptions
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS description TEXT;
