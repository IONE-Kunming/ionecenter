-- Migration: 00002_update_conversations_schema
-- Updates conversations table to use listing_id and last_message_at

-- Rename product_id to listing_id
ALTER TABLE conversations RENAME COLUMN product_id TO listing_id;

-- Drop the old unique constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_product_id_buyer_id_seller_id_key;

-- Add the new unique constraint
ALTER TABLE conversations ADD CONSTRAINT unique_conversation UNIQUE (buyer_id, seller_id, listing_id);

-- Rename last_message_time to last_message_at
ALTER TABLE conversations RENAME COLUMN last_message_time TO last_message_at;

-- Add updated_at column if it doesn't exist
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add trigger to auto-update updated_at on conversations
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Drop old FK constraint on listing_id (product_id had a FK to products)
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_product_id_fkey;

-- Add new indexes
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations USING btree (updated_at DESC);
