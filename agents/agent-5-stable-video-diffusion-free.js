#!/usr/bin/env node
/**
 * ============================================================================
 * Agent 5: Video Generator (FREE VERSION - Stable Video Diffusion via Replicate)
 * ============================================================================
 *
 * COSTO: $0 USD (Stability AI Community License + Replicate free tier)
 *
 * ALTERNATIVA PAGA: agents/ALTERNATIVES-PAID/agent-5-magnific-mcp.md
 * Magnific cuesta ~45,500 créditos por 5 videos de 13s (~$45.50 USD)
 *
 * Esta versión usa:
 * - Stable Video Diffusion 1.1 (modelo open-source)
 * - Replicate API (free tier: primeros $10 gratis)
 * - Stability AI Community License (GRATIS para empresas <$1M revenue)
 * - Total: ~$0 USD por batch de 5 videos (vs $45.50 con Magnific)
 *
 * ============================================================================
 */

const fs = require('fs').promises;
const path = require('path');
const Replicate = require('replicate');

// Configuración
const IMAGE_METADATA_DIR = path.join(__dirname, '../output/image-metadata');
const SCRIPT_DIR = path.join(__dirname, '../output/scripts');
const VIDEO_METADATA_DIR = path.join(__dirname, '../output/video-metadata');

// Inicializar Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

/**
 * Convierte versículo a formato filename
 */
function verseToFilename(verse) {
  return verse.replace(/\s+/g, '-').replace(/:/g, '-');
}

/**
 * Encuentra el archivo más reciente para un versículo
 */
