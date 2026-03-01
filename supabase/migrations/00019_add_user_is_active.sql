-- Add is_active column to users table for account deactivation
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure all existing users are marked active
UPDATE users SET is_active = true WHERE is_active IS NULL;
