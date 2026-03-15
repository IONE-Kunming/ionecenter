-- Add is_company_account flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_company_account BOOLEAN NOT NULL DEFAULT false;
