-- ============================================================================
-- SUPABASE MIGRATION: Video Analytics Table
-- ============================================================================
-- Proyecto: Rey Celestial - YouTube Bible Automation
-- Tabla: video_analytics (métricas de YouTube para Agent 9)
-- ============================================================================

-- Crear tabla de analytics
CREATE TABLE IF NOT EXISTS video_analytics (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Referencia al versículo
  verse_id UUID REFERENCES bible_verses(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,                   -- YouTube video ID
  reference TEXT NOT NULL,                  -- "Génesis 1:1" (denormalizado para queries rápidas)

  -- Métricas de YouTube
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  watch_time_minutes INTEGER DEFAULT 0,
  average_view_duration_seconds INTEGER DEFAULT 0,

  -- Engagement rates (calculados)
  engagement_rate DECIMAL(5, 2),            -- (likes + comments) / views * 100
  like_rate DECIMAL(5, 2),                  -- likes / views * 100
  comment_rate DECIMAL(5, 2),               -- comments / views * 100

  -- Rendimiento comparativo
  performance_score INTEGER,                -- Score 1-10 basado en métricas
  viral_potential_score INTEGER,            -- Score 1-10 de predicción viral

  -- Metadata de la medición
  collected_at TIMESTAMPTZ NOT NULL,        -- Cuándo se recolectaron las métricas
  collection_type TEXT DEFAULT 'scheduled', -- "scheduled", "manual", "triggered"

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para análisis rápido
CREATE INDEX IF NOT EXISTS idx_video_analytics_verse_id ON video_analytics(verse_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_collected_at ON video_analytics(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_analytics_performance_score ON video_analytics(performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_analytics_views ON video_analytics(views DESC);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_video_analytics_updated_at ON video_analytics;
CREATE TRIGGER update_video_analytics_updated_at
  BEFORE UPDATE ON video_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VISTA: Top Videos por Rendimiento
-- ============================================================================

CREATE OR REPLACE VIEW top_performing_videos AS
SELECT
  va.reference,
  va.video_id,
  va.views,
  va.likes,
  va.comments,
  va.engagement_rate,
  va.performance_score,
  bv.category,
  bv.viral_potential,
  va.collected_at
FROM video_analytics va
JOIN bible_verses bv ON va.verse_id = bv.id
ORDER BY va.performance_score DESC, va.views DESC;

-- ============================================================================
-- VISTA: Evolución de Métricas (últimos 7 días)
-- ============================================================================

CREATE OR REPLACE VIEW recent_analytics AS
SELECT
  va.reference,
  va.video_id,
  va.views,
  va.likes,
  va.comments,
  va.engagement_rate,
  va.collected_at,
  bv.category
FROM video_analytics va
JOIN bible_verses bv ON va.verse_id = bv.id
WHERE va.collected_at >= NOW() - INTERVAL '7 days'
ORDER BY va.collected_at DESC;

-- ============================================================================
-- FUNCIÓN: Calcular Performance Score
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_performance_score(
  p_views INTEGER,
  p_likes INTEGER,
  p_comments INTEGER,
  p_engagement_rate DECIMAL
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
BEGIN
  -- Componente de vistas (max 3 puntos)
  IF p_views >= 10000 THEN v_score := v_score + 3;
  ELSIF p_views >= 5000 THEN v_score := v_score + 2;
  ELSIF p_views >= 1000 THEN v_score := v_score + 1;
  END IF;

  -- Componente de engagement rate (max 4 puntos)
  IF p_engagement_rate >= 10.0 THEN v_score := v_score + 4;
  ELSIF p_engagement_rate >= 7.0 THEN v_score := v_score + 3;
  ELSIF p_engagement_rate >= 5.0 THEN v_score := v_score + 2;
  ELSIF p_engagement_rate >= 3.0 THEN v_score := v_score + 1;
  END IF;

  -- Componente de likes (max 2 puntos)
  IF p_likes >= 500 THEN v_score := v_score + 2;
  ELSIF p_likes >= 100 THEN v_score := v_score + 1;
  END IF;

  -- Componente de comentarios (max 1 punto)
  IF p_comments >= 50 THEN v_score := v_score + 1;
  END IF;

  RETURN LEAST(v_score, 10); -- Cap en 10
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- QUERIES ÚTILES
-- ============================================================================

-- Ver top 10 videos por engagement
-- SELECT * FROM top_performing_videos LIMIT 10;

-- Comparar viral_potential (predicción) vs performance real
-- SELECT
--   bv.reference,
--   bv.viral_potential as predicted,
--   va.performance_score as actual,
--   va.views,
--   va.engagement_rate
-- FROM bible_verses bv
-- JOIN video_analytics va ON bv.id = va.verse_id
-- WHERE bv.published = TRUE
-- ORDER BY ABS(bv.viral_potential - va.performance_score) DESC;

-- Evolución de métricas de un video
-- SELECT
--   collected_at,
--   views,
--   likes,
--   comments,
--   engagement_rate
-- FROM video_analytics
-- WHERE video_id = 'YOUR_VIDEO_ID'
-- ORDER BY collected_at DESC;
