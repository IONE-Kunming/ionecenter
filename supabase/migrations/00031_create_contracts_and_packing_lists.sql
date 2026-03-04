-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number text UNIQUE,
  seller_id uuid REFERENCES users(id),
  buyer_code text,
  buyer_name text,
  buyer_email text,
  invoice_id uuid REFERENCES offline_invoices(id) ON DELETE SET NULL,
  terms text,
  seller_signature text,
  buyer_signature text,
  status text DEFAULT 'draft',
  expiry_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create packing_lists table
CREATE TABLE IF NOT EXISTS packing_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  packing_list_number text UNIQUE,
  seller_id uuid REFERENCES users(id),
  buyer_code text,
  buyer_name text,
  buyer_email text,
  invoice_id uuid REFERENCES offline_invoices(id) ON DELETE SET NULL,
  total_packages integer DEFAULT 0,
  total_net_weight numeric DEFAULT 0,
  total_gross_weight numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create packing_list_items table
CREATE TABLE IF NOT EXISTS packing_list_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  packing_list_id uuid REFERENCES packing_lists(id) ON DELETE CASCADE,
  item_code text,
  product_name text,
  quantity integer DEFAULT 1,
  unit text,
  dimensions text,
  net_weight numeric DEFAULT 0,
  gross_weight numeric DEFAULT 0,
  carton_number text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contracts
CREATE POLICY "Sellers can view their own contracts" ON contracts FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can create contracts" ON contracts FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own contracts" ON contracts FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own contracts" ON contracts FOR DELETE USING (auth.uid() = seller_id);

-- RLS Policies for packing_lists
CREATE POLICY "Sellers can view their own packing lists" ON packing_lists FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can create packing lists" ON packing_lists FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own packing lists" ON packing_lists FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own packing lists" ON packing_lists FOR DELETE USING (auth.uid() = seller_id);

-- RLS Policies for packing_list_items
CREATE POLICY "Sellers can view their packing list items" ON packing_list_items FOR SELECT USING (auth.uid() = (SELECT seller_id FROM packing_lists WHERE id = packing_list_id));
CREATE POLICY "Sellers can insert packing list items" ON packing_list_items FOR INSERT WITH CHECK (auth.uid() = (SELECT seller_id FROM packing_lists WHERE id = packing_list_id));
CREATE POLICY "Sellers can delete packing list items" ON packing_list_items FOR DELETE USING (auth.uid() = (SELECT seller_id FROM packing_lists WHERE id = packing_list_id));
CREATE POLICY "Sellers can update packing list items" ON packing_list_items FOR UPDATE USING (auth.uid() = (SELECT seller_id FROM packing_lists WHERE id = packing_list_id));

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
