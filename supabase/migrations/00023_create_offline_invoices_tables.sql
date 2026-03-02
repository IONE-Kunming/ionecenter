-- Create offline_invoices table (for seller-created invoices)
CREATE TABLE IF NOT EXISTS offline_invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text UNIQUE,
  seller_id uuid REFERENCES users(id),
  buyer_code text,
  buyer_name text,
  buyer_email text,
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  amount_due numeric DEFAULT 0,
  status text DEFAULT 'unpaid',
  created_at timestamptz DEFAULT now()
);

-- Create offline_invoice_items table
CREATE TABLE IF NOT EXISTS offline_invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES offline_invoices(id) ON DELETE CASCADE,
  item_code text,
  product_name text,
  description text,
  unit_price numeric DEFAULT 0,
  quantity integer DEFAULT 1,
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE offline_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offline_invoices
CREATE POLICY "Sellers can view their own offline invoices" ON offline_invoices FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can create offline invoices" ON offline_invoices FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own offline invoices" ON offline_invoices FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own offline invoices" ON offline_invoices FOR DELETE USING (auth.uid() = seller_id);

-- RLS Policies for offline_invoice_items
CREATE POLICY "Sellers can view their offline invoice items" ON offline_invoice_items FOR SELECT USING (auth.uid() = (SELECT seller_id FROM offline_invoices WHERE id = invoice_id));
CREATE POLICY "Sellers can insert offline invoice items" ON offline_invoice_items FOR INSERT WITH CHECK (auth.uid() = (SELECT seller_id FROM offline_invoices WHERE id = invoice_id));
CREATE POLICY "Sellers can delete offline invoice items" ON offline_invoice_items FOR DELETE USING (auth.uid() = (SELECT seller_id FROM offline_invoices WHERE id = invoice_id));
