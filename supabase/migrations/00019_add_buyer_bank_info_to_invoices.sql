-- Add optional buyer bank information (TT) fields to invoices table
-- These are filled by the seller when creating offline invoices

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_bank_account_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_bank_account_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_bank_swift_code TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_bank_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_bank_region TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_bank_code TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_bank_branch_code TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_bank_address TEXT;
