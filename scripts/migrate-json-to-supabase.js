#!/usr/bin/env node

/**
 * Script de Migración: Archivos JSON → Supabase Database
 *
 * Migra los datos existentes en archivos JSON a las tablas de Supabase:
 * - /output/agent-0-decision.json → agent_decisions
 * - /logs/analytics-feedback.json → analytics_feedback
 * - /output/scripts/script-*.json → generated_scripts
 *
 * Ejecuta ANTES de modificar Agent 1 para preservar datos existentes.
 */

const fs = require('fs');
const path = require('path');
const {
  saveAgentDecision,
  saveAnalyticsFeedback,
  saveGeneratedScript,
  getLatestAgentDecision
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

// ============================================================================
// PASO 1: Migrar Agent 0 Decision
// ============================================================================

async function migrateAgentDecision() {
  log('\n📁 PASO 1: Migrando decisión de Agent 0...', 'cyan');

  const decisionPath = path.join(__dirname, '../output/agent-0-decision.json');

  if (!fs.existsSync(decisionPath)) {
    log('⚠️ No se encontró agent-0-decision.json - saltando', 'yellow');
    return null;
  }

  try {
    const decisionData = JSON.parse(fs.readFileSync(decisionPath, 'utf-8'));
    log(`   Leyendo decisión: ${decisionData.reference}`, 'gray');

    const savedDecision = await saveAgentDecision(decisionData);

    log(`✅ Decisión migrada exitosamente (ID: ${savedDecision.id})`, 'green');
    return savedDecision;
  } catch (error) {
    log(`❌ Error migrando decisión de Agent 0: ${error.message}`, 'red');
    throw error;
  }
}

// ============================================================================
// PASO 2: Migrar Analytics Feedback
// ============================================================================

async function migrateAnalyticsFeedback() {
  log('\n📊 PASO 2: Migrando feedback de analytics...', 'cyan');

  const feedbackPath = path.join(__dirname, '../logs/analytics-feedback.json');

  if (!fs.existsSync(feedbackPath)) {
    log('⚠️ No se encontró analytics-feedback.json - saltando', 'yellow');
    return null;
  }

  try {
    const feedbackData = JSON.parse(fs.readFileSync(feedbackPath, 'utf-8'));
    log(`   Videos analizados: ${feedbackData.totalVideosAnalyzed}`, 'gray');

    const savedFeedback = await saveAnalyticsFeedback(feedbackData);

    log(`✅ Feedback migrado exitosamente (ID: ${savedFeedback.id})`, 'green');
    return savedFeedback;
  } catch (error) {
    log(`❌ Error migrando feedback de analytics: ${error.message}`, 'red');
    throw error;
  }
}

// ============================================================================
// PASO 3: Migrar Scripts Generados
// ============================================================================

async function migrateGeneratedScripts(agentDecisionId) {
  log('\n📝 PASO 3: Migrando scripts generados...', 'cyan');

  const scriptsDir = path.join(__dirname, '../output/scripts');

  if (!fs.existsSync(scriptsDir)) {
    log('⚠️ No se encontró directorio /output/scripts - saltando', 'yellow');
    return [];
  }

  try {
    const files = fs.readdirSync(scriptsDir)
      .filter(f => f.startsWith('script-') && f.endsWith('.json'))
      .sort();

    if (files.length === 0) {
      log('⚠️ No hay scripts para migrar', 'yellow');
      return [];
    }

    log(`   Encontrados ${files.length} script(s)`, 'gray');

    const savedScripts = [];
    for (const file of files) {
      const filePath = path.join(scriptsDir, file);
      const scriptData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      log(`   Migrando: ${file}...`, 'gray');

      const savedScript = await saveGeneratedScript(scriptData, agentDecisionId);
      savedScripts.push(savedScript);
    }

    log(`✅ ${savedScripts.length} script(s) migrado(s) exitosamente`, 'green');
    return savedScripts;
  } catch (error) {
    log(`❌ Error migrando scripts: ${error.message}`, 'red');
    throw error;
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
  log('╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     MIGRACIÓN DE DATOS: JSON → SUPABASE DATABASE             ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝', 'cyan');

  try {
    // PASO 1: Migrar decisión de Agent 0
    const savedDecision = await migrateAgentDecision();

    // PASO 2: Migrar feedback de analytics
    await migrateAnalyticsFeedback();

    // PASO 3: Migrar scripts generados
    // Usar el ID de la decisión guardada (o obtener la más reciente si ya existe)
    let agentDecisionId = savedDecision?.id;

    if (!agentDecisionId) {
      log('\n🔍 Buscando decisión de Agent 0 más reciente en Supabase...', 'yellow');
      const latestDecision = await getLatestAgentDecision();
      if (latestDecision) {
        agentDecisionId = latestDecision.id;
        log(`   Usando decisión existente (ID: ${agentDecisionId})`, 'gray');
      } else {
        log('⚠️ No hay decisión de Agent 0 para asociar scripts', 'yellow');
        log('   Los scripts se guardarán sin asociación (agent_decision_id = NULL)', 'yellow');
        agentDecisionId = null;
      }
    }

    await migrateGeneratedScripts(agentDecisionId);

    // Resumen final
    log('\n╔════════════════════════════════════════════════════════════════╗', 'green');
    log('║                 ✅ MIGRACIÓN COMPLETADA                        ║', 'green');
    log('╚════════════════════════════════════════════════════════════════╝', 'green');

    log('\n📊 Resumen:');
    log(`   ✅ Decisión de Agent 0: ${savedDecision ? 'Migrada' : 'No encontrada'}`, savedDecision ? 'green' : 'yellow');
    log(`   ✅ Feedback de Analytics: Migrado`, 'green');
    log(`   ✅ Scripts Generados: Migrados`, 'green');

    log('\n🎯 Siguientes pasos:');
    log('   1. Verifica los datos en Supabase Dashboard (SQL Editor):', 'cyan');
    log('      SELECT * FROM agent_decisions;', 'gray');
    log('      SELECT * FROM analytics_feedback;', 'gray');
    log('      SELECT * FROM generated_scripts;', 'gray');
    log('\n   2. Modifica Agent 1 para usar Supabase (ver MIGRACION_SUPABASE.md)', 'cyan');
    log('   3. Actualiza el workflow n8n', 'cyan');

  } catch (error) {
    log('\n╔════════════════════════════════════════════════════════════════╗', 'red');
    log('║                   ❌ ERROR EN LA MIGRACIÓN                     ║', 'red');
    log('╚════════════════════════════════════════════════════════════════╝', 'red');

    log(`\n${error.message}`, 'red');
    log(`\nStack trace:\n${error.stack}`, 'gray');

    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = { migrateAgentDecision, migrateAnalyticsFeedback, migrateGeneratedScripts };
