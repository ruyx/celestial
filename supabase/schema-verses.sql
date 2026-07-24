-- ============================================================================
-- TABLA DE VERSÍCULOS CON METADATA IA
-- ============================================================================
-- Para almacenar 31,000+ versículos de CodexObsidiana con metadata generada
-- por Claude Sonnet 4.5

CREATE TABLE IF NOT EXISTS verses (
  id BIGSERIAL PRIMARY KEY,

  -- Identificación del versículo
  reference TEXT UNIQUE NOT NULL,  -- "Salmos 23:1"
  text TEXT NOT NULL,              -- Texto literal RV1960
  book TEXT NOT NULL,              -- "Salmos"
  chapter INTEGER NOT NULL,        -- 23
  verse INTEGER NOT NULL,          -- 1

  -- Metadata generada por IA
  category TEXT NOT NULL,          -- consuelo, salvación, fortaleza, etc.
  keywords JSONB NOT NULL,         -- Array de palabras clave SEO
  historical_context TEXT NOT NULL,        -- 2-3 frases de contexto
  historical_insight TEXT,                 -- Insight específico impactante
  custom_hook TEXT,                        -- Gancho viral personalizado
  emotional_benefit TEXT NOT NULL,         -- Beneficio emocional
  target_audience JSONB NOT NULL,          -- Array de demografías

  -- Scoring y optimización
  viral_potential INTEGER NOT NULL CHECK (viral_potential >= 1 AND viral_potential <= 10),
  search_volume TEXT NOT NULL CHECK (search_volume IN ('very high', 'high', 'medium', 'low')),
  competition_level TEXT NOT NULL CHECK (competition_level IN ('very high', 'high', 'medium', 'low')),
  best_hook_type TEXT NOT NULL CHECK (best_hook_type IN ('direct', 'controversy', 'negative')),

  -- Descripciones visuales para video
  visual_descriptions JSONB,       -- {hook, intro, body, application, cta}

  -- Tracking de uso
  used_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,

  -- Analytics (actualizado por Agent 9)
  analytics_ctr REAL,              -- Click-through rate promedio
  analytics_avg_view_duration REAL,  -- Duración promedio de visualización
  analytics_retention_rate REAL,    -- Tasa de retención
  analytics_engagement_rate REAL,   -- Tasa de engagement (likes/comments/shares)

  -- Metadata del sistema
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version TEXT DEFAULT '1.0-cloud',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice por categoría (para filtros)
CREATE INDEX IF NOT EXISTS idx_verses_category ON verses(category);

-- Índice por potencial viral (para selección inteligente)
CREATE INDEX IF NOT EXISTS idx_verses_viral_potential ON verses(viral_potential DESC);

-- Índice por uso (para evitar repetición)
CREATE INDEX IF NOT EXISTS idx_verses_used_count ON verses(used_count ASC);

-- Índice por libro (para búsquedas por libro)
CREATE INDEX IF NOT EXISTS idx_verses_book ON verses(book);

-- Índice compuesto para selección inteligente
CREATE INDEX IF NOT EXISTS idx_verses_selection ON verses(category, viral_potential DESC, used_count ASC);

-- Índice GIN para búsqueda full-text en keywords
CREATE INDEX IF NOT EXISTS idx_verses_keywords_gin ON verses USING GIN(keywords);

-- ============================================================================
-- FUNCIÓN DE FULL-TEXT SEARCH (alternativa a SQLite FTS5)
-- ============================================================================

-- Agregar columna tsvector para búsqueda full-text
ALTER TABLE verses ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Crear índice GIN para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_verses_search_vector ON verses USING GIN(search_vector);

-- Función para actualizar search_vector automáticamente
CREATE OR REPLACE FUNCTION verses_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.reference, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.text, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(array_to_string(
      ARRAY(SELECT jsonb_array_elements_text(NEW.keywords)), ' '
    ), '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger para actualizar search_vector en INSERT/UPDATE
CREATE TRIGGER verses_search_vector_update BEFORE INSERT OR UPDATE
  ON verses FOR EACH ROW EXECUTE FUNCTION verses_search_vector_trigger();

-- ============================================================================
-- FUNCIÓN PARA SELECCIÓN INTELIGENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION select_next_verse(
  p_category TEXT DEFAULT NULL,
  p_min_viral_potential INTEGER DEFAULT 7,
  p_exclude_recent BOOLEAN DEFAULT TRUE,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id BIGINT,
  reference TEXT,
  text TEXT,
  category TEXT,
  viral_potential INTEGER,
  used_count INTEGER,
  last_used TIMESTAMPTZ,
  score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.reference,
    v.text,
    v.category,
    v.viral_potential,
    v.used_count,
    v.last_used,
    -- Fórmula de scoring:
    -- - Prioriza versículos poco usados (30%)
    -- - Prioriza alto potencial viral (40%)
    -- - Agrega aleatoriedad para variedad (30%)
    ((10 - v.used_count) * 0.3 +
     v.viral_potential * 0.4 +
     random() * 0.3) AS score
  FROM verses v
  WHERE
    v.viral_potential >= p_min_viral_potential
    AND (p_category IS NULL OR v.category = p_category)
    AND (
      NOT p_exclude_recent
      OR v.used_count = 0
      OR (v.last_used IS NOT NULL AND NOW() - v.last_used > INTERVAL '30 days')
    )
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN PARA MARCAR COMO USADO
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_verse_as_used(p_reference TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE verses
  SET
    used_count = used_count + 1,
    last_used = NOW(),
    updated_at = NOW()
  WHERE reference = p_reference;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN DE BÚSQUEDA FULL-TEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION search_verses(
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id BIGINT,
  reference TEXT,
  text TEXT,
  category TEXT,
  viral_potential INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.reference,
    v.text,
    v.category,
    v.viral_potential,
    ts_rank(v.search_vector, websearch_to_tsquery('spanish', p_query)) AS rank
  FROM verses v
  WHERE v.search_vector @@ websearch_to_tsquery('spanish', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (opcional - para multi-tenant)
-- ============================================================================

-- Habilitar RLS (descomentar si se necesita multi-tenant)
-- ALTER TABLE verses ENABLE ROW LEVEL SECURITY;

-- Policy para lectura pública (descomentar si se necesita)
-- CREATE POLICY "Verses are viewable by everyone" ON verses
--   FOR SELECT USING (true);

-- Policy para escritura solo por service role (descomentar si se necesita)
-- CREATE POLICY "Verses are insertable by service role only" ON verses
--   FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGER PARA UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_verses_updated_at BEFORE UPDATE ON verses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ESTADÍSTICAS INICIALES
-- ============================================================================

COMMENT ON TABLE verses IS 'Versículos de CodexObsidiana con metadata generada por Claude Sonnet 4.5';
COMMENT ON COLUMN verses.reference IS 'Referencia única del versículo (ej: Salmos 23:1)';
COMMENT ON COLUMN verses.text IS 'Texto literal del versículo en Reina Valera 1960';
COMMENT ON COLUMN verses.keywords IS 'Array JSON de palabras clave para SEO';
COMMENT ON COLUMN verses.viral_potential IS 'Score 1-10 de potencial viral (generado por IA)';
COMMENT ON COLUMN verses.visual_descriptions IS 'Descripciones visuales para cada sección del video';
COMMENT ON COLUMN verses.search_vector IS 'Vector tsvector para búsqueda full-text en español';
