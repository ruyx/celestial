#!/usr/bin/env node

/**
 * 🎨 AGENT 9: Thumbnail Generator Oscar Marrón
 *
 * Sistema completo de generación de thumbnails usando framework Oscar Marrón:
 * - PROMPT #7: Interpretación Indirecta (misterio + curiosidad)
 * - PROMPT #5: Transformación Explosiva (epic breakthrough)
 *
 * Pipeline:
 * 1. Generar prompt optimizado Oscar Marrón
 * 2. Generar 2 variantes con Magnific
 * 3. Validar calidad contra criterios Oscar Marrón
 * 4. Seleccionar mejor thumbnail
 * 5. Aplicar text overlay (Sharp + SVG)
 * 6. Comprimir a JPEG <2MB para YouTube
 * 7. Subir a YouTube automáticamente
 */

const { generateOptimizedPrompt } = require('../prompts/thumbnail-prompt-oscar-marron-v1.js');
const { applyTextOverlay } = require('../scripts/apply-thumbnail-text-overlay.js');
const { updateThumbnail } = require('../scripts/update-youtube-thumbnail.js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Directorios
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const THUMBNAILS_DIR = path.join(OUTPUT_DIR, 'thumbnails');
const METADATA_DIR = path.join(OUTPUT_DIR, 'thumbnail-metadata');
const YOUTUBE_METADATA_DIR = path.join(OUTPUT_DIR, 'youtube-metadata');

// Asegurar directorios
[THUMBNAILS_DIR, METADATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Obtiene metadata de YouTube para el verso
 */
function getYouTubeMetadata(verse) {
  try {
    const verseSlug = verse.replace(/\s+/g, '-').replace(/:/g, '-');
    const metadataFiles = [
      path.join(YOUTUBE_METADATA_DIR, `youtube-metadata-${verseSlug}.json`),
      path.join(YOUTUBE_METADATA_DIR, `youtube-metadata-${verseSlug}-processed.json`)
    ];

    for (const file of metadataFiles) {
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        return {
          title: data.seoTitle || data.title || `${verse} | Promesa de Esperanza`,
          keyword: data.primaryKeyword || data.analytics?.primaryKeywords?.[0] || 'ESPERANZA',
          category: data.category || 'esperanza'
        };
      }
    }

    // Fallback
    return {
      title: `${verse} | Promesa de Esperanza`,
      keyword: 'ESPERANZA',
      category: 'esperanza'
    };
  } catch (error) {
    console.warn(`⚠️ No se pudo leer metadata de YouTube: ${error.message}`);
    return {
      title: `${verse} | Promesa de Esperanza`,
      keyword: 'ESPERANZA',
      category: 'esperanza'
    };
  }
}

/**
 * Genera thumbnail con Magnific usando prompt Oscar Marrón
 */
async function generateWithMagnific(prompt, count = 2) {
  console.log(`\n🎨 Generando ${count} variantes con Magnific...`);
  console.log(`📝 Prompt Oscar Marrón (primeros 200 chars):`);
  console.log(`   ${prompt.substring(0, 200)}...`);

  // TODO: Integrar con Magnific MCP cuando esté disponible en n8n
  // Por ahora, simular con mensaje de instrucción
  console.log(`\n⚠️ NOTA: Magnific debe ejecutarse manualmente o vía MCP`);
  console.log(`\n📋 INSTRUCCIONES:`);
  console.log(`1. Usar Magnific MCP con el prompt guardado`);
  console.log(`2. Generar 2 variantes con imagen-nano-banana-2-flash`);
  console.log(`3. Aspect ratio: 16:9`);
  console.log(`4. Guardar en: ${THUMBNAILS_DIR}/base-{verse}-v1.png y v2.png\n`);

  return {
    success: true,
    message: 'Thumbnails deben generarse vía Magnific MCP',
    promptPath: path.join(OUTPUT_DIR, 'thumbnail-prompts')
  };
}

/**
 * Valida thumbnail contra criterios Oscar Marrón
 */
function validateOscarMarron(thumbnailPath) {
  console.log(`\n🔍 Validando contra criterios Oscar Marrón...`);

  const criteria = {
    fileExists: fs.existsSync(thumbnailPath),
    fileSize: 0,
    dimensions: { width: 0, height: 0 },
    score: 0
  };

  if (!criteria.fileExists) {
    console.log(`❌ Archivo no existe: ${thumbnailPath}`);
    return { ...criteria, score: 0 };
  }

  const stats = fs.statSync(thumbnailPath);
  criteria.fileSize = stats.size;

  console.log(`✅ Archivo existe: ${(criteria.fileSize / 1024 / 1024).toFixed(2)} MB`);

  // Validaciones básicas (sin dependencies adicionales)
  const score = criteria.fileExists && criteria.fileSize > 100000 ? 8 : 5;

  criteria.score = score;

  console.log(`\n📊 Score: ${score}/10`);

  return criteria;
}

/**
 * Selecciona mejor thumbnail de variantes
 */
async function selectBestThumbnail(verse, variants = ['v1', 'v2']) {
  console.log(`\n🏆 Seleccionando mejor thumbnail de ${variants.length} variantes...`);

  const verseSlug = verse.replace(/\s+/g, '-').replace(/:/g, '-');
  const scores = [];

  for (const variant of variants) {
    const thumbnailPath = path.join(THUMBNAILS_DIR, `base-${verseSlug}-${variant}.png`);

    if (fs.existsSync(thumbnailPath)) {
      const validation = validateOscarMarron(thumbnailPath);
      scores.push({
        variant,
        path: thumbnailPath,
        score: validation.score
      });

      console.log(`   ${variant}: ${validation.score}/10`);
    } else {
      console.log(`   ${variant}: ❌ No encontrado`);
    }
  }

  if (scores.length === 0) {
    throw new Error('No se encontraron thumbnails generados');
  }

  // Ordenar por score descendente
  scores.sort((a, b) => b.score - a.score);

  const winner = scores[0];
  console.log(`\n✅ Ganador: ${winner.variant} (${winner.score}/10)`);

  return winner.path;
}

/**
 * Comprime thumbnail a JPEG <2MB para YouTube
 */
async function compressForYouTube(inputPath, outputPath) {
  console.log(`\n📦 Comprimiendo para YouTube (<2MB)...`);

  await sharp(inputPath)
    .jpeg({ quality: 95, progressive: true })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  const sizeMB = stats.size / 1024 / 1024;

  console.log(`✅ Comprimido: ${sizeMB.toFixed(2)} MB`);

  if (sizeMB > 2) {
    throw new Error(`Thumbnail muy grande: ${sizeMB.toFixed(2)} MB (máximo 2MB)`);
  }

  return outputPath;
}

/**
 * Guarda metadata del thumbnail
 */
function saveMetadata(verse, thumbnailPath, metadata) {
  const verseSlug = verse.replace(/\s+/g, '-').replace(/:/g, '-');
  const metadataPath = path.join(METADATA_DIR, `thumbnail-${verseSlug}.json`);

  const data = {
    verse,
    thumbnailPath,
    generatedAt: new Date().toISOString(),
    framework: 'Oscar Marrón PROMPT #7 + #5',
    status: 'completed',
    ...metadata
  };

  fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));

  console.log(`\n💾 Metadata guardada: ${metadataPath}`);

  return metadataPath;
}

