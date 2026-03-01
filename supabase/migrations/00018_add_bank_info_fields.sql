-- Add extended bank information fields to users table for seller invoice bank details
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_region TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_address TEXT;
