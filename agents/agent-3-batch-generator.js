#!/usr/bin/env node

/**
 * AGENTE 3: BATCH GENERATOR PARA MAGNIFIC
 *
 * Prepara los prompts en formato batch para generación masiva
 * Output: JSON con array de prompts listos para Magnific
 *
 * Nota: Las llamadas MCP se hacen desde n8n o Claude Code
 * Este script solo prepara los datos en el formato correcto
 */

const fs = require('fs');
const path = require('path');

// Directorios
const DESIGN_DIR = path.join(__dirname, '../output/image-prompts');
const BATCH_DIR = path.join(__dirname, '../output/image-batches');

// Asegurar que existe el directorio
if (!fs.existsSync(BATCH_DIR)) {
  fs.mkdirSync(BATCH_DIR, { recursive: true });
}

/**
 * PREPARADOR DE BATCH
 */
class BatchGenerator {
  constructor(designFile) {
    this.designPath = designFile;
    this.design = JSON.parse(fs.readFileSync(designFile, 'utf-8'));
    this.batch = {
      videoId: this.design.videoId,
      verse: this.design.verse,
      category: this.design.category,
      cinematicStyle: this.design.cinematicStyle,
      totalCost: 0,
      scenes: [],
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Preparar todas las escenas para generación
   */
  prepareBatch() {
    console.log('🎨 Agente 3: Preparador de Batch para Magnific');
    console.log('=============================================\n');
    console.log(`📖 Video: ${this.design.verse}`);
    console.log(`🎭 Categoría: ${this.design.category}`);
    console.log(`🎬 Escenas: ${this.design.scenes.length}\n`);

    this.design.scenes.forEach((scene, index) => {
      console.log(`🎬 Escena ${scene.id}: ${scene.type.toUpperCase()}`);
      console.log(`   📝 Prompt: ${scene.prompt.substring(0, 80)}...`);
      console.log(`   🎨 Modelo: ${scene.model}`);
      console.log(`   💰 Costo: 60 créditos`);

      this.batch.scenes.push({
        sceneId: scene.id,
        type: scene.type,
        prompt: scene.prompt,
        model: scene.model,
        aspectRatio: scene.aspectRatio,
        resolution: scene.resolution,
        duration: scene.duration,
        originalText: scene.originalText,
        // Parámetros para Magnific MCP
        magnificParams: {
          prompt: scene.prompt,
          aspectRatio: scene.aspectRatio,
          resolution: scene.resolution,
          mode: scene.model,
          count: 1
        },
        estimatedCost: 60
      });

      this.batch.totalCost += 60;
    });

    // Guardar el batch
    const batchFilename = `batch-${this.design.verse.replace(/[:\s]/g, '-')}-${Date.now()}.json`;
    const batchPath = path.join(BATCH_DIR, batchFilename);
    fs.writeFileSync(batchPath, JSON.stringify(this.batch, null, 2));

    console.log(`\n✅ Batch preparado: ${batchFilename}`);
    console.log(`📁 Ruta: ${batchPath}`);
    console.log(`\n💰 Costo Total: ${this.batch.totalCost} créditos (${this.batch.scenes.length} imágenes x 60)`);

    console.log(`\n🎯 Siguiente Paso:`);
    console.log(`   1. Cargar este batch en n8n`);
    console.log(`   2. Para cada escena, llamar a Magnific MCP:`);
    console.log(`      - images_generate con magnificParams`);
    console.log(`      - creations_wait para obtener URLs`);
    console.log(`   3. Guardar identifiers y URLs en metadata`);

    return {
      success: true,
      batchFile: batchFilename,
      batchPath: batchPath,
      totalScenes: this.batch.scenes.length,
      totalCost: this.batch.totalCost
    };
  }
}

/**
 * FUNCIÓN PRINCIPAL
 */
function processBatch(designPath) {
  const generator = new BatchGenerator(designPath);
  return generator.prepareBatch();
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  try {
    // Obtener versículo del argumento CLI
    const verseArg = process.argv[2];

    if (!verseArg) {
      throw new Error('Debes proporcionar el versículo como argumento.\nUso: node agent-3-batch-generator.js "Mateo 11:28"');
    }

    console.log(`\n🔍 Buscando diseño visual para: ${verseArg}\n`);

    // Normalizar el versículo para búsqueda (ej: "Mateo 11:28" → "Mateo-11-28")
    const verseNormalized = verseArg.replace(/[:\s]/g, '-');

    // Buscar diseños que coincidan con el versículo
    const files = fs.readdirSync(DESIGN_DIR)
      .filter(f => f.startsWith('visual-design-PRO-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(DESIGN_DIR, f),
        time: fs.statSync(path.join(DESIGN_DIR, f)).mtime.getTime()
      }))
      .filter(f => f.name.includes(verseNormalized)) // IMPORTANTE: Filtrar por versículo
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      throw new Error(`No se encontró diseño visual para el versículo: ${verseArg}\n` +
                      `Asegúrate de que Agent-2 haya generado el archivo visual-design-PRO-${verseNormalized}-*.json`);
    }

    const latestDesign = files[0];
    console.log(`📂 Diseño encontrado: ${latestDesign.name}`);

    // Verificar que el diseño corresponda al versículo solicitado
    const designData = JSON.parse(fs.readFileSync(latestDesign.path, 'utf-8'));
    if (designData.verse !== verseArg) {
      throw new Error(`Inconsistencia detectada:\n` +
                      `  - Versículo solicitado: ${verseArg}\n` +
                      `  - Versículo en archivo: ${designData.verse}\n` +
                      `Esto es un bug crítico de consistencia.`);
    }

    console.log(`✅ Verificación de consistencia: ${designData.verse} ✓\n`);

    const result = processBatch(latestDesign.path);

    console.log(`\n🎉 Batch completado exitosamente!`);
    console.log(`📋 Archivo listo para n8n: ${result.batchFile}`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error en Agente 3:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { processBatch, BatchGenerator };
