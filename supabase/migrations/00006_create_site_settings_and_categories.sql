-- Site settings table for storing configurable site values (e.g. video URL)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default video setting (empty = use local fallback)
INSERT INTO site_settings (key, value) VALUES ('homepage_video_url', '')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings
CREATE POLICY "Site settings are publicly readable"
  ON site_settings FOR SELECT USING (true);

-- Only service role can modify site settings
CREATE POLICY "Service role can manage site settings"
  ON site_settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Site categories table for dynamic category/subcategory management
CREATE TABLE IF NOT EXISTS site_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES site_categories(id) ON DELETE CASCADE,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories
CREATE POLICY "Categories are publicly readable"
  ON site_categories FOR SELECT USING (true);

-- Only service role can modify categories
CREATE POLICY "Service role can manage categories"
  ON site_categories FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
