-- Add user_code column to users table
-- Used as a unique identifier for buyers (B###) and sellers (S###)

ALTER TABLE users ADD COLUMN user_code TEXT UNIQUE;
