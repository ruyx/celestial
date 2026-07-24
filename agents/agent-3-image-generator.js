#!/usr/bin/env node

/**
 * AGENTE 3: GENERADOR DE IMÁGENES CON MAGNIFIC
 *
 * Lee los prompts del Agente 2 y genera las imágenes reales
 * usando Magnific AI MCP
 *
 * Input: visual-design-PRO JSON del Agente 2
 * Output: 5 imágenes + metadata JSON con URLs
 */

const fs = require('fs');
const path = require('path');

// Directorios
const DESIGN_DIR = path.join(__dirname, '../output/image-prompts');
const IMAGES_OUTPUT_DIR = path.join(__dirname, '../output/images');
const METADATA_DIR = path.join(__dirname, '../output/image-metadata');

// Asegurar que existen los directorios
[IMAGES_OUTPUT_DIR, METADATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * GENERADOR DE IMÁGENES
 */
class ImageGenerator {
  constructor(designFile) {
    this.designPath = designFile;
    this.design = JSON.parse(fs.readFileSync(designFile, 'utf-8'));
    this.results = {
      videoId: this.design.videoId,
      verse: this.design.verse,
      category: this.design.category,
      cinematicStyle: this.design.cinematicStyle,
      generatedImages: [],
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generar todas las imágenes para el video
   */
  async generateAllImages() {
    console.log('🎨 Agente 3: Generador de Imágenes con Magnific');
    console.log('==============================================\n');
    console.log(`📖 Video: ${this.design.verse}`);
    console.log(`🎭 Categoría: ${this.design.category}`);
    console.log(`🎬 Escenas a generar: ${this.design.scenes.length}\n`);

    for (const scene of this.design.scenes) {
      await this.generateSceneImage(scene);
    }

    // Guardar metadata de imágenes generadas
    const metadataFilename = `images-metadata-${this.design.verse.replace(/[:\s]/g, '-')}-${Date.now()}.json`;
    const metadataPath = path.join(METADATA_DIR, metadataFilename);
    fs.writeFileSync(metadataPath, JSON.stringify(this.results, null, 2));

    console.log(`\n✅ Metadata guardada: ${metadataFilename}`);
    console.log(`📁 Ruta: ${metadataPath}`);

    return this.results;
  }

  /**
   * Generar imagen para una escena específica
   */
  async generateSceneImage(scene) {
    console.log(`\n🎬 Generando Escena ${scene.id}: ${scene.type.toUpperCase()}`);
    console.log(`📝 Prompt: ${scene.prompt.substring(0, 100)}...`);
    console.log(`🎨 Modelo: ${scene.model}`);
    console.log(`📐 Resolución: ${scene.resolution} - ${scene.aspectRatio}`);

    try {
      // Aquí se llamará al MCP de Magnific
      // Por ahora, simulamos la respuesta
      const imageData = {
        sceneId: scene.id,
        type: scene.type,
        prompt: scene.prompt,
        model: scene.model,
        aspectRatio: scene.aspectRatio,
        resolution: scene.resolution,
        duration: scene.duration,
        // Estos campos se llenarán con la respuesta real de Magnific
        creationIdentifier: null,
        imageUrl: null,
        thumbnailUrl: null,
        status: 'pending',
        generatedAt: new Date().toISOString()
      };

      this.results.generatedImages.push(imageData);

      console.log(`   ⏳ Imagen en cola - ID: ${scene.id}`);

    } catch (error) {
      console.error(`   ❌ Error generando imagen: ${error.message}`);
      this.results.generatedImages.push({
        sceneId: scene.id,
        type: scene.type,
        error: error.message,
        status: 'failed'
      });
    }
  }
}

/**
 * FUNCIÓN PRINCIPAL
 */
async function processDesign(designPath) {
  const generator = new ImageGenerator(designPath);
  const results = await generator.generateAllImages();

  console.log(`\n🎯 Resumen:`);
  console.log(`   Total imágenes: ${results.generatedImages.length}`);
  console.log(`   Video: ${results.verse}`);
  console.log(`   Estilo: ${results.cinematicStyle.styleReference}`);

  return results;
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  (async () => {
    try {
      // Buscar el diseño visual más reciente
      const files = fs.readdirSync(DESIGN_DIR)
        .filter(f => f.startsWith('visual-design-PRO-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(DESIGN_DIR, f),
          time: fs.statSync(path.join(DESIGN_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length === 0) {
        throw new Error('No se encontró ningún diseño visual para procesar');
      }

      const latestDesign = files[0];
      console.log(`\n📂 Diseño encontrado: ${latestDesign.name}\n`);

      const results = await processDesign(latestDesign.path);

      console.log(`\n🎉 Generación de imágenes completada!`);
      console.log(`\n📋 Siguiente paso: Integrar con Magnific MCP para generar imágenes reales`);

      process.exit(0);

    } catch (error) {
      console.error('\n❌ Error en Agente 3:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  })();
}

module.exports = { processDesign, ImageGenerator };
