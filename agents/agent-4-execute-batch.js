#!/usr/bin/env node

/**
 * AGENTE 4: EJECUTOR DE BATCH DE IMÁGENES
 *
 * Lee las especificaciones de batch y ejecuta las generaciones con Magnific MCP
 * Este script debe ejecutarse desde Claude Code que tiene acceso a MCP
 *
 * IMPORTANTE: No ejecutar con node directamente, solo desde Claude Code
 */

const fs = require('fs');
const path = require('path');

const METADATA_DIR = path.join(__dirname, '../output/image-metadata');
const IMAGES_OUTPUT_DIR = path.join(__dirname, '../output/images');

/**
 * Procesar batch de imágenes
 */
async function processBatch(specFilePath) {
  console.log('🎨 Agente 4: Ejecutor de Batch');
  console.log('============================\n');

  // Leer especificación
  const spec = JSON.parse(fs.readFileSync(specFilePath, 'utf-8'));

  if (spec.type !== 'batch') {
    throw new Error('Este script solo procesa batches completos');
  }

  const batch = spec.batch;

  console.log(`📖 Video: ${batch.verse}`);
  console.log(`🎭 Categoría: ${batch.category}`);
  console.log(`🎬 Escenas: ${batch.scenes.length}`);
  console.log(`💰 Costo total: ${batch.totalCost} créditos\n`);

  const results = {
    videoId: batch.videoId,
    verse: batch.verse,
    category: batch.category,
    cinematicStyle: batch.cinematicStyle,
    totalCost: batch.totalCost,
    images: [],
    generatedAt: new Date().toISOString()
  };

  console.log('⚠️  INSTRUCCIONES PARA CLAUDE CODE:\n');
  console.log('Para cada escena, ejecutar:');
  console.log('');

  for (const scene of batch.scenes) {
    console.log(`\n🎬 Escena ${scene.sceneId}: ${scene.type.toUpperCase()}`);
    console.log(`📝 Prompt: ${scene.prompt.substring(0, 80)}...`);
    console.log(`\n📋 Llamar a Magnific MCP:`);
    console.log('```javascript');
    console.log('const result = await mcp__magnific__images_generate({');
    console.log(`  prompt: ${JSON.stringify(scene.prompt)},`);
    console.log(`  aspectRatio: "${scene.aspectRatio}",`);
    console.log(`  resolution: "${scene.resolution}",`);
    console.log(`  mode: "${scene.model}",`);
    console.log(`  count: 1`);
    console.log('});');
    console.log('');
    console.log('const identifier = result.creations[0].identifier;');
    console.log('');
    console.log('const completed = await mcp__magnific__creations_wait({');
    console.log('  identifiers: [identifier],');
    console.log('  timeoutSeconds: 25');
    console.log('});');
    console.log('');
    console.log('const imageUrl = completed.results[0].results.url;');
    console.log('```\n');

    // Placeholder para el resultado
    results.images.push({
      sceneId: scene.sceneId,
      type: scene.type,
      identifier: null,
      url: null,
      thumbnailUrl: null,
      status: 'pending',
      estimatedCost: scene.estimatedCost
    });
  }

  console.log('\n📝 Una vez generadas todas las imágenes, guardar en:');
  const outputFile = `images-metadata-${batch.verse.replace(/[:\s]/g, '-')}-${Date.now()}.json`;
  const outputPath = path.join(METADATA_DIR, outputFile);
  console.log(`   ${outputPath}`);

  // Guardar metadata preliminar
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('\n✅ Metadata preliminar guardada');
  console.log(`📁 ${outputPath}`);
  console.log('\n⚠️  Actualizar el archivo con las URLs e identifiers reales después de cada generación');

  return {
    success: true,
    outputFile: outputFile,
    outputPath: outputPath,
    scenesCount: batch.scenes.length
  };
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  try {
    // Buscar la spec más reciente
    const files = fs.readdirSync(METADATA_DIR)
      .filter(f => f.startsWith('spec-batch-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(METADATA_DIR, f),
        time: fs.statSync(path.join(METADATA_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      throw new Error('No se encontró ninguna especificación de batch para procesar');
    }

    const latestSpec = files[0];
    console.log(`\n📂 Especificación encontrada: ${latestSpec.name}\n`);

    const result = processBatch(latestSpec.path);

    console.log(`\n🎉 Script completado!`);
    console.log(`\n📋 Siguiente paso: Ejecutar las llamadas MCP manualmente desde Claude Code`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error en Agente 4:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { processBatch };
