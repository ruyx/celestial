-- ============================================================================
-- TABLAS PARA FLUJO DE AGENTES (Agent 0 → Agent 1 → n8n)
-- ============================================================================
-- Migración del sistema de archivos JSON a Supabase Database
-- Para permitir que n8n en Railway acceda a los datos de los agentes
--
-- Creado: 2026-07-24
-- Propósito: Reemplazar dependencias de filesystem por base de datos
-- ============================================================================

-- ============================================================================
-- TABLA: agent_decisions
-- ============================================================================
-- Almacena las decisiones de Agent 0 (Verse Researcher)
-- Reemplaza: /output/agent-0-decision.json
-- Usado por: Agent 1 (Scriptwriter) y n8n workflow

CREATE TABLE IF NOT EXISTS agent_decisions (
  id BIGSERIAL PRIMARY KEY,

  -- Identificación del versículo seleccionado
  verse_id BIGINT,                    -- ID opcional de tabla verses/bible_verses (si existe)
  reference TEXT NOT NULL,            -- "Juan 3:16", "Salmos 23:1"
  text TEXT NOT NULL,                 -- Texto del versículo RV1960

  -- Metadata de la decisión
  category TEXT NOT NULL,             -- salvación, consuelo, fortaleza, etc.
  custom_hook TEXT,                   -- Gancho viral personalizado
  historical_insight TEXT,            -- Insight histórico impactante

  -- Visual descriptions para cada sección del video
  visual_descriptions JSONB NOT NULL, -- {hook, intro, body, application, cta}

  -- Audiencia y keywords
  target_audience JSONB NOT NULL,     -- Array de demografías
  keywords JSONB NOT NULL,            -- Array de palabras clave

  -- Scoring y contexto
  historical_context TEXT NOT NULL,
  emotional_benefit TEXT NOT NULL,
  best_hook_type TEXT NOT NULL CHECK (best_hook_type IN ('direct', 'controversy', 'negative')),
  search_volume TEXT NOT NULL CHECK (search_volume IN ('very high', 'high', 'medium', 'low')),
  competition_level TEXT NOT NULL CHECK (competition_level IN ('very high', 'high', 'medium', 'low')),
  viral_potential INTEGER NOT NULL CHECK (viral_potential >= 1 AND viral_potential <= 10),

  -- Metadata del agente
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  selected_by TEXT NOT NULL DEFAULT 'agent-0-verse-researcher',
  version TEXT NOT NULL DEFAULT '1.0-cloud',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para agent_decisions
CREATE INDEX IF NOT EXISTS idx_agent_decisions_reference ON agent_decisions(reference);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_selected_at ON agent_decisions(selected_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_category ON agent_decisions(category);

-- ============================================================================
-- TABLA: analytics_feedback
-- ============================================================================
-- Almacena feedback de YouTube Analytics para el aprendizaje de los agentes
-- Reemplaza: /logs/analytics-feedback.json
-- Usado por: Agent 1 (para mejorar scripts), Agent 9 (Analytics)

CREATE TABLE IF NOT EXISTS analytics_feedback (
  id BIGSERIAL PRIMARY KEY,

  -- Estadísticas globales
  last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_videos_analyzed INTEGER NOT NULL DEFAULT 0,

  -- Instrucciones para cada agente (JSON array de objetos)
  agent_instructions JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Ejemplo: {"Agent 1 - Scriptwriter": [{priority: "HIGH", action: "...", detail: "..."}]}

  -- Insights de aprendizaje
  learning_insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Ejemplo: {
  --   topPerformingHookTypes: ["direct", "controversy"],
  --   bestCategories: ["consuelo", "salvación"],
  --   avgPerformance: {ctr: 8.5, retention: 65}
  -- }

  -- Tracking
  version TEXT NOT NULL DEFAULT '1.0-cloud',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para obtener la feedback más reciente rápidamente
CREATE INDEX IF NOT EXISTS idx_analytics_feedback_last_update ON analytics_feedback(last_update DESC);

-- ============================================================================
-- TABLA: generated_scripts
-- ============================================================================
-- Almacena scripts generados por Agent 1 (Viral Scriptwriter)
-- Reemplaza: /output/scripts/script-{verse}-{timestamp}.json
-- Usado por: Agent 2+ (TTS, Video, etc.) y n8n workflow

CREATE TABLE IF NOT EXISTS generated_scripts (
  id BIGSERIAL PRIMARY KEY,

  -- Relación con la decisión de Agent 0
  agent_decision_id BIGINT REFERENCES agent_decisions(id) ON DELETE CASCADE,
  verse_reference TEXT NOT NULL,      -- "Juan 3:16"

  -- Metadata del script
  metadata JSONB NOT NULL,
  -- Ejemplo: {
  --   verse, category, hookType, targetAudience, keywords,
  --   emotionalBenefit, viralPotential, estimatedDuration, tone
  -- }

  -- Escenas del video (array de objetos)
  scenes JSONB NOT NULL,
  -- Ejemplo: [
  --   {id: 1, type: "hook", text: "...", duration: 5, visualCue: "..."},
  --   {id: 2, type: "intro", text: "...", duration: 13, visualCue: "..."},
  --   ...
  -- ]

  -- Metadata de YouTube generada
  youtube_metadata JSONB NOT NULL,
  -- Ejemplo: {
  --   title: "...",
  --   description: "...",
  --   tags: [...],
  --   category: "22"
  -- }

  -- Tracking
  script_file TEXT,                   -- Nombre del archivo original (para referencia)
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by TEXT NOT NULL DEFAULT 'agent-1-viral-scriptwriter',
  version TEXT NOT NULL DEFAULT '1.0-cloud',

  -- Status de producción
  production_status TEXT DEFAULT 'pending' CHECK (production_status IN ('pending', 'in_progress', 'completed', 'failed')),
  produced_video_path TEXT,           -- Path del video final producido
  youtube_video_id TEXT,              -- ID del video en YouTube una vez subido

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para generated_scripts
CREATE INDEX IF NOT EXISTS idx_generated_scripts_verse_reference ON generated_scripts(verse_reference);
CREATE INDEX IF NOT EXISTS idx_generated_scripts_generated_at ON generated_scripts(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_scripts_production_status ON generated_scripts(production_status);
CREATE INDEX IF NOT EXISTS idx_generated_scripts_agent_decision_id ON generated_scripts(agent_decision_id);

-- Índice GIN para búsqueda en metadata
CREATE INDEX IF NOT EXISTS idx_generated_scripts_metadata_gin ON generated_scripts USING GIN(metadata);

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para obtener la decisión más reciente de Agent 0
CREATE OR REPLACE FUNCTION get_latest_agent_decision()
RETURNS SETOF agent_decisions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM agent_decisions
  ORDER BY selected_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener el feedback de analytics más reciente
CREATE OR REPLACE FUNCTION get_latest_analytics_feedback()
RETURNS SETOF analytics_feedback AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM analytics_feedback
  ORDER BY last_update DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener scripts por versículo
CREATE OR REPLACE FUNCTION get_scripts_by_verse(p_reference TEXT)
RETURNS SETOF generated_scripts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM generated_scripts
  WHERE verse_reference = p_reference
  ORDER BY generated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_agent_decisions_updated_at BEFORE UPDATE ON agent_decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_feedback_updated_at BEFORE UPDATE ON analytics_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_scripts_updated_at BEFORE UPDATE ON generated_scripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE agent_decisions IS 'Decisiones de Agent 0 (Verse Researcher) - reemplaza agent-0-decision.json';
COMMENT ON TABLE analytics_feedback IS 'Feedback de YouTube Analytics para aprendizaje - reemplaza analytics-feedback.json';
COMMENT ON TABLE generated_scripts IS 'Scripts generados por Agent 1 (Viral Scriptwriter) - reemplaza scripts/script-*.json';

COMMENT ON COLUMN agent_decisions.visual_descriptions IS 'Descripciones visuales para cada sección: {hook, intro, body, application, cta}';
COMMENT ON COLUMN analytics_feedback.agent_instructions IS 'Instrucciones específicas por agente basadas en analytics';
COMMENT ON COLUMN analytics_feedback.learning_insights IS 'Insights de aprendizaje: mejores hookTypes, categorías, performance promedio';
COMMENT ON COLUMN generated_scripts.scenes IS 'Array de escenas del video con texto, duración y visual cues';
COMMENT ON COLUMN generated_scripts.youtube_metadata IS 'Metadata optimizada para YouTube: title, description, tags, category';

-- ============================================================================
-- PERMISOS (RLS - Row Level Security)
-- ============================================================================
-- Por ahora deshabilitado, pero preparado para multi-tenant en el futuro

-- ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics_feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generated_scripts ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow service role full access to agent_decisions" ON agent_decisions
--   FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
