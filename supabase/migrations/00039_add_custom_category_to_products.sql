-- Add custom_category column to products table for seller-defined free-text categories
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_category TEXT;
