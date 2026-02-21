-- Development Seed Data for IONE Center

-- Test Users
INSERT INTO users (id, clerk_id, email, display_name, role, company, phone_number, preferred_language, city, country) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin_clerk_id', 'admin@ione.live', 'Admin User', 'admin', 'IONE Center', '+86-123-4567-8901', 'en', 'Kunming', 'China'),
  ('00000000-0000-0000-0000-000000000002', 'seller_clerk_id', 'seller@ione.live', 'Zhang Wei', 'seller', 'Kunming Aluminum Co.', '+86-987-6543-2101', 'zh', 'Kunming', 'China'),
  ('00000000-0000-0000-0000-000000000003', 'buyer_clerk_id', 'buyer@ione.live', 'John Smith', 'buyer', 'Smith Construction LLC', '+1-555-0123', 'en', 'New York', 'United States'),
  ('00000000-0000-0000-0000-000000000004', 'seller2_clerk_id', 'seller2@ione.live', 'Ahmed Hassan', 'seller', 'Gulf Aluminum Industries', '+971-50-1234567', 'ar', 'Dubai', 'UAE'),
  ('00000000-0000-0000-0000-000000000005', 'seller3_clerk_id', 'seller3@ione.live', 'Test Seller', 'seller', 'Seller Company', '+1234567892', 'en', 'Kunming', 'China'),
  ('00000000-0000-0000-0000-000000000006', 'buyer2_clerk_id', 'buyer2@ione.live', 'Test Buyer', 'buyer', 'Buyer Company', '+1234567891', 'en', 'Shanghai', 'China');

-- Test Products
INSERT INTO products (id, seller_id, name, model_number, main_category, category, subcategory, price_per_meter, description, stock, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Premium Window Profile', 'WP-6063-T5', 'Aluminum Profiles', 'Window & Door Profiles', NULL, 12.50, 'High-quality 6063-T5 aluminum window profile with thermal break technology.', 500, true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Curtain Wall Section', 'CW-100-A', 'Aluminum Profiles', 'Curtain Wall Profiles', NULL, 28.00, 'Structural curtain wall profile for commercial buildings.', 350, true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Industrial T-Slot Profile', 'TS-4040-V2', 'Aluminum Profiles', 'Industrial Profiles', NULL, 8.75, 'Versatile 40x40mm T-slot profile for industrial framing.', 1200, true),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Coated Aluminum Sheet 3mm', 'AS-3MM-PE', 'Aluminum Sheets', 'Coated Sheets', NULL, 45.00, 'PE coated aluminum sheet, 3mm thickness, various colors available.', 800, true),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'Tempered Glass Panel 10mm', 'TG-10-CLR', 'Glass Products', 'Tempered Glass', NULL, 65.00, 'Clear tempered safety glass, 10mm thickness, custom sizes.', 200, true),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Door Handle Set Chrome', 'DH-CHR-01', 'Hardware & Accessories', 'Handles & Locks', NULL, 35.00, 'Premium chrome-plated door handle set with lock mechanism.', 450, true),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000005', 'Aluminum Gate', 'AG-EXT-01', 'Hardware & Accessories', 'Exterior Gates', NULL, 299.99, 'High quality aluminum gate for exterior use.', 50, true),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000005', 'Steel Fence', 'SF-RES-01', 'Steel Products', 'Fencing', NULL, 149.99, 'Durable steel fencing for residential use.', 100, true),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000005', 'Glass Balustrade', 'GB-MOD-01', 'Glass Products', 'Balustrades', NULL, 499.99, 'Modern glass balustrade system.', 25, true);

-- Test Orders
INSERT INTO orders (id, buyer_id, seller_id, subtotal, tax, tax_rate, total, deposit_amount, deposit_percentage, remaining_balance, payment_method, payment_status, status) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 250.00, 25.00, 0.100, 275.00, 82.50, 30, 192.50, 'bank_transfer', 'deposit_paid', 'processing'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 1300.00, 130.00, 0.100, 1430.00, 1430.00, 100, 0.00, 'card', 'paid', 'delivered');

-- Test Order Items
INSERT INTO order_items (order_id, product_id, name, model_number, category, quantity, price, price_per_meter) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Premium Window Profile', 'WP-6063-T5', 'Window & Door Profiles', 20, 12.50, 12.50),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Coated Aluminum Sheet 3mm', 'AS-3MM-PE', 'Coated Sheets', 20, 45.00, 45.00),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'Tempered Glass Panel 10mm', 'TG-10-CLR', 'Tempered Glass', 4, 65.00, 65.00);

-- Test Cart
INSERT INTO carts (user_id, items) VALUES
  ('00000000-0000-0000-0000-000000000003', '[{"product_id": "10000000-0000-0000-0000-000000000003", "quantity": 50, "price": 8.75}]');

-- Test Branches
INSERT INTO branches (seller_id, name, address, city, state, country, phone, email) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Kunming Main Factory', '88 Dianchi Road', 'Kunming', 'Yunnan', 'China', '+86-871-1234567', 'factory@kunmingalum.cn'),
  ('00000000-0000-0000-0000-000000000002', 'Shanghai Office', '100 Nanjing West Road', 'Shanghai', 'Shanghai', 'China', '+86-21-7654321', 'shanghai@kunmingalum.cn');

-- Test Notifications
INSERT INTO notifications (user_id, type, title, message, read) VALUES
  ('00000000-0000-0000-0000-000000000003', 'order', 'Order Confirmed', 'Your order #20000000-0000-0000-0000-000000000001 has been confirmed and is being processed.', false),
  ('00000000-0000-0000-0000-000000000003', 'payment', 'Payment Received', 'Your deposit payment of $82.50 has been received.', true),
  ('00000000-0000-0000-0000-000000000002', 'order', 'New Order Received', 'You have received a new order from Smith Construction LLC.', false);

-- Test Invoice
INSERT INTO invoices (id, invoice_number, order_id, buyer_id, seller_id, subtotal, tax, total, deposit_paid, remaining_balance, payment_terms, status, due_date) VALUES
  ('30000000-0000-0000-0000-000000000001', 'INV-2025-00001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 250.00, 25.00, 275.00, 82.50, 192.50, 'Net 30', 'issued', NOW() + INTERVAL '30 days');

-- Update invoice counter
UPDATE invoice_counter SET last_number = 1, year = EXTRACT(YEAR FROM NOW());