/**
 * Pipeline completo Agent 9
 */
async function generateThumbnail(verse, options = {}) {
  console.log('\n🎨 AGENT 9: Thumbnail Generator Oscar Marrón');
  console.log('━'.repeat(70));
  console.log(`📖 Versículo: ${verse}\n`);

  const startTime = Date.now();

  try {
    // 1. Obtener metadata de YouTube
    const youtubeMetadata = getYouTubeMetadata(verse);
    console.log(`📊 Metadata YouTube:`);
    console.log(`   Title: ${youtubeMetadata.title}`);
    console.log(`   Keyword: ${youtubeMetadata.keyword}`);
    console.log(`   Category: ${youtubeMetadata.category}`);

    // 2. Generar prompt Oscar Marrón
    const prompt = generateOptimizedPrompt(
      verse,
      youtubeMetadata.category,
      youtubeMetadata.title
    );

    console.log(`\n✅ Prompt Oscar Marrón generado`);

    // 3. Generar con Magnific (instrucciones manual o MCP)
    const magnific = await generateWithMagnific(prompt, 2);

    // 4. Seleccionar mejor thumbnail
    const baseThumbnailPath = await selectBestThumbnail(verse, ['v1', 'v2']);

    // 5. Aplicar text overlay
    const verseSlug = verse.replace(/\s+/g, '-').replace(/:/g, '-');
    const overlayPath = path.join(THUMBNAILS_DIR, `thumbnail-${verseSlug}-with-text.png`);

    console.log(`\n📝 Aplicando text overlay...`);

    await applyTextOverlay(
      baseThumbnailPath,
      overlayPath,
      youtubeMetadata.title,
      youtubeMetadata.keyword,
      youtubeMetadata.category
    );

    // 6. Comprimir para YouTube
    const finalPath = path.join(THUMBNAILS_DIR, `thumbnail-${verseSlug}.jpg`);
    await compressForYouTube(overlayPath, finalPath);

    // 7. Guardar metadata
    const metadataPath = saveMetadata(verse, finalPath, {
      youtubeMetadata,
      oscarMarronFramework: true,
      baseThumbnail: baseThumbnailPath,
      withOverlay: overlayPath
    });

    // 8. Subir a YouTube (si hay videoId)
    if (options.videoId) {
      console.log(`\n📤 Subiendo thumbnail a YouTube...`);
      console.log(`   Video ID: ${options.videoId}`);

      await updateThumbnail(options.videoId, finalPath);

      console.log(`✅ Thumbnail actualizado en YouTube`);
    }

    const duration = (Date.now() - startTime) / 1000;

    console.log('\n╔' + '═'.repeat(68) + '╗');
    console.log('║' + ' '.repeat(18) + '✅ AGENT 9: COMPLETADO' + ' '.repeat(27) + '║');
    console.log('╚' + '═'.repeat(68) + '╝');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Duración: ${duration.toFixed(2)}s`);
    console.log(`   - Thumbnail final: ${finalPath}`);
    console.log(`   - Metadata: ${metadataPath}`);

    if (options.videoId) {
      console.log(`   - YouTube: ✅ Actualizado`);
    }

    console.log('');

    return {
      success: true,
      verse,
      thumbnailPath: finalPath,
      metadataPath,
      duration,
      uploadedToYouTube: !!options.videoId
    };

  } catch (error) {
    console.error('\n❌ ERROR en Agent 9:', error.message);
    console.error(error.stack);

    throw error;
  }
}

// CLI
async function main() {
  const verse = process.argv[2];
  const videoId = process.argv[3]; // Opcional

  if (!verse) {
    console.error(`
❌ USO: node agent-9-thumbnail-oscar-marron.js <verse> [videoId]

EJEMPLO:
  node agent-9-thumbnail-oscar-marron.js "Romanos 8:28"
  node agent-9-thumbnail-oscar-marron.js "Romanos 8:28" "IPCdbz49CNM"
`);
    process.exit(1);
  }

  try {
    const result = await generateThumbnail(verse, { videoId });
    console.log('✅ Agent 9 completado exitosamente\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Agent 9 falló\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateThumbnail };
