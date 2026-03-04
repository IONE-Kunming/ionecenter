-- Remove the unit column from contract_items table
ALTER TABLE contract_items DROP COLUMN IF EXISTS unit;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
