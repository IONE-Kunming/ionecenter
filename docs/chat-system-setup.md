# Chat System Setup Guide — Supabase

This document explains how to set up the real-time chat system used in IONE Center, powered by **Supabase** (Postgres + Realtime).

---

## 1. Database Schema

The chat system uses two tables: **conversations** and **messages**.

### conversations

| Column             | Type        | Description                             |
|--------------------|-------------|-----------------------------------------|
| `id`               | UUID (PK)   | Auto-generated conversation ID          |
| `product_id`       | UUID (FK)   | Optional — links conversation to a product |
| `buyer_id`         | UUID (FK)   | The buyer in the conversation           |
| `seller_id`        | UUID (FK)   | The seller in the conversation          |
| `last_message`     | TEXT        | Preview of the most recent message      |
| `last_message_time`| TIMESTAMPTZ | Timestamp of the most recent message    |
| `created_at`       | TIMESTAMPTZ | When the conversation was created       |

**Unique constraint:** `(product_id, buyer_id, seller_id)` — prevents duplicate conversations per product/buyer/seller triple.

### messages

| Column             | Type        | Description                             |
|--------------------|-------------|-----------------------------------------|
| `id`               | UUID (PK)   | Auto-generated message ID               |
| `conversation_id`  | UUID (FK)   | References `conversations(id)`          |
| `sender_id`        | UUID (FK)   | References `users(id)` — who sent it    |
| `text`             | TEXT        | The message body (for text messages)    |
| `type`             | TEXT        | `'text'`, `'image'`, or `'pdf'`         |
| `file_url`         | TEXT        | URL to the attachment (images/PDFs)     |
| `file_name`        | TEXT        | Original filename of the attachment     |
| `created_at`       | TIMESTAMPTZ | Message timestamp                       |

---

## 2. SQL Migration

The tables are created in `supabase/migrations/00001_initial_schema.sql`. The relevant SQL:

```sql
-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, buyer_id, seller_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  text TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'pdf')),
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
```

---

## 3. Row-Level Security (RLS)

Both tables have RLS enabled. Policies ensure that only conversation participants can read or write:

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Only participants can read their conversations
CREATE POLICY "Participants can read conversations" ON conversations
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT clerk_id FROM users WHERE id = buyer_id OR id = seller_id
    )
  );

-- Only buyers can create conversations (initiate chat)
CREATE POLICY "Participants can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid()::text IN (
      SELECT clerk_id FROM users WHERE id = buyer_id
    )
  );

-- Only participants can read messages in their conversations
CREATE POLICY "Participants can read messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE
        buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
        OR seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    )
  );

-- Only participants can send messages
CREATE POLICY "Participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );
```

---

## 4. Real-Time Setup

Enable Supabase Realtime on both tables so messages appear instantly:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

In Supabase Dashboard:
1. Go to **Database → Replication**
2. Ensure `messages` and `conversations` tables are listed under the `supabase_realtime` publication
3. This enables `INSERT`, `UPDATE`, and `DELETE` events to be broadcast in real-time

---

## 5. Supabase Storage (Attachments)

For file attachments (images and PDFs), create a storage bucket:

1. Go to **Supabase Dashboard → Storage**
2. Create a new bucket called `chat-attachments`
3. Set it to **Public** (or use signed URLs for private access)
4. Add a storage policy:

```sql
-- Allow authenticated users to upload to chat-attachments
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.role() = 'authenticated'
);

-- Allow anyone to read chat attachments (public bucket)
CREATE POLICY "Public read chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');
```

---

## 6. Server Actions (Application Code)

The chat server actions are in `lib/actions/chat.ts`. Key functions:

### `getConversations()`
Returns all conversations for the current user (buyer or seller), with party details.

### `getOrCreateConversation(productId, otherUserId)`
Finds an existing conversation or creates a new one. Used when a buyer clicks "Chat with Seller" on a product page.

### `getMessages(conversationId)`
Fetches all messages in a conversation, ordered chronologically.

### `sendMessage(conversationId, text)`
Sends a text message and updates the `last_message` / `last_message_time` on the conversation.

---

## 7. Client-Side Real-Time Subscription

In the chat client component, subscribe to real-time updates:

```typescript
import { createClient } from "@/lib/supabase/client"

// Inside your chat component
useEffect(() => {
  const supabase = createClient()

  const channel = supabase
    .channel(`chat:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        // Add the new message to your local state
        setMessages((prev) => [...prev, payload.new as Message])
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [conversationId])
```

---

## 8. Sending Attachments

To send an image or PDF attachment:

1. **Upload the file** to the `chat-attachments` bucket:

```typescript
const { data, error } = await supabase.storage
  .from("chat-attachments")
  .upload(`${conversationId}/${Date.now()}-${file.name}`, file)
```

2. **Get the public URL**:

```typescript
const { data: urlData } = supabase.storage
  .from("chat-attachments")
  .getPublicUrl(data.path)
```

3. **Insert a message** with `type: 'image'` or `type: 'pdf'`:

```typescript
await supabase.from("messages").insert({
  conversation_id: conversationId,
  sender_id: currentUser.id,
  text: null,
  type: file.type.startsWith("image/") ? "image" : "pdf",
  file_url: urlData.publicUrl,
  file_name: file.name,
})
```

---

## 9. Environment Variables

Ensure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 10. Testing the Chat System

1. Create two test users (one buyer, one seller) via the Supabase seed data
2. Log in as the buyer and navigate to a product page
3. Click "Chat with Seller" — this creates a conversation
4. Send a message — it should appear in the conversation
5. Log in as the seller in another browser — the conversation and message should be visible
6. Send a reply — both sides should see messages in real-time

---

## Summary

| Component         | Technology         |
|-------------------|--------------------|
| Database          | Supabase (Postgres)|
| Real-time         | Supabase Realtime  |
| File storage      | Supabase Storage   |
| Auth integration  | Clerk + Supabase   |
| Server actions    | Next.js `use server`|
| Row-level security| Supabase RLS       |