async function findLatestFile(dir, verseFilename, prefix) {
  const files = await fs.readdir(dir);
  const matching = files
    .filter(f => f.startsWith(`${prefix}-${verseFilename}-`) && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      timestamp: parseInt(f.split('-').pop().replace('.json', ''))
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  return matching.length > 0 ? matching[0].path : null;
}

/**
 * Mapea camera movement del script a motion de SVD
 */
function mapCameraMotion(cameraMovement) {
  const mapping = {
    'slow zoom in': 127,      // More motion
    'zoom in': 127,
    'gentle pan': 100,        // Medium motion
    'pan': 100,
    'slow aerial rise': 127,
    'static close-up': 50,    // Less motion
    'dramatic zoom out': 150, // Maximum motion
    'zoom out': 127
  };

  return mapping[cameraMovement] || 100; // Default: medium motion
}

/**
 * Genera video con Stable Video Diffusion via Replicate
 */
async function generateVideo(imageUrl, duration, motionBucketId = 127) {
  console.log(`  🎬 Generando video con Stable Video Diffusion...`);
  console.log(`  🖼️  Imagen: ${imageUrl.substring(0, 60)}...`);
  console.log(`  ⏱️  Duración estimada: ${duration}s`);
  console.log(`  🎥 Motion: ${motionBucketId}`);

  try {
    // Nota: SVD genera ~3s de video (25 frames @ 6 fps)
    // Para videos más largos, necesitaríamos generar múltiples clips y concatenarlos
    // Por ahora usamos un clip base de 3-5s
    const output = await replicate.run(
      "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
      {
        input: {
          cond_aug: 0.02,
          decoding_t: 14,
          input_image: imageUrl,
          video_length: "14_frames_with_svd",  // ~2.3s @ 6fps
          sizing_strategy: "maintain_aspect_ratio",
          motion_bucket_id: motionBucketId,
          frames_per_second: 6
        }
      }
    );

    console.log(`  ✅ Video generado: ${output.substring(0, 60)}...`);

    return {
      url: output,
      model: 'stable-video-diffusion-1.1',
      resolution: '1024x576',
      aspectRatio: '16:9',
      fps: 6,
      frames: 14,
      durationActual: 2.3, // 14 frames / 6 fps
      credits: 0, // FREE (Community License)
      provider: 'replicate-stability-ai'
    };
  } catch (error) {
    console.error(`  ❌ Error generando video: ${error.message}`);
    throw error;
  }
}

/**
 * Procesa un batch completo
 */
async function processBatch(verse) {
  console.log(`\n🎬 Iniciando Agent 5 (Stable Video Diffusion FREE)...`);
  console.log(`📖 Versículo: ${verse}\n`);

  const verseFilename = verseToFilename(verse);

  // 1. Buscar image metadata
  console.log('📂 Buscando image metadata...');
  const imageMetadataPath = await findLatestFile(IMAGE_METADATA_DIR, verseFilename, 'images');
  if (!imageMetadataPath) {
    throw new Error(`No se encontró image metadata para: ${verse}`);
  }
  console.log(`✅ Encontrado: ${path.basename(imageMetadataPath)}`);

  // 2. Buscar script (para durations y camera movements)
  console.log('📂 Buscando script...');
  const scriptPath = await findLatestFile(SCRIPT_DIR, verseFilename, 'script');
  let scriptData = null;
  if (scriptPath) {
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    scriptData = JSON.parse(scriptContent);
    console.log(`✅ Script encontrado: ${path.basename(scriptPath)}`);
  } else {
    console.log(`⚠️  Script no encontrado, usando defaults`);
  }

  // 3. Leer image metadata
  const imageContent = await fs.readFile(imageMetadataPath, 'utf-8');
  const imageMetadata = JSON.parse(imageContent);

  console.log(`\n📋 Procesando ${imageMetadata.images.length} imágenes\n`);

  // 4. Generar cada video
  const videos = [];
  let totalCredits = 0;

  for (let i = 0; i < imageMetadata.images.length; i++) {
    const image = imageMetadata.images[i];
    console.log(`\n[${i + 1}/${imageMetadata.images.length}] Procesando: ${image.sceneType}`);

    // Encontrar duración y camera movement del script
    let duration = 10; // default
    let cameraMovement = 'gentle pan';
    let motionBucketId = 100;

    if (scriptData && scriptData.scenes) {
      const scene = scriptData.scenes.find(s => s.sceneType === image.sceneType);
      if (scene) {
        duration = scene.duration || 10;
        cameraMovement = scene.cameraMovement || 'gentle pan';
        motionBucketId = mapCameraMotion(cameraMovement);
        console.log(`  📜 Script: ${duration}s, camera: "${cameraMovement}" (motion: ${motionBucketId})`);
      }
    }

    try {
      const result = await generateVideo(image.url, duration, motionBucketId);

      videos.push({
        clipId: i + 1,
        sceneId: i + 1,
        sceneType: image.sceneType,
        duration: result.durationActual,
        scriptDuration: duration,
        cameraMotion: cameraMovement,
        motionBucketId: motionBucketId,
        imageUrl: image.url,
        url: result.url,
        model: result.model,
        resolution: result.resolution,
        aspectRatio: result.aspectRatio,
        fps: result.fps,
        frames: result.frames,
        credits: result.credits,
        provider: result.provider,
        status: 'completed',
        generatedAt: new Date().toISOString()
      });

      totalCredits += result.credits;

      // Pausa entre requests (rate limiting)
      if (i < imageMetadata.images.length - 1) {
        console.log(`  ⏳ Pausa 3s antes de siguiente video...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`  ❌ Error generando video ${i + 1}: ${error.message}`);

      videos.push({
        clipId: i + 1,
        sceneId: i + 1,
        sceneType: image.sceneType,
        imageUrl: image.url,
        url: null,
        status: 'failed',
        error: error.message,
        generatedAt: new Date().toISOString()
      });
    }
  }

  // 5. Guardar metadata
  const timestamp = Date.now();
  const metadataFilename = `videos-completed-${verseFilename}-${timestamp}.json`;
  const metadataPath = path.join(VIDEO_METADATA_DIR, metadataFilename);

  const totalDuration = videos
    .filter(v => v.status === 'completed')
    .reduce((sum, v) => sum + (v.duration || 0), 0);

  const metadata = {
    videoId: path.basename(scriptPath || imageMetadataPath),
    verse: verse,
    category: imageMetadata.category,
    videos: videos,
    generatedAt: new Date().toISOString(),
    provider: 'replicate-stable-video-diffusion',
    model: 'stable-video-diffusion-1.1',
    totalClips: videos.length,
    successfulClips: videos.filter(v => v.status === 'completed').length,
    failedClips: videos.filter(v => v.status === 'failed').length,
    totalDuration: totalDuration,
    totalCredits: totalCredits,
    costUSD: 0 // FREE (Community License <$1M revenue)
  };

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(`\n✅ Metadata guardada en: ${metadataFilename}`);
  console.log(`📊 Resumen:`);
  console.log(`   - Exitosos: ${metadata.successfulClips}/${metadata.totalClips}`);
  console.log(`   - Fallidos: ${metadata.failedClips}/${metadata.totalClips}`);
  console.log(`   - Duración total: ${totalDuration.toFixed(1)}s`);
  console.log(`   - Créditos: ${totalCredits} (FREE)`);
  console.log(`   - Costo: $0 USD`);

  // Exit code
  if (metadata.failedClips > 0) {
    console.error(`\n❌ Algunos videos fallaron`);
    process.exit(1);
  } else {
    console.log(`\n✅ Todos los videos generados exitosamente`);
    process.exit(0);
  }
}

// Ejecutar
const verse = process.argv[2];
if (!verse) {
  console.error('❌ Error: Se requiere el versículo como parámetro');
  console.error('Uso: node agent-5-stable-video-diffusion-free.js "Filipenses 4:13"');
  process.exit(1);
}

if (!process.env.REPLICATE_API_TOKEN) {
  console.error('❌ Error: REPLICATE_API_TOKEN no configurado en .env');
  console.error('');
  console.error('Obtén tu token gratis en: https://replicate.com/account/api-tokens');
  console.error('Luego agrégalo a .env:');
  console.error('  REPLICATE_API_TOKEN=r8_xxx...');
  process.exit(1);
}

processBatch(verse).catch(error => {
  console.error(`\n❌ Error fatal: ${error.message}`);
  process.exit(1);
});
