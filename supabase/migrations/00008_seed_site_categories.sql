-- Seed site_categories with the existing hardcoded category hierarchy.
-- Uses a DO block to insert main categories first, then subcategories referencing them.

DO $$
DECLARE
  cat_id UUID;
  sort_idx INT := 0;
  sub_sort INT;
BEGIN
  -- Only seed if table is empty
  IF EXISTS (SELECT 1 FROM site_categories LIMIT 1) THEN
    RETURN;
  END IF;

  -- Construction
  INSERT INTO site_categories (name, sort_order) VALUES ('Construction', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Exterior Gates', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fences', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Balustrades', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Barrier Systems', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fencing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Handrails', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Gates', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Railings', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Screens', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Partitions', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Aluminum', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Steel', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Glass', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Concrete', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Tools', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Hardware', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Electrical', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Plumbing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Paint', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Wood', cat_id, sub_sort);

  -- Apparel & Accessories
  INSERT INTO site_categories (name, sort_order) VALUES ('Apparel & Accessories', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Jewelry', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Watches & Eyewear', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Bags & Wallets', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Scarves & Shawls', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Belts', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Headwear', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Gloves', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Footwear Accessories', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Ties & Bow Ties', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Men''s Clothing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Women''s Clothing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Children''s Clothing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Activewear', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Formal Wear', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Traditional Wear', cat_id, sub_sort);

  -- Automobiles & Motorcycles
  INSERT INTO site_categories (name, sort_order) VALUES ('Automobiles & Motorcycles', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Engine Components', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Transmission & Drivetrain', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Suspension & Steering', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Brake Systems', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Electrical & Ignition', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Exhaust & Emissions', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cooling Systems', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fuel Systems', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Body Parts & Accessories', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Wheels & Tires', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Lighting & Lamps', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Interior Accessories', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Motorcycle Parts', cat_id, sub_sort);

  -- Business Services
  INSERT INTO site_categories (name, sort_order) VALUES ('Business Services', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Consulting & Advisory', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('IT Consulting', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Financial Advisory', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('HR Consulting', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Legal Services', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Accounting & Auditing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Marketing Services', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Design & Engineering', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cloud Computing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cybersecurity', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Recruitment & Staffing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Business Process Outsourcing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Data Analytics', cat_id, sub_sort);

  -- Chemicals
  INSERT INTO site_categories (name, sort_order) VALUES ('Chemicals', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Industrial Chemicals', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Organic Chemicals', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Inorganic Chemicals', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Petrochemicals', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Agricultural Chemicals', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Specialty Chemicals', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Adhesives & Sealants', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Paints & Coatings', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cleaning Chemicals', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laboratory Chemicals', cat_id, sub_sort);

  -- Computer Products & Office Electronics
  INSERT INTO site_categories (name, sort_order) VALUES ('Computer Products & Office Electronics', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Desktop Computers', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laptops', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Tablets', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Computer Accessories', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Monitors', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Printers & Scanners', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Keyboards & Mice', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('External Storage', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Networking Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Office Phones', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Projectors', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Office Furniture', cat_id, sub_sort);

  -- Consumer Electronics
  INSERT INTO site_categories (name, sort_order) VALUES ('Consumer Electronics', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Smartphones', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Audio Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Video Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Gaming Devices', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Smart Home Devices', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Wearables', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cameras', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Headphones & Earbuds', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Speakers', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('TVs', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Streaming Devices', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('VR Headsets', cat_id, sub_sort);

  -- Electrical Equipment & Supplies
  INSERT INTO site_categories (name, sort_order) VALUES ('Electrical Equipment & Supplies', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Wiring & Cables', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Circuit Breakers', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Switches & Sockets', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Transformers', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Motors & Generators', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Power Distribution', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Batteries', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Solar Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Electrical Tools', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Safety Equipment', cat_id, sub_sort);

  -- Electronics Components & Supplies
  INSERT INTO site_categories (name, sort_order) VALUES ('Electronics Components & Supplies', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Semiconductors', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Integrated Circuits', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Capacitors', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Resistors', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Connectors', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sensors', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('PCB Boards', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Displays', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Modules', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Passive Components', cat_id, sub_sort);

  -- Energy
  INSERT INTO site_categories (name, sort_order) VALUES ('Energy', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Solar Energy', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Wind Energy', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Hydroelectric', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Generators', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Power Plants', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Energy Storage', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fuel Cells', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Batteries', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Renewable Energy', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Energy Management', cat_id, sub_sort);

  -- Environment
  INSERT INTO site_categories (name, sort_order) VALUES ('Environment', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Water Treatment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Air Purification', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Waste Management', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Recycling Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Pollution Control', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Environmental Testing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Renewable Resources', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Conservation Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Eco-friendly Products', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sustainability Solutions', cat_id, sub_sort);

  -- Food & Beverage
  INSERT INTO site_categories (name, sort_order) VALUES ('Food & Beverage', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fresh Food', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Processed Food', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Beverages', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Snacks & Confectionery', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Dairy Products', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Meat & Seafood', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Bakery Products', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Food Ingredients', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Food Processing Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Packaging', cat_id, sub_sort);

  -- Furniture
  INSERT INTO site_categories (name, sort_order) VALUES ('Furniture', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Living Room Furniture', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Bedroom Furniture', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Dining Room Furniture', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Office Furniture', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Outdoor Furniture', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Kitchen Furniture', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Children Furniture', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Commercial Furniture', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Antique Furniture', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Custom Furniture', cat_id, sub_sort);

  -- Gifts, Sports & Toys
  INSERT INTO site_categories (name, sort_order) VALUES ('Gifts, Sports & Toys', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Action Figures', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Educational Toys', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Outdoor Play Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sports Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fitness Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Board Games', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Puzzles', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Gift Items', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Party Supplies', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Crafts & Hobbies', cat_id, sub_sort);

  -- Hardware
  INSERT INTO site_categories (name, sort_order) VALUES ('Hardware', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Hand Tools', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Power Tools', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fasteners', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Locks & Keys', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Hinges', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Door Hardware', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Window Hardware', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cabinet Hardware', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Building Hardware', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Tool Storage', cat_id, sub_sort);

  -- Health & Beauty
  INSERT INTO site_categories (name, sort_order) VALUES ('Health & Beauty', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Skincare', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Hair Care', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Makeup & Cosmetics', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fragrances', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Personal Care', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Health Supplements', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Medical Devices', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fitness & Wellness', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Oral Care', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Beauty Tools', cat_id, sub_sort);

  -- Home & Garden
  INSERT INTO site_categories (name, sort_order) VALUES ('Home & Garden', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Garden Furniture', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Outdoor Decor', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Gardening Tools', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Plants & Seeds', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Lawn Care', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Grills & Outdoor Cooking', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fire Pits', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sheds & Storage', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Pools & Spas', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Greenhouses', cat_id, sub_sort);

  -- Home Appliances
  INSERT INTO site_categories (name, sort_order) VALUES ('Home Appliances', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Kitchen Appliances', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laundry Appliances', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Refrigerators & Freezers', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Vacuum Cleaners', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Air Conditioners', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Heaters', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Water Heaters', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Small Appliances', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Built-in Appliances', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Smart Appliances', cat_id, sub_sort);

  -- Industry Laser Equipment
  INSERT INTO site_categories (name, sort_order) VALUES ('Industry Laser Equipment', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Cutting Machines', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Engraving Machines', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Welding Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Marking Systems', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Measuring Tools', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('CO2 Lasers', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fiber Lasers', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Components', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Safety Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Accessories', cat_id, sub_sort);

  -- Lights & Lighting
  INSERT INTO site_categories (name, sort_order) VALUES ('Lights & Lighting', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('LED Lights', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Indoor Lighting', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Outdoor Lighting', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Commercial Lighting', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Decorative Lighting', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Street Lights', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Industrial Lighting', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Emergency Lighting', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Smart Lighting', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Lighting Accessories', cat_id, sub_sort);

  -- Luggage, Bags & Cases
  INSERT INTO site_categories (name, sort_order) VALUES ('Luggage, Bags & Cases', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Suitcases', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Travel Bags', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Backpacks', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laptop Bags', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Camera Cases', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Tool Cases', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cosmetic Cases', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sports Bags', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Briefcases', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Protective Cases', cat_id, sub_sort);

  -- Machinery
  INSERT INTO site_categories (name, sort_order) VALUES ('Machinery', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Construction Machinery', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Mining Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Agricultural Machinery', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Manufacturing Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Material Handling', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Packaging Machinery', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Textile Machinery', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Food Processing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('CNC Machines', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Industrial Robots', cat_id, sub_sort);

  -- Measurement & Analysis Instruments
  INSERT INTO site_categories (name, sort_order) VALUES ('Measurement & Analysis Instruments', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Testing Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laboratory Instruments', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Analytical Instruments', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Flow Meters', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Temperature Sensors', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Pressure Gauges', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Precision Instruments', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Surveying Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Quality Control Tools', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Inspection Devices', cat_id, sub_sort);

  -- Metallurgy, Mineral & Energy
  INSERT INTO site_categories (name, sort_order) VALUES ('Metallurgy, Mineral & Energy', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Metal Processing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Mineral Processing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Mining Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Smelting Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Casting Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Rolling Mills', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Ore Processing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Metal Fabrication', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Metallurgy Tools', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Refining Equipment', cat_id, sub_sort);

  -- Packaging & Printing
  INSERT INTO site_categories (name, sort_order) VALUES ('Packaging & Printing', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Packaging Materials', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Printing Machinery', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Labels & Tags', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Boxes & Containers', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Flexible Packaging', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Printing Supplies', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Packaging Design', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Protective Packaging', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Industrial Printing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Packaging Equipment', cat_id, sub_sort);

  -- Security & Protection
  INSERT INTO site_categories (name, sort_order) VALUES ('Security & Protection', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Security Cameras', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Alarm Systems', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Access Control', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fire Protection', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Personal Protective Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Security Doors & Gates', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Surveillance Systems', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Safety Equipment', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Security Services', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cybersecurity Products', cat_id, sub_sort);

  -- Shoes & Accessories
  INSERT INTO site_categories (name, sort_order) VALUES ('Shoes & Accessories', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Men''s Shoes', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Women''s Shoes', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Children''s Shoes', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Athletic Shoes', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Formal Shoes', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Casual Shoes', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Boots', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sandals', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Shoe Care', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Shoe Accessories', cat_id, sub_sort);

  -- Textiles & Leather Products
  INSERT INTO site_categories (name, sort_order) VALUES ('Textiles & Leather Products', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fabrics', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Yarn', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Textile Materials', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Home Textiles', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Technical Textiles', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Leather Products', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Synthetic Leather', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Textile Machinery', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Dyeing & Finishing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Textile Accessories', cat_id, sub_sort);

  -- Transportation
  INSERT INTO site_categories (name, sort_order) VALUES ('Transportation', sort_idx) RETURNING id INTO cat_id; sort_idx := sort_idx + 1; sub_sort := 0;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Logistics Services', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Freight Services', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Shipping & Cargo', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Warehousing', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Vehicle Transport', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Air Freight', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sea Freight', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Land Transport', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Express Delivery', cat_id, sub_sort); sub_sort := sub_sort + 1;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Supply Chain Solutions', cat_id, sub_sort);

END $$;
