#!/usr/bin/env node

/**
 * AGENTE 5: VIDEO ANIMATOR
 *
 * Anima las imágenes estáticas del Agente 4 usando Magnific Video Generation
 * Divide escenas largas en clips cortos (máximo 15s por Seedance 2.0)
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
 * Camera motion mapping por tipo de escena
 */
const CAMERA_MOTION_MAP = {
  hook: 'pushIn',           // Push in dramático
  intro: 'static',          // Estático reverente
  body: 'craneUp',          // Crane up épico
  application: 'pushIn',    // Push in íntimo
  cta: 'craneUp'            // Crane up glorioso
};

/**
 * Variaciones de camera motion para clips secundarios
 */
const CAMERA_VARIATIONS = {
  hook: ['pushIn'],
  intro: ['static', 'tiltDown'],
  body: ['craneUp', 'orbitRight', 'pushIn'],
  application: ['pushIn', 'static'],
  cta: ['craneUp', 'static']
};

/**
 * Dividir duración en clips cortos (máximo 15s por clip)
 */
function splitDuration(totalDuration) {
  const MAX_CLIP_DURATION = 15;
  const clips = [];

  if (totalDuration <= MAX_CLIP_DURATION) {
    clips.push(totalDuration);
  } else {
    const numClips = Math.ceil(totalDuration / MAX_CLIP_DURATION);
    const baseDuration = Math.floor(totalDuration / numClips);
    const remainder = totalDuration % numClips;

    for (let i = 0; i < numClips; i++) {
      const duration = baseDuration + (i < remainder ? 1 : 0);
      clips.push(duration);
    }
  }

  return clips;
}

/**
 * Generar especificación de video batch
 */
async function generateVideoBatch(imageMetadataPath) {
  console.log('🎬 Agente 5: Video Animator');
  console.log('============================\n');

  // Leer metadata de imágenes
  const imageMetadata = JSON.parse(fs.readFileSync(imageMetadataPath, 'utf-8'));

  console.log(`📖 Video: ${imageMetadata.verse}`);
  console.log(`🎭 Categoría: ${imageMetadata.category}`);
  console.log(`🖼️  Imágenes: ${imageMetadata.scenes.length}`);
  console.log(`🎬 Estilo: ${imageMetadata.cinematicStyle.styleReference}\n`);

  const videoClips = [];
  let clipIndex = 1;

  // Para cada imagen, crear clips de video
  for (const image of imageMetadata.scenes) {
    const { sceneId, type, identifier, url, duration } = image;

    console.log(`\n🎬 Escena ${sceneId}: ${type.toUpperCase()} (${duration}s)`);

    // Dividir duración en clips cortos
    const clipDurations = splitDuration(duration);
    const cameraMotions = CAMERA_VARIATIONS[type] || ['static'];

    console.log(`   📊 Clips a generar: ${clipDurations.length}`);

    clipDurations.forEach((clipDuration, idx) => {
      const cameraMotion = cameraMotions[idx] || cameraMotions[0];

      const clip = {
        clipId: clipIndex,
        sceneId: sceneId,
        sceneType: type,
        duration: clipDuration,
        imageIdentifier: identifier,
        imageUrl: url,
        cameraMotion: cameraMotion,
        slug: 'bytedance-seedance-pro-2.0',
        aspectRatio: '16:9',
        resolution: '1080p',
        prompt: `Cinematic biblical epic animation. ${image.prompt.substring(0, 200)}...`,
        magnificParams: {
          slug: 'bytedance-seedance-pro-2.0',
          duration: clipDuration,
          aspectRatio: '16:9',
          resolution: '1080p',
          cameraMotion: cameraMotion,
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
      console.log(`   ✅ Clip ${clipIndex}: ${clipDuration}s (${cameraMotion})`);
      clipIndex++;
    });
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

  // Guardar especificación (nombre compatible con test script)
  const specFile = `video-${imageMetadata.verse.replace(/[:\s]/g, '-')}-${Date.now()}.json`;
  const specPath = path.join(VIDEO_METADATA_DIR, specFile);
  fs.writeFileSync(specPath, JSON.stringify(batchSpec, null, 2));

  console.log(`\n✅ Especificación de batch creada`);
  console.log(`📁 ${specPath}`);
  console.log(`\n📊 Resumen:`);
  console.log(`   Total clips: ${batchSpec.totalClips}`);
  console.log(`   Duración total: ${batchSpec.totalDuration}s (~${Math.floor(batchSpec.totalDuration / 60)}:${batchSpec.totalDuration % 60})`);

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
      console.log(`\n🎉 Especificación de video batch completada!`);
      console.log(`\n📋 Siguiente: Ejecutar video_generate vía MCP para los ${result.totalClips} clips`);
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Error en Agente 5:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { generateVideoBatch, splitDuration };
