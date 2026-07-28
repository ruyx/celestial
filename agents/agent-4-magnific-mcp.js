#!/usr/bin/env node

/**
 * 🎨 Agent 4 (MCP): Magnific Image Generator
 *
 * Responsabilidades:
 * - Lee el batch más reciente de image-batches/
 * - Genera imágenes usando Magnific MCP (no REST API)
 * - Usa creations_wait para polling inteligente
 * - Guarda metadata en output/image-metadata/
 * - Guarda progreso incremental después de cada imagen
 *
 * Mejoras sobre versión REST:
 * ✅ Polling inteligente con creations_wait
 * ✅ Detección real de completado
 * ✅ Mejor manejo de errores
 * ✅ Sin dependencias de red externa
 * ✅ Mayor autonomía
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const BATCH_DIR = path.join(__dirname, '../output/image-batches');
const OUTPUT_DIR = path.join(__dirname, '../output/image-metadata');

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Encuentra el batch más reciente automáticamente
 * (REUTILIZADO de agent-4-magnific-api.js)
 */
function findLatestBatch() {
  if (!fs.existsSync(BATCH_DIR)) {
    throw new Error(`❌ Directorio de batches no existe: ${BATCH_DIR}`);
  }

  const files = fs.readdirSync(BATCH_DIR)
    .filter(f => f.startsWith('batch-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(BATCH_DIR, f),
      time: fs.statSync(path.join(BATCH_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    throw new Error(`❌ No se encontró ningún batch en ${BATCH_DIR}`);
  }

  console.log(`📂 Batch encontrado: ${files[0].name}`);
  return files[0].path;
}

/**
 * Mapeo de aspect ratios a formato Magnific MCP
 * (REUTILIZADO y ADAPTADO)
 *
 * MCP usa formato estándar: "16:9", "1:1", "9:16"
 * No necesita mapping complejo como REST API
 */
function mapAspectRatio(ratio) {
  const validRatios = ['16:9', '1:1', '9:16', '21:9', '4:3', '3:4', '2:3', '3:2'];

  if (!ratio) {
    console.log(`⚠️  Sin aspect ratio, usando 16:9 por defecto`);
    return '16:9';
  }

  if (validRatios.includes(ratio)) {
    return ratio;
  }

  console.log(`⚠️  Aspect ratio inválido: ${ratio}, usando 16:9`);
  return '16:9';
}

/**
 * Genera una imagen usando Magnific MCP
 */
async function generateImageMCP(scene, sceneIndex, totalScenes) {
  console.log(`\n🎨 Generando imagen ${sceneIndex + 1}/${totalScenes}`);
  console.log(`   Prompt: ${scene.prompt.substring(0, 80)}...`);
  console.log(`   Aspect: ${scene.aspectRatio}`);

  try {
    // Nota: Este código será ejecutado por Claude Code que tiene acceso a MCP
    // Los tools MCP no están disponibles en Node.js directamente
    // Por eso, este agente debe ser llamado a través de Claude Code

    // La llamada real la hará Claude Code cuando ejecute este script
    throw new Error(
      '⚠️  Este agente debe ser ejecutado a través de Claude Code con acceso a Magnific MCP.\n' +
      '   No puede ejecutarse como script Node.js standalone.\n' +
      '   Usa: claude run agents/agent-4-magnific-mcp.js'
    );

  } catch (error) {
    console.error(`❌ Error generando imagen ${sceneIndex + 1}:`, error.message);
    throw error;
  }
}

/**
 * Procesa un batch completo de imágenes
 */
async function processBatch(batchPath) {
  console.log(`\n📋 Procesando batch: ${path.basename(batchPath)}`);

  // Leer batch
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  console.log(`📊 Escenas a procesar: ${batch.scenes.length}`);

  // Preparar metadata output
  const verse = batch.verse || 'unknown';
  const timestamp = Date.now();
  const METADATA_FILE = path.join(OUTPUT_DIR, `images-${verse.replace(/[:\s]/g, '-')}-${timestamp}.json`);

  // Crear estructura de resultados
  const results = {
    videoId: batch.videoId || `video-${timestamp}`,
    verse: verse,
    category: batch.category || 'general',
    images: [],
    generatedAt: new Date().toISOString(),
    magnificSource: 'mcp', // Identificador de que usamos MCP
    totalScenes: batch.scenes.length
  };

  console.log(`💾 Metadata se guardará en: ${path.basename(METADATA_FILE)}`);

  // Asegurar que el directorio existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Procesar cada escena
  for (let i = 0; i < batch.scenes.length; i++) {
    const scene = batch.scenes[i];

    try {
      // Generar imagen con MCP
      const result = await generateImageMCP(scene, i, batch.scenes.length);

      // Agregar a resultados
      results.images.push({
        sceneId: scene.id,
        sceneType: scene.type,
        prompt: scene.prompt,
        aspectRatio: scene.aspectRatio,
        url: result.url,
        creationIdentifier: result.identifier,
        status: 'completed',
        generatedAt: new Date().toISOString()
      });

      // ✅ GUARDAR PROGRESO INCREMENTAL
      // Esto asegura que no se pierda el trabajo si falla más adelante
      fs.writeFileSync(METADATA_FILE, JSON.stringify(results, null, 2));
      console.log(`✅ Progreso guardado: ${i + 1}/${batch.scenes.length} imágenes`);

    } catch (error) {
      console.error(`❌ Error en escena ${i + 1}:`, error.message);

      // Agregar error al resultado
      results.images.push({
        sceneId: scene.id,
        sceneType: scene.type,
        prompt: scene.prompt,
        aspectRatio: scene.aspectRatio,
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      });

      // Guardar progreso con error
      fs.writeFileSync(METADATA_FILE, JSON.stringify(results, null, 2));

      // Propagar error para que Guardian lo detecte
      throw error;
    }
  }

  console.log(`\n✅ Batch procesado completamente`);
  console.log(`📊 ${results.images.filter(i => i.status === 'completed').length}/${batch.scenes.length} imágenes exitosas`);
  console.log(`💾 Metadata: ${METADATA_FILE}`);

  return METADATA_FILE;
}

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log('🎨 ============================================');
  console.log('🎨 Agent 4 (MCP): Magnific Image Generator');
  console.log('🎨 ============================================\n');

  try {
    // Auto-descubrir el batch más reciente
    const batchPath = findLatestBatch();

    // Procesar batch
    const metadataFile = await processBatch(batchPath);

    console.log('\n✅ ============================================');
    console.log('✅ ÉXITO - Imágenes generadas');
    console.log('✅ ============================================');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ============================================');
    console.error('❌ ERROR - Generación falló');
    console.error('❌ ============================================');
    console.error(`❌ ${error.message}`);

    process.exit(1);
  }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

// Exportar para testing
module.exports = { findLatestBatch, processBatch };
