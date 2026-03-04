-- Create contract_items table
CREATE TABLE IF NOT EXISTS contract_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  item_code text,
  product_name text,
  description text,
  quantity integer DEFAULT 1,
  unit text,
  unit_price numeric DEFAULT 0,
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contract_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_items
CREATE POLICY "Sellers can view their contract items" ON contract_items FOR SELECT USING (auth.uid() = (SELECT seller_id FROM contracts WHERE id = contract_id));
CREATE POLICY "Buyers can view their contract items" ON contract_items FOR SELECT USING ((SELECT buyer_email FROM contracts WHERE id = contract_id) = (SELECT email FROM users WHERE id = auth.uid()));
CREATE POLICY "Sellers can insert contract items" ON contract_items FOR INSERT WITH CHECK (auth.uid() = (SELECT seller_id FROM contracts WHERE id = contract_id));
CREATE POLICY "Sellers can update contract items" ON contract_items FOR UPDATE USING (auth.uid() = (SELECT seller_id FROM contracts WHERE id = contract_id));
CREATE POLICY "Sellers can delete contract items" ON contract_items FOR DELETE USING (auth.uid() = (SELECT seller_id FROM contracts WHERE id = contract_id));

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
