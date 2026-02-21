-- IONE AlumaTech - Complete Database Schema
-- Migration: 00001_initial_schema

-- ============================================================
-- TABLES
-- ============================================================

-- Users (synced from Clerk via webhooks)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'seller', 'buyer')),
  company TEXT,
  phone_number TEXT,
  preferred_language TEXT DEFAULT 'en',
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  swift_code TEXT,
  bank_branch TEXT,
  currency TEXT DEFAULT 'USD',
  payment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_number TEXT NOT NULL,
  main_category TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  price_per_meter DECIMAL(10,2) NOT NULL,
  description TEXT,
  stock INTEGER DEFAULT 0,
  stock_status TEXT DEFAULT 'available',
  image_url TEXT,
  additional_images TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(4,3) DEFAULT 0.100,
  total DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  deposit_percentage INTEGER DEFAULT 0,
  remaining_balance DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'deposit_paid', 'paid')),
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','pending','processing','shipped','delivered','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  model_number TEXT,
  category TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  price_per_meter DECIMAL(10,2),
  image_url TEXT
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  remaining_balance DECIMAL(10,2) NOT NULL,
  payment_terms TEXT,
  payment_instructions JSONB,
  terms_and_conditions TEXT[],
  status TEXT DEFAULT 'issued'
    CHECK (status IN ('issued', 'paid', 'overdue', 'cancelled')),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT,
  price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- Cart
CREATE TABLE carts (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  items JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Conversations
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

-- Chat Messages
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

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  sender_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branches
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Counter (for sequential numbering)
CREATE TABLE invoice_counter (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_number INTEGER DEFAULT 0,
  year INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial counter
INSERT INTO invoice_counter (id, year) VALUES (1, EXTRACT(YEAR FROM NOW()));

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_products_seller ON products(seller_id, created_at DESC);
CREATE INDEX idx_products_category ON products(main_category, category);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_orders_buyer ON orders(buyer_id, created_at DESC);
CREATE INDEX idx_orders_seller ON orders(seller_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX idx_invoices_buyer ON invoices(buyer_id, created_at DESC);
CREATE INDEX idx_invoices_seller ON invoices(seller_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_branches_seller ON branches(seller_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_counter ENABLE ROW LEVEL SECURITY;

-- Users: read own + admin reads all; write own only
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = clerk_id);
CREATE POLICY "Service role can manage users" ON users FOR ALL USING (auth.role() = 'service_role');

-- Products: public read; seller writes own
CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (true);
CREATE POLICY "Sellers can manage own products" ON products FOR ALL USING (
  seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);

-- Orders: buyer/seller/admin can read their own
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (
  buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Buyers can create orders" ON orders FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Order participants can update" ON orders FOR UPDATE USING (
  buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
);

-- Order Items: same as orders
CREATE POLICY "Users can read order items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE
    buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
  )
);
CREATE POLICY "Buyers can create order items" ON order_items FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM orders WHERE buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text))
);

-- Invoices: buyer/seller/admin
CREATE POLICY "Users can read own invoices" ON invoices FOR SELECT USING (
  buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Service role can manage invoices" ON invoices FOR ALL USING (auth.role() = 'service_role');

-- Invoice Items
CREATE POLICY "Users can read invoice items" ON invoice_items FOR SELECT USING (
  invoice_id IN (SELECT id FROM invoices WHERE
    buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
  )
);
CREATE POLICY "Service role can manage invoice items" ON invoice_items FOR ALL USING (auth.role() = 'service_role');

-- Carts: own only
CREATE POLICY "Users can manage own cart" ON carts FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);

-- Conversations: participants only
CREATE POLICY "Participants can read conversations" ON conversations FOR SELECT USING (
  buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Participants can create conversations" ON conversations FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);

-- Messages: conversation participants
CREATE POLICY "Participants can read messages" ON messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM conversations WHERE
    buyer_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  )
);
CREATE POLICY "Participants can send messages" ON messages FOR INSERT WITH CHECK (
  sender_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);

-- Notifications: own only
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Service role can manage notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');

-- Branches: public read; seller writes own
CREATE POLICY "Branches are publicly readable" ON branches FOR SELECT USING (true);
CREATE POLICY "Sellers can manage own branches" ON branches FOR ALL USING (
  seller_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);

-- Support tickets: own + admin
CREATE POLICY "Users can read own tickets" ON support_tickets FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);

-- Invoice counter: authenticated read
CREATE POLICY "Authenticated users can read counter" ON invoice_counter FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service role can manage counter" ON invoice_counter FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate invoice number (thread-safe)
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_number INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());
  
  UPDATE invoice_counter
  SET last_number = CASE
      WHEN year = current_year THEN last_number + 1
      ELSE 1
    END,
    year = current_year,
    updated_at = NOW()
  WHERE id = 1
  RETURNING last_number INTO next_number;
  
  RETURN 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
