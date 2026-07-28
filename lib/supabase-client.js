/**
 * Supabase Client Module
 * Cliente compartido por todos los agentes para acceso a la base de datos
 * Reemplaza el sistema de archivos JSON por almacenamiento en la nube
 */

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

// Cargar variables de entorno
require('dotenv').config();

// Verificar que las credenciales existan
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ ERROR: Faltan credenciales de Supabase en .env\n' +
    'Necesitas:\n' +
    '  SUPABASE_URL=https://xxx.supabase.co\n' +
    '  SUPABASE_SERVICE_ROLE_KEY=eyJxxx...'
  );
}

// Crear cliente de Supabase con service role (permisos completos)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: ws
  }
});

// ============================================================================
// FUNCIONES PARA AGENT_DECISIONS (Agent 0 output)
// ============================================================================

/**
 * Guarda una decisión de Agent 0 en la base de datos
 * @param {Object} decision - Objeto con la decisión completa
 * @returns {Promise<Object>} - Decision guardada con ID
 */
async function saveAgentDecision(decision) {
  const { data, error } = await supabase
    .from('agent_decisions')
    .insert([{
      verse_id: decision.id || null, // Si viene del verso en la tabla `verses`
      reference: decision.reference,
      text: decision.text,
      category: decision.category,
      custom_hook: decision.customHook || null,
      historical_insight: decision.historicalInsight || null,
      visual_descriptions: decision.visualDescriptions,
      target_audience: decision.targetAudience,
      keywords: decision.keywords,
      historical_context: decision.historicalContext,
      emotional_benefit: decision.emotionalBenefit,
      best_hook_type: decision.bestHookType,
      search_volume: decision.searchVolume,
      competition_level: decision.competitionLevel,
      viral_potential: decision.viralPotential,
      version: decision.version || '1.0-cloud'
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Error guardando decisión de Agent 0:', error);
    throw error;
  }

  console.log('✅ Decisión de Agent 0 guardada:', data.reference);
  return data;
}

/**
 * Obtiene la decisión más reciente de Agent 0
 * @returns {Promise<Object|null>} - Decision más reciente o null
 */
async function getLatestAgentDecision() {
  const { data, error } = await supabase
    .rpc('get_latest_agent_decision')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No hay datos todavía
      console.log('⚠️ No hay decisiones de Agent 0 en la base de datos');
      return null;
    }
    console.error('❌ Error obteniendo decisión de Agent 0:', error);
    throw error;
  }

  console.log('✅ Decisión de Agent 0 obtenida:', data.reference);
  return data;
}

// ============================================================================
// FUNCIONES PARA ANALYTICS_FEEDBACK (Analytics para mejorar agentes)
// ============================================================================

/**
 * Guarda o actualiza el feedback de analytics
 * @param {Object} feedback - Objeto con el feedback completo
 * @returns {Promise<Object>} - Feedback guardado
 */
async function saveAnalyticsFeedback(feedback) {
  const { data, error } = await supabase
    .from('analytics_feedback')
    .insert([{
      total_videos_analyzed: feedback.totalVideosAnalyzed || 0,
      agent_instructions: feedback.agentInstructions || {},
      learning_insights: feedback.learningInsights || {},
      version: feedback.version || '1.0-cloud'
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Error guardando feedback de analytics:', error);
    throw error;
  }

  console.log('✅ Feedback de analytics guardado');
  return data;
}

/**
 * Obtiene el feedback de analytics más reciente
 * @returns {Promise<Object|null>} - Feedback más reciente o null
 */
async function getLatestAnalyticsFeedback() {
  const { data, error } = await supabase
    .rpc('get_latest_analytics_feedback')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No hay datos todavía
      console.log('⚠️ No hay feedback de analytics en la base de datos');
      return null;
    }
    console.error('❌ Error obteniendo feedback de analytics:', error);
    throw error;
  }

  console.log('✅ Feedback de analytics obtenido');
  return data;
}

// ============================================================================
// FUNCIONES PARA GENERATED_SCRIPTS (Agent 1 output)
// ============================================================================

/**
 * Guarda un script generado por Agent 1
 * @param {Object} script - Objeto con el script completo
 * @param {number} agentDecisionId - ID de la decisión de Agent 0 asociada
 * @returns {Promise<Object>} - Script guardado con ID
 */
async function saveGeneratedScript(script, agentDecisionId) {
  const { data, error } = await supabase
    .from('generated_scripts')
    .insert([{
      agent_decision_id: agentDecisionId,
      verse_reference: script.metadata.verse.reference || script.metadata.verse,
      metadata: script.metadata,
      scenes: script.scenes,
      youtube_metadata: script.youtubeMetadata,
      script_file: script.scriptFile || null,
      version: script.version || '1.0-cloud'
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Error guardando script generado:', error);
    throw error;
  }

  console.log('✅ Script generado guardado:', data.verse_reference);
  return data;
}

/**
 * Obtiene scripts por versículo
 * @param {string} reference - Referencia del versículo (ej: "Juan 3:16")
 * @returns {Promise<Array>} - Array de scripts
 */
async function getScriptsByVerse(reference) {
  const { data, error } = await supabase
    .rpc('get_scripts_by_verse', { p_reference: reference });

  if (error) {
    console.error('❌ Error obteniendo scripts por versículo:', error);
    throw error;
  }

  console.log(`✅ ${data.length} script(s) encontrado(s) para ${reference}`);
  return data;
}

/**
 * Obtiene el script más reciente
 * @returns {Promise<Object|null>} - Script más reciente o null
 */
async function getLatestGeneratedScript() {
  const { data, error } = await supabase
    .from('generated_scripts')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️ No hay scripts generados en la base de datos');
      return null;
    }
    console.error('❌ Error obteniendo script más reciente:', error);
    throw error;
  }

  console.log('✅ Script más reciente obtenido:', data.verse_reference);
  return data;
}

/**
 * Actualiza el estado de producción de un script
 * @param {number} scriptId - ID del script
 * @param {string} status - Estado: pending, in_progress, completed, failed
 * @param {string} videoPath - Path del video producido (opcional)
 * @param {string} youtubeId - ID del video en YouTube (opcional)
 * @returns {Promise<Object>} - Script actualizado
 */
async function updateScriptProductionStatus(scriptId, status, videoPath = null, youtubeId = null) {
  const updateData = { production_status: status };
  if (videoPath) updateData.produced_video_path = videoPath;
  if (youtubeId) updateData.youtube_video_id = youtubeId;

  const { data, error } = await supabase
    .from('generated_scripts')
    .update(updateData)
    .eq('id', scriptId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error actualizando estado de producción:', error);
    throw error;
  }

  console.log(`✅ Estado de producción actualizado a: ${status}`);
  return data;
}

// ============================================================================
// EXPORTAR CLIENTE Y FUNCIONES
// ============================================================================

module.exports = {
  supabase,

  // Agent Decisions (Agent 0)
  saveAgentDecision,
  getLatestAgentDecision,

  // Analytics Feedback
  saveAnalyticsFeedback,
  getLatestAnalyticsFeedback,

  // Generated Scripts (Agent 1)
  saveGeneratedScript,
  getScriptsByVerse,
  getLatestGeneratedScript,
  updateScriptProductionStatus
};
