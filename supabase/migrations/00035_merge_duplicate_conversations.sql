-- Migration: 00035_merge_duplicate_conversations
-- Merges duplicate conversations between the same user pairs into one.
-- Keeps the conversation with the most recent message and moves all messages to it.

-- Step 1: Create a temp table identifying the "keeper" conversation per user pair.
-- Uses LEAST/GREATEST to normalize user order so (A,B) and (B,A) are treated the same.
CREATE TEMP TABLE conversation_keepers AS
WITH user_pairs AS (
  SELECT
    id,
    LEAST(buyer_id, seller_id) AS user_a,
    GREATEST(buyer_id, seller_id) AS user_b,
    last_message_at,
    ROW_NUMBER() OVER (
      PARTITION BY LEAST(buyer_id, seller_id), GREATEST(buyer_id, seller_id)
      ORDER BY last_message_at DESC NULLS LAST
    ) AS rn
  FROM conversations
)
SELECT id AS keeper_id, user_a, user_b
FROM user_pairs
WHERE rn = 1;

-- Step 2: Move all messages from duplicate conversations to the keeper
UPDATE messages m
SET conversation_id = ck.keeper_id
FROM conversations c
JOIN conversation_keepers ck
  ON LEAST(c.buyer_id, c.seller_id) = ck.user_a
  AND GREATEST(c.buyer_id, c.seller_id) = ck.user_b
WHERE m.conversation_id = c.id
  AND c.id != ck.keeper_id;

-- Step 3: Delete the duplicate conversations (non-keepers)
DELETE FROM conversations c
USING conversation_keepers ck
WHERE LEAST(c.buyer_id, c.seller_id) = ck.user_a
  AND GREATEST(c.buyer_id, c.seller_id) = ck.user_b
  AND c.id != ck.keeper_id;

-- Step 4: Update last_message and last_message_at on keepers from actual messages
UPDATE conversations c
SET
  last_message = CASE
    WHEN latest.type = 'image' THEN '📷 Image'
    WHEN latest.type = 'pdf' THEN '📄 PDF'
    ELSE latest.text
  END,
  last_message_at = latest.created_at
FROM (
  SELECT DISTINCT ON (conversation_id)
    conversation_id,
    text,
    type,
    created_at
  FROM messages
  ORDER BY conversation_id, created_at DESC
) latest
WHERE c.id = latest.conversation_id;

-- Step 5: Drop the old unique constraint that included listing_id
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS unique_conversation;

-- Step 6: Add a unique index on normalized user pair to prevent future duplicates
-- LEAST/GREATEST ensures (A,B) and (B,A) are treated as the same pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_pair_conversation
  ON conversations (LEAST(buyer_id, seller_id), GREATEST(buyer_id, seller_id));

-- Cleanup
DROP TABLE IF EXISTS conversation_keepers;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
