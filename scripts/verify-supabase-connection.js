#!/usr/bin/env node

/**
 * Script de Verificación: Conexión a Supabase
 *
 * Verifica que:
 * 1. Las credenciales de Supabase están configuradas
 * 2. La conexión a Supabase funciona
 * 3. Hay datos disponibles para el workflow n8n
 */

const {
  supabase,
  getLatestAgentDecision,
  getLatestAnalyticsFeedback,
  getLatestGeneratedScript
} = require('../lib/supabase-client');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyConnection() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     VERIFICACIÓN DE CONEXIÓN A SUPABASE                      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝', 'cyan');

  let allGood = true;

  // ============================================================================
  // PASO 1: Verificar credenciales
  // ============================================================================

  log('\n📋 PASO 1: Verificando credenciales...', 'cyan');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ ERROR: Faltan credenciales de Supabase en .env', 'red');
    log('   Asegúrate de tener:', 'yellow');
    log('   - SUPABASE_URL', 'yellow');
    log('   - SUPABASE_SERVICE_ROLE_KEY', 'yellow');
    return false;
  }

  log(`✅ SUPABASE_URL configurada: ${supabaseUrl}`, 'green');
  log(`✅ SUPABASE_SERVICE_ROLE_KEY configurada (${supabaseKey.length} caracteres)`, 'green');

  // ============================================================================
  // PASO 2: Verificar conexión a Supabase
  // ============================================================================

  log('\n🔌 PASO 2: Verificando conexión a Supabase...', 'cyan');

  try {
    // Hacer una consulta simple para verificar la conexión
    const { data, error } = await supabase
      .from('generated_scripts')
      .select('id')
      .limit(1);

    if (error) {
      log(`❌ ERROR: No se pudo conectar a Supabase: ${error.message}`, 'red');
      allGood = false;
    } else {
      log('✅ Conexión a Supabase exitosa', 'green');
    }
  } catch (error) {
    log(`❌ ERROR: Excepción al conectar: ${error.message}`, 'red');
    allGood = false;
  }

  // ============================================================================
  // PASO 3: Verificar datos disponibles
  // ============================================================================

  log('\n📊 PASO 3: Verificando datos disponibles para n8n...', 'cyan');

  // Verificar Agent Decisions
  try {
    const decision = await getLatestAgentDecision();
    if (decision) {
      log(`✅ Decisión de Agent 0 encontrada: ${decision.reference}`, 'green');
      log(`   Categoría: ${decision.category}`, 'gray');
      log(`   Viral potential: ${decision.viral_potential}/10`, 'gray');
    } else {
      log('⚠️  No hay decisiones de Agent 0 en la base de datos', 'yellow');
      log('   Ejecuta: node agents/agent-0-verse-researcher.js', 'gray');
    }
  } catch (error) {
    log(`❌ ERROR al obtener decisión de Agent 0: ${error.message}`, 'red');
    allGood = false;
  }

  // Verificar Analytics Feedback
  try {
    const feedback = await getLatestAnalyticsFeedback();
    if (feedback) {
      log(`✅ Feedback de Analytics encontrado: ${feedback.total_videos_analyzed} videos analizados`, 'green');
    } else {
      log('⚠️  No hay feedback de analytics', 'yellow');
      log('   (No es crítico para el workflow)', 'gray');
    }
  } catch (error) {
    log(`⚠️  Error al obtener feedback: ${error.message}`, 'yellow');
  }

  // Verificar Generated Scripts (CRÍTICO para n8n)
  try {
    const script = await getLatestGeneratedScript();
    if (script) {
      log(`✅ Script más reciente encontrado: ${script.verse_reference}`, 'green');
      log(`   ID: ${script.id}`, 'gray');
      log(`   Generado: ${new Date(script.generated_at).toLocaleString()}`, 'gray');
      log(`   Estado: ${script.production_status}`, 'gray');

      // Verificar metadata
      const metadata = script.metadata || {};
      log(`   Metadata:`, 'gray');
      log(`     - Category: ${metadata.category || 'N/A'}`, 'gray');
      log(`     - Hook Type: ${metadata.hookType || 'N/A'}`, 'gray');
      log(`     - Scenes: ${script.scenes?.length || 0}`, 'gray');

    } else {
      log('❌ No hay scripts generados en la base de datos', 'red');
      log('   ⚠️  CRÍTICO: El workflow n8n necesita scripts para funcionar', 'red');
      log('   Ejecuta: node agents/agent-1-viral-scriptwriter.js', 'yellow');
      allGood = false;
    }
  } catch (error) {
    log(`❌ ERROR al obtener script: ${error.message}`, 'red');
    allGood = false;
  }

  // ============================================================================
  // PASO 4: Simular lectura del workflow n8n
  // ============================================================================

  log('\n🎬 PASO 4: Simulando lectura del workflow n8n...', 'cyan');

  try {
    // Esto es exactamente lo que hace el nodo n8n
    const { data: script, error } = await supabase
      .from('generated_scripts')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        log('❌ No hay scripts disponibles para el workflow', 'red');
        allGood = false;
      } else {
        throw error;
      }
    } else {
      log('✅ El workflow n8n podrá leer correctamente:', 'green');
      log(`   verse: ${script.verse_reference}`, 'gray');
      log(`   category: ${script.metadata?.category}`, 'gray');
      log(`   hookType: ${script.metadata?.hookType}`, 'gray');
      log(`   scenesCount: ${script.scenes?.length}`, 'gray');
    }
  } catch (error) {
    log(`❌ ERROR simulando workflow: ${error.message}`, 'red');
    allGood = false;
  }

  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================

  log('\n╔════════════════════════════════════════════════════════════════╗', allGood ? 'green' : 'red');
  log(`║     ${allGood ? '✅ VERIFICACIÓN EXITOSA' : '❌ VERIFICACIÓN FALLIDA'}                             ║`, allGood ? 'green' : 'red');
  log('╚════════════════════════════════════════════════════════════════╝', allGood ? 'green' : 'red');

  if (allGood) {
    log('\n🎉 Todo listo para que n8n funcione en Railway!', 'green');
    log('\n📋 Próximos pasos:', 'cyan');
    log('   1. Verifica que Railway tenga las variables de entorno configuradas', 'gray');
    log('   2. Abre n8n en Railway y ejecuta el workflow manualmente', 'gray');
    log('   3. Verifica los logs del workflow para confirmar la lectura', 'gray');
  } else {
    log('\n⚠️  Hay problemas que resolver antes de usar n8n:', 'yellow');
    log('   1. Asegúrate de que las credenciales son correctas', 'gray');
    log('   2. Verifica que las migraciones se aplicaron correctamente', 'gray');
    log('   3. Genera al menos un script con Agent 1', 'gray');
  }

  log('');
  return allGood;
}

// Ejecutar
if (require.main === module) {
  verifyConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = { verifyConnection };
