#!/usr/bin/env node

/**
 * AGENTE 5: VIDEO ANIMATOR v2 (FINAL - Sin duplicados)
 *
 * Anima las imágenes estáticas del Agente 4 usando Magnific Video Generation
 * CAMBIO: NO divide escenas - 1 escena = 1 video (sin duplicados)
 * Usa Kling 3.0 Omni que soporta hasta 15s
 *
 * IMPORTANTE: Este script debe ejecutarse desde Claude Code con acceso a MCP
 */

const fs = require('fs');
const path = require('path');

const IMAGES_METADATA_DIR = path.join(__dirname, '../output/image-metadata');
const VIDEO_METADATA_DIR = path.join(__dirname, '../output/video-metadata');
const VIDEOS_OUTPUT_DIR = path.join(__dirname, '../output/videos');

// Asegurar directorios
[VIDEO_METADATA_DIR, VIDEOS_OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Camera motion mapping por tipo de escena (Kling compatible)
 */
const CAMERA_MOTION_MAP = {
  hook: 'zoom in',          // Zoom in dramático
  verse: 'pan right',       // Pan derecha reverente
  reflection: 'zoom out',   // Zoom out épico
  application: 'zoom in',   // Zoom in íntimo
  cta: 'zoom out'           // Zoom out glorioso
};

/**
 * Generar especificación de video batch (1 video por escena, sin splitting)
 */
async function generateVideoBatch(imageMetadataPath) {
  console.log('🎬 Agente 5: Video Animator v2 (FINAL)');
  console.log('========================================\n');

  // Leer metadata de imágenes
  const imageMetadata = JSON.parse(fs.readFileSync(imageMetadataPath, 'utf-8'));

  console.log(`📖 Video: ${imageMetadata.verse}`);
  console.log(`🎭 Categoría: ${imageMetadata.category}`);
  console.log(`🖼️  Imágenes: ${imageMetadata.scenes.length}`);
  console.log(`🎬 Estilo: ${imageMetadata.cinematicStyle.styleReference}\n`);

  const videoClips = [];

  // Para cada imagen, crear UN SOLO video (sin dividir)
  for (const image of imageMetadata.scenes) {
    const { sceneId, type, identifier, url, duration, prompt } = image;

    console.log(`\n🎬 Escena ${sceneId}: ${type.toUpperCase()} (${duration}s)`);

    const cameraMotion = CAMERA_MOTION_MAP[type] || 'pan right';

    // Limitar duración a 15s (máximo de Kling 3.0 Omni)
    const videoDuration = Math.min(duration, 15);

    if (duration > 15) {
      console.log(`   ⚠️  Duración original ${duration}s excede límite, reducida a 15s`);
    }

    const clip = {
      clipId: sceneId,
      sceneId: sceneId,
      sceneType: type,
      duration: videoDuration,
      imageIdentifier: identifier,
      imageUrl: url,
      cameraMotion: cameraMotion,
      slug: 'kling-omni3',
      aspectRatio: '16:9',
      resolution: '1080p',
      prompt: `Cinematic biblical epic animation. ${prompt.substring(0, 200)}...`,
      magnificParams: {
        slug: 'kling-omni3',
        duration: videoDuration,
        aspectRatio: '16:9',
        resolution: '1080p',
        prompt: `Cinematic biblical epic. Animate the scene with smooth ${cameraMotion} camera motion. Maintain dramatic lighting and atmosphere.`,
        keyframes: {
          start: {
            type: 'image',
            url: url
          }
        }
      }
    };

    videoClips.push(clip);
    console.log(`   ✅ Video único: ${videoDuration}s (${cameraMotion})`);
  }

  // Crear especificación de batch
  const batchSpec = {
    videoId: imageMetadata.videoId,
    verse: imageMetadata.verse,
    category: imageMetadata.category,
    cinematicStyle: imageMetadata.cinematicStyle,
    totalClips: videoClips.length,
    totalDuration: videoClips.reduce((sum, clip) => sum + clip.duration, 0),
    clips: videoClips,
    createdAt: new Date().toISOString()
  };

  // Guardar especificación
  const specFile = `video-${imageMetadata.verse.replace(/[:\s]/g, '-')}-v2-${Date.now()}.json`;
  const specPath = path.join(VIDEO_METADATA_DIR, specFile);
  fs.writeFileSync(specPath, JSON.stringify(batchSpec, null, 2));

  console.log(`\n✅ Especificación de batch creada (SIN DUPLICADOS)`);
  console.log(`📁 ${specPath}`);
  console.log(`\n📊 Resumen:`);
  console.log(`   Total videos: ${batchSpec.totalClips} (1 por escena)`);
  console.log(`   Duración total: ${batchSpec.totalDuration}s (~${Math.floor(batchSpec.totalDuration / 60)}:${batchSpec.totalDuration % 60})`);
  console.log(`   Modelo: Kling 3.0 Omni (hasta 15s por video)`);

  console.log('\n⚠️  SIGUIENTE PASO:');
  console.log('   Desde Claude Code con MCP, ejecutar video_generate para cada clip');
  console.log('   O usar el Agente 5 executor para generación automatizada\n');

  return {
    success: true,
    specFile: specFile,
    specPath: specPath,
    totalClips: batchSpec.totalClips,
    totalDuration: batchSpec.totalDuration
  };
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  try {
    // Buscar metadata de imágenes más reciente
    const files = fs.readdirSync(IMAGES_METADATA_DIR)
      .filter(f => f.startsWith('images-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(IMAGES_METADATA_DIR, f),
        time: fs.statSync(path.join(IMAGES_METADATA_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      throw new Error('No se encontró metadata de imágenes generadas por el Agente 4');
    }

    const latestMetadata = files[0];
    console.log(`\n📂 Metadata encontrada: ${latestMetadata.name}\n`);

    generateVideoBatch(latestMetadata.path).then(result => {
      console.log(`\n🎉 Especificación de video batch completada (SIN DUPLICADOS)!`);
      console.log(`\n📋 Siguiente: Ejecutar video_generate vía MCP para los ${result.totalClips} videos únicos`);
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Error en Agente 5:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { generateVideoBatch };
