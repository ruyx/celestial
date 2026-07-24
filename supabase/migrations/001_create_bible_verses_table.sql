-- ============================================================================
-- SUPABASE MIGRATION: Bible Verses Table
-- ============================================================================
-- Proyecto: Rey Celestial - YouTube Bible Automation
-- Tabla: bible_verses (30,987 versículos con metadata AI-generated)
-- ============================================================================

-- Crear tabla principal de versículos
CREATE TABLE IF NOT EXISTS bible_verses (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identificación del versículo
  reference TEXT NOT NULL UNIQUE,          -- "Génesis 1:1"
  book TEXT NOT NULL,                      -- "Génesis"
  chapter INTEGER NOT NULL,                 -- 1
  verse INTEGER NOT NULL,                   -- 1
  text TEXT NOT NULL,                       -- Texto del versículo

  -- Metadata AI-generada (OpenRouter)
  category TEXT,                            -- "creación", "salvación", etc.
  keywords TEXT[],                          -- Array de palabras clave
  historical_context TEXT[],                -- Contexto histórico
  historical_insight TEXT[],                -- Insights históricos
  custom_hook TEXT,                         -- Hook viral para video
  emotional_benefit TEXT,                   -- Beneficio emocional
  target_audience TEXT[],                   -- Audiencia objetivo
  viral_potential INTEGER CHECK (viral_potential BETWEEN 1 AND 10),
  search_volume TEXT,                       -- "low", "medium", "high", "very high"
  competition_level TEXT,                   -- "low", "medium", "high", "very high"
  best_hook_type TEXT,                      -- "direct", "question", "story", etc.

  -- Descripciones visuales (JSON)
  visual_descriptions JSONB,                -- {hook, intro, body, application, cta}

  -- Metadata técnica
  generated_at TIMESTAMPTZ,                 -- Cuándo se generó la metadata
  version TEXT,                             -- "1.0-openrouter"
  ai_model TEXT,                            -- "mistralai/mistral-nemo"
  error TEXT,                               -- Si hubo error en generación

  -- Estado de publicación
  published BOOLEAN DEFAULT FALSE,          -- Si ya se publicó en YouTube
  published_at TIMESTAMPTZ,                 -- Cuándo se publicó
  video_id TEXT,                            -- ID del video en YouTube

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_bible_verses_book ON bible_verses(book);
CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter ON bible_verses(chapter);
CREATE INDEX IF NOT EXISTS idx_bible_verses_category ON bible_verses(category);
CREATE INDEX IF NOT EXISTS idx_bible_verses_viral_potential ON bible_verses(viral_potential DESC);
CREATE INDEX IF NOT EXISTS idx_bible_verses_published ON bible_verses(published);
CREATE INDEX IF NOT EXISTS idx_bible_verses_reference ON bible_verses(reference);

-- Índice GIN para búsqueda de texto completo
CREATE INDEX IF NOT EXISTS idx_bible_verses_text_search ON bible_verses USING GIN(to_tsvector('spanish', text));
CREATE INDEX IF NOT EXISTS idx_bible_verses_keywords_search ON bible_verses USING GIN(keywords);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_bible_verses_updated_at ON bible_verses;
CREATE TRIGGER update_bible_verses_updated_at
  BEFORE UPDATE ON bible_verses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- QUERIES ÚTILES
-- ============================================================================

-- Ver estadísticas de versículos por libro
-- SELECT book, COUNT(*) as total FROM bible_verses GROUP BY book ORDER BY total DESC;

-- Buscar versículos de alto potencial viral
-- SELECT reference, viral_potential, custom_hook FROM bible_verses WHERE viral_potential >= 8 ORDER BY viral_potential DESC LIMIT 20;

-- Buscar versículos por categoría
-- SELECT reference, text, category FROM bible_verses WHERE category = 'salvación' LIMIT 10;

-- Buscar versículos por palabra clave
-- SELECT reference, text FROM bible_verses WHERE 'amor' = ANY(keywords) LIMIT 10;

-- Buscar versículos no publicados de alto potencial
-- SELECT reference, viral_potential, custom_hook FROM bible_verses WHERE published = FALSE ORDER BY viral_potential DESC LIMIT 1;
