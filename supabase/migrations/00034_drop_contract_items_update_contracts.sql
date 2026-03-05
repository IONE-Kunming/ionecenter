-- Drop contract_items table
DROP TABLE IF EXISTS contract_items;

-- Remove invoice_id column from contracts
ALTER TABLE contracts DROP COLUMN IF EXISTS invoice_id;

-- Add buyer_company_name and seller_company_name columns to contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS buyer_company_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS seller_company_name TEXT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
