#!/usr/bin/env node

/**
 * AGENTE 4: EJECUTOR DE BATCH CON MAGNIFIC MCP
 *
 * Genera imágenes usando Magnific MCP (Model Context Protocol)
 * Solución para WSL donde OAuth no funciona automáticamente
 *
 * IMPORTANTE: Este script debe ejecutarse desde Claude Code con acceso a MCP
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../output/images');

// Encontrar el batch más reciente automáticamente
function findLatestBatch() {
  const batchDir = path.join(__dirname, '../output/image-batches');

  if (!fs.existsSync(batchDir)) {
    throw new Error('❌ No existe el directorio de batches. Ejecuta primero Agent-3 (Batch Generator).');
  }

  const files = fs.readdirSync(batchDir)
    .filter(f => f.startsWith('batch-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(batchDir, f),
      time: fs.statSync(path.join(batchDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    throw new Error('❌ No se encontró ningún batch generado. Ejecuta primero Agent-3 (Batch Generator).');
  }

  console.log(`✅ Batch encontrado: ${files[0].name}`);
  return files[0].path;
}

const BATCH_FILE = findLatestBatch();
const batchData = JSON.parse(fs.readFileSync(BATCH_FILE, 'utf-8'));
const METADATA_FILE = path.join(__dirname, `../output/image-metadata/images-${batchData.verse.replace(/[:\s]/g, '-')}.json`);

/**
 * NOTA: Este agente necesita ejecutarse desde Claude Code con MCP
 * No puede ejecutarse standalone desde la terminal
 */
async function processBatch() {
  console.log('🚀 Agente 4: Magnific MCP Image Generator');
  console.log('=========================================\n');

  // Leer batch
  const batch = JSON.parse(fs.readFileSync(BATCH_FILE, 'utf-8'));

  console.log(`📖 Video: ${batch.verse}`);
  console.log(`🎬 Escenas: ${batch.scenes.length}`);
  console.log(`💰 Costo estimado: ${batch.totalCost} créditos\n`);

  const results = {
    videoId: batch.videoId,
    verse: batch.verse,
    category: batch.category,
    images: [],
    generatedAt: new Date().toISOString()
  };

  console.log('⚠️  IMPORTANTE: Este agente debe ejecutarse desde Claude Code con MCP');
  console.log('⚠️  NO puede ejecutarse standalone desde la terminal\n');

  // Instrucciones para Claude Code
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  INSTRUCCIONES PARA CLAUDE CODE                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Para cada escena, ejecutar:\n');

  batch.scenes.forEach((scene, idx) => {
    console.log(`\n🎨 Escena ${scene.sceneId}: ${scene.type.toUpperCase()}`);
    console.log(`📝 Prompt: ${scene.prompt.substring(0, 80)}...`);
    console.log(`📐 Aspect Ratio: ${scene.aspectRatio}`);
    console.log(`🎯 Resolución: ${scene.resolution}`);
    console.log(`💰 Costo: ${scene.estimatedCost} créditos\n`);

    console.log(`PASO ${idx + 1}.1: Llamar mcp__magnific__images_generate con:`);
    console.log(`{`);
    console.log(`  prompt: "${scene.prompt.substring(0, 60)}...",`);
    console.log(`  aspectRatio: "${scene.aspectRatio}",`);
    console.log(`  mode: "ideogram-v3-1",`);
    console.log(`  count: 1`);
    console.log(`}\n`);

    console.log(`PASO ${idx + 1}.2: Llamar mcp__magnific__creations_wait con el identifier devuelto`);
    console.log(`PASO ${idx + 1}.3: Extraer url del resultado\n`);

    // Crear entrada placeholder en metadata
    results.images.push({
      sceneId: scene.sceneId,
      type: scene.type,
      taskId: `pending-${scene.sceneId}`,
      status: 'CREATED',
      generated: [],
      estimatedCost: scene.estimatedCost,
      prompt: scene.prompt,
      aspectRatio: scene.aspectRatio,
      resolution: scene.resolution
    });
  });

  // Guardar metadata inicial
  fs.writeFileSync(METADATA_FILE, JSON.stringify(results, null, 2));

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  METADATA INICIAL GUARDADA                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`📁 Archivo: ${METADATA_FILE}`);
  console.log(`\n⚠️  Las imágenes deben generarse manualmente via MCP desde Claude Code`);
  console.log(`⚠️  Una vez generadas, actualizar el archivo metadata con:`);
  console.log(`   - identifier: creation identifier de Magnific`);
  console.log(`   - url: URL de la imagen generada`);
  console.log(`   - status: "COMPLETED"\n`);

  return results;
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  processBatch()
    .then((results) => {
      console.log('\n📊 Metadata inicial creada con éxito');
      console.log(`🎯 Total escenas: ${results.images.length}`);
      console.log(`\n⚠️  ACCIÓN REQUERIDA: Ejecutar generación via MCP desde Claude Code\n`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error fatal:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { processBatch };
