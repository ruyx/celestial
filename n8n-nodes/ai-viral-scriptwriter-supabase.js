/**
 * N8N Node: AI VIRAL Master Scriptwriter
 * Lee el script más reciente desde Supabase Database
 *
 * IMPORTANTE: Este código se ejecuta en el contexto de n8n en Railway.
 * Requiere variables de entorno:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

// Importar dependencias (disponibles en n8n)
const { createClient } = require('@supabase/supabase-js');

// Obtener credenciales de Supabase desde variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ ERROR: Faltan credenciales de Supabase en variables de entorno\n' +
    'Configura en Railway:\n' +
    '  SUPABASE_URL=https://xxx.supabase.co\n' +
    '  SUPABASE_SERVICE_ROLE_KEY=eyJxxx...'
  );
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================================================
// FUNCIÓN PRINCIPAL: Obtener script más reciente
// ============================================================================

async function getLatestScript() {
  try {
    console.log('📊 Consultando Supabase para obtener script más reciente...');

    // Obtener el script más reciente de la tabla generated_scripts
    const { data: script, error } = await supabase
      .from('generated_scripts')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No hay scripts todavía
        console.log('⚠️ No hay scripts generados en Supabase');
        return {
          success: false,
          error: 'No hay scripts disponibles. Ejecuta Agent 1 primero.',
          shouldRetry: true
        };
      }

      console.error('❌ Error consultando Supabase:', error);
      throw error;
    }

    console.log(`✅ Script obtenido: ${script.verse_reference}`);

    // Extraer metadata relevante del script
    const metadata = script.metadata || {};
    const scenes = script.scenes || [];

    // Mapear datos de Supabase al formato esperado por el workflow
    return {
      success: true,

      // Datos básicos
      verse: script.verse_reference,
      scriptId: script.id,

      // Metadata del script
      category: metadata.category || 'general',
      hookType: metadata.hookType || 'direct',
      emotionalBenefit: metadata.emotionalBenefit || 'peace',
      viralPotential: metadata.viralPotential || 7,
      targetAudience: metadata.targetAudience || [],
      keywords: metadata.keywords || [],

      // Escenas
      scenesCount: scenes.length,
      estimatedDuration: metadata.estimatedDuration || 120,

      // YouTube metadata
      youtubeTitle: script.youtube_metadata?.title || '',
      youtubeDescription: script.youtube_metadata?.description || '',
      youtubeTags: script.youtube_metadata?.tags || [],

      // Tracking
      generatedAt: script.generated_at,
      productionStatus: script.production_status,

      // Para compatibilidad con el workflow actual
      scriptFile: `script-${script.verse_reference.replace(/[:\s]/g, '-')}-${script.id}.json`,
      timestamp: script.generated_at
    };

  } catch (error) {
    console.error('❌ Error obteniendo script de Supabase:', error.message);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// ============================================================================
// EJECUTAR Y RETORNAR RESULTADO
// ============================================================================

// Ejecutar la función y retornar el resultado
const result = await getLatestScript();

// n8n espera un array de items
return [{ json: result }];
