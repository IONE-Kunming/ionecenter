-- Add show_category_numbers preference for buyers
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_category_numbers BOOLEAN DEFAULT true;
