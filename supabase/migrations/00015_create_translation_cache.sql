-- Translation cache for AI-translated website content
-- Migration: 00015_create_translation_cache

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL,
  message_key TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(locale, message_key)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_translation_cache_locale ON translation_cache(locale);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (translations are non-sensitive, needed by all visitors)
CREATE POLICY "Translations are publicly readable" ON translation_cache
  FOR SELECT USING (true);

-- Service role can manage translations (used by admin translation jobs)
CREATE POLICY "Service role can manage translations" ON translation_cache
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_translation_cache_updated_at
  BEFORE UPDATE ON translation_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
