-- Seed site_categories from hardcoded category data (only if table is empty)
-- This ensures a smooth transition from hardcoded to dynamic categories

DO $$
DECLARE
  cat_count INT;
  main_id UUID;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM site_categories;
  IF cat_count > 0 THEN
    RAISE NOTICE 'site_categories already has data — skipping seed';
    RETURN;
  END IF;

  -- Construction
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Construction', NULL, 0)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Exterior Gates', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fences', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Balustrades', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Barrier Systems', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fencing', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Handrails', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Gates', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Railings', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Screens', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Partitions', main_id, 9);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Aluminum', main_id, 10);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Steel', main_id, 11);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Glass', main_id, 12);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Concrete', main_id, 13);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Tools', main_id, 14);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Equipment', main_id, 15);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Hardware', main_id, 16);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Electrical', main_id, 17);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Plumbing', main_id, 18);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Paint', main_id, 19);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Wood', main_id, 20);

  -- Apparel & Accessories
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Apparel & Accessories', NULL, 1)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Jewelry', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Watches & Eyewear', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Bags & Wallets', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Scarves & Shawls', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Belts', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Headwear', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Gloves', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Footwear Accessories', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Ties & Bow Ties', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Men''s Clothing', main_id, 9);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Women''s Clothing', main_id, 10);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Children''s Clothing', main_id, 11);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Activewear', main_id, 12);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Formal Wear', main_id, 13);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Traditional Wear', main_id, 14);

  -- Automobiles & Motorcycles
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Automobiles & Motorcycles', NULL, 2)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Engine Components', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Transmission & Drivetrain', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Suspension & Steering', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Brake Systems', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Electrical & Ignition', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Exhaust & Emissions', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cooling Systems', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fuel Systems', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Body Parts & Accessories', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Wheels & Tires', main_id, 9);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Lighting & Lamps', main_id, 10);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Interior Accessories', main_id, 11);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Motorcycle Parts', main_id, 12);

  -- Business Services
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Business Services', NULL, 3)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Consulting & Advisory', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('IT Consulting', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Financial Advisory', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('HR Consulting', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Legal Services', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Accounting & Auditing', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Marketing Services', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Design & Engineering', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cloud Computing', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cybersecurity', main_id, 9);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Recruitment & Staffing', main_id, 10);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Business Process Outsourcing', main_id, 11);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Data Analytics', main_id, 12);

  -- Chemicals
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Chemicals', NULL, 4)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Industrial Chemicals', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Organic Chemicals', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Inorganic Chemicals', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Petrochemicals', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Agricultural Chemicals', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Specialty Chemicals', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Adhesives & Sealants', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Paints & Coatings', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cleaning Chemicals', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laboratory Chemicals', main_id, 9);

  -- Computer Products & Office Electronics
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Computer Products & Office Electronics', NULL, 5)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Desktop Computers', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laptops', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Tablets', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Computer Accessories', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Monitors', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Printers & Scanners', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Keyboards & Mice', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('External Storage', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Networking Equipment', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Office Phones', main_id, 9);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Projectors', main_id, 10);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Office Furniture', main_id, 11);

  -- Consumer Electronics
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Consumer Electronics', NULL, 6)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Smartphones', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Audio Equipment', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Video Equipment', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Gaming Devices', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Smart Home Devices', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Wearables', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cameras', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Headphones & Earbuds', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Speakers', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('TVs', main_id, 9);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Streaming Devices', main_id, 10);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('VR Headsets', main_id, 11);

  -- Electrical Equipment & Supplies
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Electrical Equipment & Supplies', NULL, 7)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Wiring & Cables', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Circuit Breakers', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Switches & Sockets', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Transformers', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Motors & Generators', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Power Distribution', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Batteries', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Solar Equipment', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Electrical Tools', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Safety Equipment', main_id, 9);

  -- Electronics Components & Supplies
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Electronics Components & Supplies', NULL, 8)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Semiconductors', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Integrated Circuits', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Capacitors', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Resistors', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Connectors', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sensors', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('PCB Boards', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Displays', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Modules', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Passive Components', main_id, 9);

  -- Energy
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Energy', NULL, 9)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Solar Energy', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Wind Energy', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Hydroelectric', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Generators', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Power Plants', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Energy Storage', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fuel Cells', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Batteries', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Renewable Energy', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Energy Management', main_id, 9);

  -- Environment
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Environment', NULL, 10)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Water Treatment', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Air Purification', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Waste Management', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Recycling Equipment', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Pollution Control', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Environmental Testing', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Renewable Resources', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Conservation Equipment', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Eco-friendly Products', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sustainability Solutions', main_id, 9);

  -- Food & Beverage
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Food & Beverage', NULL, 11)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fresh Food', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Processed Food', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Beverages', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Snacks & Confectionery', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Dairy Products', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Meat & Seafood', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Bakery Products', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Food Ingredients', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Food Processing Equipment', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Packaging', main_id, 9);

  -- Furniture
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Furniture', NULL, 12)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Living Room Furniture', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Bedroom Furniture', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Dining Room Furniture', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Office Furniture', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Outdoor Furniture', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Kitchen Furniture', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Children Furniture', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Commercial Furniture', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Antique Furniture', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Custom Furniture', main_id, 9);

  -- Gifts, Sports & Toys
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Gifts, Sports & Toys', NULL, 13)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Action Figures', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Educational Toys', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Outdoor Play Equipment', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sports Equipment', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fitness Equipment', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Board Games', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Puzzles', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Gift Items', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Party Supplies', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Crafts & Hobbies', main_id, 9);

  -- Hardware
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Hardware', NULL, 14)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Hand Tools', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Power Tools', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fasteners', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Locks & Keys', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Hinges', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Door Hardware', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Window Hardware', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cabinet Hardware', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Building Hardware', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Tool Storage', main_id, 9);

  -- Health & Beauty
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Health & Beauty', NULL, 15)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Skincare', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Hair Care', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Makeup & Cosmetics', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fragrances', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Personal Care', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Health Supplements', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Medical Devices', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fitness & Wellness', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Oral Care', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Beauty Tools', main_id, 9);

  -- Home & Garden
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Home & Garden', NULL, 16)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Garden Furniture', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Outdoor Decor', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Gardening Tools', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Plants & Seeds', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Lawn Care', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Grills & Outdoor Cooking', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fire Pits', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sheds & Storage', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Pools & Spas', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Greenhouses', main_id, 9);

  -- Home Appliances
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Home Appliances', NULL, 17)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Kitchen Appliances', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laundry Appliances', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Refrigerators & Freezers', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Vacuum Cleaners', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Air Conditioners', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Heaters', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Water Heaters', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Small Appliances', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Built-in Appliances', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Smart Appliances', main_id, 9);

  -- Industry Laser Equipment
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Industry Laser Equipment', NULL, 18)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Cutting Machines', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Engraving Machines', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Welding Equipment', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Marking Systems', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Measuring Tools', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('CO2 Lasers', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fiber Lasers', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Components', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Safety Equipment', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laser Accessories', main_id, 9);

  -- Lights & Lighting
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Lights & Lighting', NULL, 19)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('LED Lights', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Indoor Lighting', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Outdoor Lighting', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Commercial Lighting', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Decorative Lighting', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Street Lights', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Industrial Lighting', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Emergency Lighting', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Smart Lighting', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Lighting Accessories', main_id, 9);

  -- Luggage, Bags & Cases
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Luggage, Bags & Cases', NULL, 20)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Suitcases', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Travel Bags', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Backpacks', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laptop Bags', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Camera Cases', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Tool Cases', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cosmetic Cases', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sports Bags', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Briefcases', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Protective Cases', main_id, 9);

  -- Machinery
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Machinery', NULL, 21)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Construction Machinery', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Mining Equipment', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Agricultural Machinery', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Manufacturing Equipment', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Material Handling', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Packaging Machinery', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Textile Machinery', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Food Processing', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('CNC Machines', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Industrial Robots', main_id, 9);

  -- Measurement & Analysis Instruments
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Measurement & Analysis Instruments', NULL, 22)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Testing Equipment', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Laboratory Instruments', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Analytical Instruments', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Flow Meters', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Temperature Sensors', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Pressure Gauges', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Precision Instruments', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Surveying Equipment', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Quality Control Tools', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Inspection Devices', main_id, 9);

  -- Metallurgy, Mineral & Energy
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Metallurgy, Mineral & Energy', NULL, 23)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Metal Processing', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Mineral Processing', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Mining Equipment', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Smelting Equipment', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Casting Equipment', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Rolling Mills', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Ore Processing', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Metal Fabrication', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Metallurgy Tools', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Refining Equipment', main_id, 9);

  -- Packaging & Printing
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Packaging & Printing', NULL, 24)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Packaging Materials', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Printing Machinery', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Labels & Tags', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Boxes & Containers', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Flexible Packaging', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Printing Supplies', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Packaging Design', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Protective Packaging', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Industrial Printing', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Packaging Equipment', main_id, 9);

  -- Security & Protection
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Security & Protection', NULL, 25)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Security Cameras', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Alarm Systems', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Access Control', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fire Protection', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Personal Protective Equipment', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Security Doors & Gates', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Surveillance Systems', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Safety Equipment', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Security Services', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Cybersecurity Products', main_id, 9);

  -- Shoes & Accessories
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Shoes & Accessories', NULL, 26)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Men''s Shoes', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Women''s Shoes', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Children''s Shoes', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Athletic Shoes', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Formal Shoes', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Casual Shoes', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Boots', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sandals', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Shoe Care', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Shoe Accessories', main_id, 9);

  -- Textiles & Leather Products
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Textiles & Leather Products', NULL, 27)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Fabrics', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Yarn', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Textile Materials', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Home Textiles', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Technical Textiles', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Leather Products', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Synthetic Leather', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Textile Machinery', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Dyeing & Finishing', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Textile Accessories', main_id, 9);

  -- Transportation
  INSERT INTO site_categories (id, name, parent_id, sort_order)
  VALUES (gen_random_uuid(), 'Transportation', NULL, 28)
  RETURNING id INTO main_id;
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Logistics Services', main_id, 0);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Freight Services', main_id, 1);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Shipping & Cargo', main_id, 2);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Warehousing', main_id, 3);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Vehicle Transport', main_id, 4);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Air Freight', main_id, 5);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Sea Freight', main_id, 6);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Land Transport', main_id, 7);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Express Delivery', main_id, 8);
  INSERT INTO site_categories (name, parent_id, sort_order) VALUES ('Supply Chain Solutions', main_id, 9);

END;
$$;
