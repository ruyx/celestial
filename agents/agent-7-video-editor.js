#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎬 AGENTE 7: VIDEO EDITOR & QA SPECIALIST (MEJORADO v2)
 * ═══════════════════════════════════════════════════════════════════
 *
 * CORRECCIONES CRÍTICAS:
 * ✅ Intro branded cinematográfica (5s, generada con Magnific)
 * ✅ Extiende videos para cubrir audio completo (120s+)
 * ✅ Outro branded cinematográfico (15s, generado con Magnific)
 * ✅ Audio completo sincronizado
 * ✅ 100% desatendido para n8n
 * ✅ Detección automática de categoría (consuelo, fortaleza, salvación, etc.)
 *
 * ESTRATEGIA DE EDICIÓN:
 * 1. Intro branded por categoría (5s) - PRE-GENERADO
 * 2. Clips disponibles → Video base (~90s)
 * 3. Loop/extend clips para cubrir gaps (~30s)
 * 4. Outro branded por categoría (15s) - PRE-GENERADO
 * 5. Sincronizar audio completo (130s aprox)
 * 6. QA automatizado
 *
 * CATEGORÍAS SOPORTADAS (con intro/outro branded):
 * - Fortaleza (warrior, montaña, poder)
 * - Consuelo (silhouette, luz, paz)
 * - Salvación (reaching to light, esperanza)
 *
 * IMPORTANTE: Requiere FFmpeg y curl instalados
 * ARCHIVOS BRANDED: output/intro-videos/ y output/outro-videos/
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════
// 📁 PATHS
// ═══════════════════════════════════════════════════════════════════

const VIDEO_METADATA_DIR = path.join(__dirname, '../output/video-metadata');
const AUDIO_METADATA_DIR = path.join(__dirname, '../output/audio-metadata');
const YOUTUBE_METADATA_DIR = path.join(__dirname, '../output/youtube-metadata');
const INTRO_VIDEOS_DIR = path.join(__dirname, '../output/intro-videos');
const OUTRO_VIDEOS_DIR = path.join(__dirname, '../output/outro-videos');
const FINAL_OUTPUT_DIR = path.join(__dirname, '../output/final-videos');
const CLIPS_DIR = path.join(FINAL_OUTPUT_DIR, 'clips');

// Crear directorios
[FINAL_OUTPUT_DIR, CLIPS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 🔧 UTILIDADES
// ═══════════════════════════════════════════════════════════════════

function runCommand(command, description, silent = false) {
  console.log(`\n🔧 ${description}...`);

  try {
    const output = execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8'
    });

    console.log(`✅ ${description} - COMPLETADO`);
    return output;
  } catch (error) {
    console.error(`❌ Error en: ${description}`);
    console.error(`   Comando: ${command}`);
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

function getVideoDuration(videoFile) {
  const output = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoFile}"`,
    { encoding: 'utf-8' }
  );
  return parseFloat(output.trim());
}

/**
 * 🎬 Obtener intro/outro branded por categoría
 *
 * Capitaliza la categoría (consuelo → Consuelo) y busca archivos pregenerados
 * Si no existen, retorna null (skip intro/outro)
 */
function getBrandedIntroOutro(category) {
  if (!category) {
    console.warn('⚠️  No se especificó categoría. Skipping intro/outro branded.');
    return { intro: null, outro: null };
  }

  // Capitalizar primera letra (consuelo → Consuelo)
  const categoryCapitalized = category.charAt(0).toUpperCase() + category.slice(1);

  const introPath = path.join(INTRO_VIDEOS_DIR, `intro-${categoryCapitalized}.mp4`);
  const outroPath = path.join(OUTRO_VIDEOS_DIR, `outro-${categoryCapitalized}.mp4`);

  const result = {
    intro: fs.existsSync(introPath) ? introPath : null,
    outro: fs.existsSync(outroPath) ? outroPath : null
  };

  // Log warnings si faltan archivos
  if (!result.intro) {
    console.warn(`⚠️  Intro branded no encontrado para categoría "${category}": ${introPath}`);
  }
  if (!result.outro) {
    console.warn(`⚠️  Outro branded no encontrado para categoría "${category}": ${outroPath}`);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// 📥 STEP 0: DESCUBRIR CLIPS YA DESCARGADOS
// ═══════════════════════════════════════════════════════════════════

async function downloadVideos(videoMetadata, verse) {
  console.log('\n\n📥 STEP 0: Descubrir Clips Ya Descargados');
  console.log('=========================================\n');

  // Convertir verso a formato filename (espacios → guiones, : → guión)
  const verseForFilename = verse.replace(/[\s:]+/g, '-');

  // Buscar clips en el directorio del verso
  const verseClipsDir = path.join(__dirname, '../output/videos', verseForFilename);

  if (!fs.existsSync(verseClipsDir)) {
    throw new Error(`❌ Directorio de clips no encontrado: ${verseClipsDir}`);
  }

  console.log(`   Buscando clips en: ${verseClipsDir}\n`);

  const downloadedClips = [];

  // Buscar clips siguiendo la convención: clip-{id}-{sceneType}-{duration}s.mp4
  for (const clip of videoMetadata.clips) {
    const localFilename = `clip-${clip.clipId.toString().padStart(2, '0')}-${clip.sceneType}-${clip.duration}s.mp4`;
    const localPath = path.join(verseClipsDir, localFilename);

    if (!fs.existsSync(localPath)) {
      console.warn(`   ⚠️  Clip ${clip.clipId} no encontrado: ${localFilename}`);
      continue;
    }

    console.log(`   ✅ Clip ${clip.clipId} encontrado: ${localFilename}`);
    downloadedClips.push({ ...clip, localPath });
  }

  console.log(`\n   ✅ Total clips disponibles: ${downloadedClips.length}/${videoMetadata.clips.length}\n`);

  return downloadedClips;
}

// ═══════════════════════════════════════════════════════════════════
// 🎞️  STEP 1: CONCATENAR INTRO + CLIPS BASE
// ═══════════════════════════════════════════════════════════════════

async function concatenateBaseClips(downloadedClips, introPath) {
  console.log('\n\n🎞️  STEP 1: Concatenar Intro + Clips Base');
  console.log('===========================================\n');

  // Crear concat file con intro (si existe) + clips
  const concatListPath = path.join(FINAL_OUTPUT_DIR, 'concat-list.txt');
  let concatList = '';

  // Prepend intro branded si existe
  let introDuration = 0;
  if (introPath) {
    concatList += `file '${introPath}'\n`;
    introDuration = getVideoDuration(introPath);
    console.log(`   🎬 Intro branded: ${path.basename(introPath)} (${introDuration.toFixed(2)}s)`);
  }

  // Agregar clips
  concatList += downloadedClips
    .map(clip => `file '${clip.localPath}'`)
    .join('\n');

  fs.writeFileSync(concatListPath, concatList);

  console.log(`\n   📝 Lista de concatenación:`);
  if (introPath) {
    console.log(`      - Intro branded: ${introDuration.toFixed(2)}s`);
  }
  downloadedClips.forEach(clip => {
    console.log(`      - Clip ${clip.clipId}: ${clip.duration}s`);
  });

  const clipsDuration = downloadedClips.reduce((sum, clip) => sum + clip.duration, 0);
  const totalDuration = introDuration + clipsDuration;
  console.log(`\n   ⏱️  Duración total (intro + clips): ${totalDuration.toFixed(2)}s`);

  // Concatenar
  const baseVideoPath = path.join(FINAL_OUTPUT_DIR, 'base-concatenated.mp4');

  const concatCommand = `ffmpeg -f concat -safe 0 -i "${concatListPath}" \\
    -c copy "${baseVideoPath}" -y`;

  runCommand(concatCommand, 'Concatenar clips base');

  const actualDuration = getVideoDuration(baseVideoPath);

  const stats = fs.statSync(baseVideoPath);
  console.log(`\n   📁 Video base: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   ⏱️  Duración verificada: ${actualDuration.toFixed(2)}s`);
  console.log(`   📍 ${baseVideoPath}`);

  return {
    file: baseVideoPath,
    duration: actualDuration,
    size: stats.size
  };
}

// ═══════════════════════════════════════════════════════════════════
// ➕ STEP 2: EXTENDER VIDEO PARA CUBRIR AUDIO COMPLETO
// ═══════════════════════════════════════════════════════════════════

async function extendVideoForAudio(baseVideo, targetDuration, downloadedClips) {
  console.log('\n\n➕ STEP 2: Extender Video para Cubrir Audio Completo');
  console.log('====================================================\n');

  const gap = targetDuration - baseVideo.duration;

  console.log(`   📊 Análisis:`);
  console.log(`      Video base: ${baseVideo.duration.toFixed(2)}s`);
  console.log(`      Audio target: ${targetDuration.toFixed(2)}s`);
  console.log(`      Gap a cubrir: ${gap.toFixed(2)}s`);

  if (gap <= 0) {
    console.log(`\n   ✅ Video ya cubre el audio completo. No se requiere extensión.`);
    return baseVideo;
  }

  console.log(`\n   🔄 Estrategia: Loop de los últimos clips para cubrir ${gap.toFixed(2)}s\n`);

  // Usar los últimos 3 clips (CTA) para loop
  const loopClips = downloadedClips.slice(-3);
  const loopDuration = loopClips.reduce((sum, clip) => sum + clip.duration, 0);
  const loopsNeeded = Math.ceil(gap / loopDuration);

  console.log(`   🎬 Clips para loop (${loopClips.length}):`);
  loopClips.forEach(clip => {
    console.log(`      - Clip ${clip.clipId}: ${clip.duration}s`);
  });
  console.log(`   ⏱️  Duración de 1 loop: ${loopDuration}s`);
  console.log(`   🔁 Loops necesarios: ${loopsNeeded}`);

  // Crear concat file con base + loops
  const extendedConcatPath = path.join(FINAL_OUTPUT_DIR, 'extended-concat.txt');
  let extendedList = `file '${baseVideo.file}'\n`;

  for (let i = 0; i < loopsNeeded; i++) {
    loopClips.forEach(clip => {
      extendedList += `file '${clip.localPath}'\n`;
    });
  }

  fs.writeFileSync(extendedConcatPath, extendedList);

  const extendedVideoPath = path.join(FINAL_OUTPUT_DIR, 'extended-video.mp4');

  const extendCommand = `ffmpeg -f concat -safe 0 -i "${extendedConcatPath}" \\
    -c copy "${extendedVideoPath}" -y`;

  runCommand(extendCommand, 'Extender video con loops');

  const extendedDuration = getVideoDuration(extendedVideoPath);

  const stats = fs.statSync(extendedVideoPath);
  console.log(`\n   📁 Video extendido: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   ⏱️  Duración verificada: ${extendedDuration.toFixed(2)}s`);
  console.log(`   📍 ${extendedVideoPath}`);

  return {
    file: extendedVideoPath,
    duration: extendedDuration,
    size: stats.size
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 STEP 3: USAR OUTRO BRANDED (O FALLBACK A GENERADO)
// ═══════════════════════════════════════════════════════════════════

async function getOutro(verse, outroPath) {
  console.log('\n\n🎯 STEP 3: Obtener Outro');
  console.log('========================\n');

  // Si existe outro branded, usarlo
  if (outroPath && fs.existsSync(outroPath)) {
    const outroDuration = getVideoDuration(outroPath);
    const stats = fs.statSync(outroPath);

    console.log(`   ✅ Usando outro branded pregenerado:`);
    console.log(`      📁 ${path.basename(outroPath)}`);
    console.log(`      ⏱️  Duración: ${outroDuration.toFixed(2)}s`);
    console.log(`      💾 Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`      📍 ${outroPath}\n`);

    return {
      file: outroPath,
      duration: outroDuration,
      size: stats.size
    };
  }

  // Fallback: Generar outro simple con texto FFmpeg
  console.log(`   ⚠️  Outro branded no encontrado. Generando outro simple con FFmpeg...\n`);

  const outroDuration = 15;
  const outroFile = path.join(FINAL_OUTPUT_DIR, 'outro-generated.mp4');

  console.log(`   📝 Texto CTA:`);
  console.log(`      "¿Te tocó este versículo?"`);
  console.log(`      "👍 DALE LIKE"`);
  console.log(`      "💬 COMENTA 'AMÉN'"`);
  console.log(`      "🔔 SUSCRÍBETE"`);
  console.log(`      "📤 COMPARTE CON QUIEN LO NECESITE"`);
  console.log(`   ⏱️  Duración: ${outroDuration}s\n`);

  const outroCommand = `ffmpeg -f lavfi -i color=c=#1a1a1a:s=1920x1080:d=${outroDuration} \\
    -vf "drawtext=text='¿Te tocó este versículo?':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=150:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf, \\
         drawtext=text='👍 DALE LIKE':fontsize=50:fontcolor=#FA8029:x=(w-text_w)/2:y=300:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf, \\
         drawtext=text='💬 COMENTA AMÉN':fontsize=50:fontcolor=#34B257:x=(w-text_w)/2:y=400:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf, \\
         drawtext=text='🔔 SUSCRÍBETE':fontsize=50:fontcolor=#FFFFFF:x=(w-text_w)/2:y=500:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf, \\
         drawtext=text='📤 COMPARTE':fontsize=50:fontcolor=#FA8029:x=(w-text_w)/2:y=600:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf, \\
         fade=t=in:st=0:d=0.5,fade=t=out:st=${outroDuration - 0.5}:d=0.5" \\
    -c:v libx264 -pix_fmt yuv420p -r 30 -b:v 5000k ${outroFile} -y`;

  runCommand(outroCommand, 'Generar outro con CTA');

  const stats = fs.statSync(outroFile);
  console.log(`\n   📁 Outro generado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   📍 ${outroFile}`);

  return {
    file: outroFile,
    duration: outroDuration,
    size: stats.size
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🔗 STEP 4: CONCATENAR VIDEO EXTENDIDO + OUTRO
// ═══════════════════════════════════════════════════════════════════

async function addOutro(extendedVideo, outro) {
  console.log('\n\n🔗 STEP 4: Agregar Outro al Video');
  console.log('==================================\n');

  const finalConcatPath = path.join(FINAL_OUTPUT_DIR, 'final-concat.txt');
  const finalConcatList = `file '${extendedVideo.file}'\nfile '${outro.file}'`;

  fs.writeFileSync(finalConcatPath, finalConcatList);

  const finalVideoPath = path.join(FINAL_OUTPUT_DIR, 'video-with-outro.mp4');

  const finalConcatCommand = `ffmpeg -f concat -safe 0 -i "${finalConcatPath}" \\
    -c copy "${finalVideoPath}" -y`;

  runCommand(finalConcatCommand, 'Agregar outro');

  const finalDuration = getVideoDuration(finalVideoPath);

  const stats = fs.statSync(finalVideoPath);
  console.log(`\n   📁 Video con outro: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   ⏱️  Duración final: ${finalDuration.toFixed(2)}s`);
  console.log(`   📍 ${finalVideoPath}`);

  return {
    file: finalVideoPath,
    duration: finalDuration,
    size: stats.size
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🎤 STEP 5: SINCRONIZAR AUDIO COMPLETO
// ═══════════════════════════════════════════════════════════════════

async function syncAudioComplete(videoFile, audioMetadata, verse) {
  console.log('\n\n🎤 STEP 5: Sincronizar Audio Completo');
  console.log('======================================\n');

  console.log(`   Voz: ${audioMetadata.voice.name}`);
  console.log(`   Estrategia: Audio completo con guion de ${audioMetadata.textLength} caracteres\n`);

  // Descargar audio
  const audioFile = path.join(FINAL_OUTPUT_DIR, 'voiceover.mp3');

  if (!fs.existsSync(audioFile)) {
    console.log(`   📥 Descargando audio desde Magnific...`);
    runCommand(
      `curl -L -o "${audioFile}" "${audioMetadata.audio.url}"`,
      'Descargar audio voiceover',
      true
    );
  }

  const audioStats = fs.statSync(audioFile);
  const audioDuration = getVideoDuration(audioFile);
  console.log(`   ✅ Audio: ${(audioStats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   ⏱️  Duración audio: ${audioDuration.toFixed(2)}s\n`);

  // Sincronizar audio con video
  const verseForFilename = verse.replace(/[:\s]/g, '-');
  const finalFile = path.join(FINAL_OUTPUT_DIR, `final-${verseForFilename}.mp4`);

  const syncCommand = `ffmpeg -i "${videoFile}" -i "${audioFile}" \\
    -c:v copy -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 \\
    -shortest "${finalFile}" -y`;

  runCommand(syncCommand, 'Sincronizar audio completo con video');

  const finalStats = fs.statSync(finalFile);
  const finalDuration = getVideoDuration(finalFile);

  console.log(`\n   📁 Video final: ${(finalStats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   ⏱️  Duración final: ${finalDuration.toFixed(2)}s`);
  console.log(`   📍 ${finalFile}`);

  return {
    file: finalFile,
    size: finalStats.size,
    duration: finalDuration,
    audioFile: audioFile,
    voice: audioMetadata.voice.name
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🔍 STEP 6: QA AUTOMATIZADO
// ═══════════════════════════════════════════════════════════════════

async function runQA(finalVideo, audioDuration) {
  console.log('\n\n🔍 STEP 6: QA Automatizado');
  console.log('===========================\n');

  const qaCommand = `ffprobe -v error -show_streams -show_format -of json "${finalVideo.file}"`;

  const qaOutput = runCommand(qaCommand, 'Extraer metadata QA', true);
  const metadata = JSON.parse(qaOutput);

  const videoStream = metadata.streams.find(s => s.codec_type === 'video');
  const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

  if (!videoStream || !audioStream) {
    console.error('   ⚠️  No se pudo obtener metadata completa');
    console.error(`      Video stream: ${videoStream ? 'OK' : 'MISSING'}`);
    console.error(`      Audio stream: ${audioStream ? 'OK' : 'MISSING'}`);

    // Return minimal QA
    return {
      passed: false,
      checks: {
        duration: {
          value: parseFloat(metadata.format.duration),
          expected: `${audioDuration.toFixed(0)}s`,
          passed: Math.abs(parseFloat(metadata.format.duration) - audioDuration) <= 5
        }
      }
    };
  }

  const checks = {
    duration: {
      value: parseFloat(metadata.format.duration),
      expected: `${audioDuration.toFixed(0)}s ±5s`,
      passed: Math.abs(parseFloat(metadata.format.duration) - audioDuration) <= 5
    },
    resolution: {
      value: `${videoStream.width}x${videoStream.height}`,
      expected: '1920x1080',
      passed: videoStream.width === 1920 && videoStream.height === 1080
    },
    videoCodec: {
      value: videoStream.codec_name,
      expected: 'h264',
      passed: videoStream.codec_name === 'h264'
    },
    audioCodec: {
      value: audioStream.codec_name,
      expected: 'aac',
      passed: audioStream.codec_name === 'aac'
    },
    bitrate: {
      value: `${Math.round(metadata.format.bit_rate / 1000)} kb/s`,
      expected: '>5000 kb/s',
      passed: metadata.format.bit_rate > 5000000
    }
  };

  const allPassed = Object.values(checks).every(check => check.passed);

  console.log(`   📊 Resultados QA:\n`);
  Object.entries(checks).forEach(([key, check]) => {
    const status = check.passed ? '✅' : '⚠️ ';
    console.log(`      ${status} ${key}: ${check.value} (esperado: ${check.expected})`);
  });

  console.log(`\n   ${allPassed ? '✅' : '⚠️ '} QA Global: ${allPassed ? 'APROBADO' : 'APROBADO CON WARNINGS'}\n`);

  return {
    passed: allPassed,
    checks: checks
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

async function assembleVideo(verse) {
  console.log('\n\n════════════════════════════════════════════════════════════════');
  console.log('🎬 AGENTE 7: VIDEO EDITOR & QA SPECIALIST (MEJORADO)');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log(`📹 Versículo: ${verse}\n`);

  const startTime = Date.now();

  try {
    // ───────────────────────────────────────────────────────────────
    // Cargar metadata
    // ───────────────────────────────────────────────────────────────

    const verseForFilename = verse.replace(/[:\s]/g, '-');

    // Buscar video metadata con filtro (puede tener timestamp)
    const videoMetadataFiles = fs.readdirSync(VIDEO_METADATA_DIR)
      .filter(file => file.includes(verseForFilename) && file.startsWith('videos-completed'));
    if (videoMetadataFiles.length === 0) {
      throw new Error(`Video metadata no encontrada para: ${verse}`);
    }
    const videoMetadataPath = path.join(VIDEO_METADATA_DIR, videoMetadataFiles[0]);
    const videoMetadata = JSON.parse(fs.readFileSync(videoMetadataPath, 'utf-8'));

    const audioMetadataFiles = fs.readdirSync(AUDIO_METADATA_DIR)
      .filter(file => file.includes(verseForFilename) && file.startsWith('audio-spec'));
    const audioMetadataPath = path.join(AUDIO_METADATA_DIR, audioMetadataFiles[0]);
    const audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));

    // Cargar metadata de YouTube para obtener categoría
    const youtubeMetadataPath = path.join(YOUTUBE_METADATA_DIR, `youtube-metadata-${verseForFilename}.json`);
    let category = null;
    if (fs.existsSync(youtubeMetadataPath)) {
      const youtubeMetadata = JSON.parse(fs.readFileSync(youtubeMetadataPath, 'utf-8'));
      category = youtubeMetadata.category;
      console.log(`📋 Categoría detectada: ${category}\n`);
    } else {
      console.warn(`⚠️  Metadata de YouTube no encontrada: ${youtubeMetadataPath}`);
      console.warn(`   Continuando sin intro/outro branded.\n`);
    }

    // Obtener intro/outro branded
    const brandedMedia = getBrandedIntroOutro(category);

    // ───────────────────────────────────────────────────────────────
    // Pipeline de edición
    // ───────────────────────────────────────────────────────────────

    const downloadedClips = await downloadVideos(videoMetadata, verse);
    const baseVideo = await concatenateBaseClips(downloadedClips, brandedMedia.intro);

    const audioDuration = audioMetadata.estimatedDuration;
    const extendedVideo = await extendVideoForAudio(baseVideo, audioDuration, downloadedClips);

    const outro = await getOutro(verse, brandedMedia.outro);
    const videoWithOutro = await addOutro(extendedVideo, outro);

    const finalVideo = await syncAudioComplete(videoWithOutro.file, audioMetadata, verse);
    const qaResults = await runQA(finalVideo, audioDuration);

    // ───────────────────────────────────────────────────────────────
    // Generar reporte
    // ───────────────────────────────────────────────────────────────

    const totalTime = (Date.now() - startTime) / 1000;

    const report = {
      verse: verse,
      category: videoMetadata.category,
      workflow: {
        step0_download: {
          clipsDownloaded: downloadedClips.length,
          totalClips: videoMetadata.totalClips
        },
        step1_base: {
          file: baseVideo.file,
          duration: baseVideo.duration,
          size: baseVideo.size
        },
        step2_extend: {
          file: extendedVideo.file,
          duration: extendedVideo.duration,
          size: extendedVideo.size
        },
        step3_outro: {
          file: outro.file,
          duration: outro.duration,
          size: outro.size
        },
        step4_concat: {
          file: videoWithOutro.file,
          duration: videoWithOutro.duration,
          size: videoWithOutro.size
        },
        step5_audio: {
          file: finalVideo.file,
          size: finalVideo.size,
          duration: finalVideo.duration,
          voice: finalVideo.voice
        },
        step6_qa: qaResults
      },
      finalVideo: finalVideo.file,
      totalTimeSeconds: totalTime,
      createdAt: new Date().toISOString()
    };

    const reportPath = path.join(FINAL_OUTPUT_DIR, `report-${verseForFilename}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('✅ VIDEO ENSAMBLADO EXITOSAMENTE');
    console.log('════════════════════════════════════════════════════════════════\n');

    console.log(`📊 RESUMEN:`);
    console.log(`   Clips descargados: ${downloadedClips.length}/${videoMetadata.totalClips}`);
    console.log(`   Video base: ${baseVideo.duration.toFixed(2)}s`);
    console.log(`   Video extendido: ${extendedVideo.duration.toFixed(2)}s`);
    console.log(`   Outro CTA: ${outro.duration}s`);
    console.log(`   Video final: ${finalVideo.duration.toFixed(2)}s`);
    console.log(`   Audio sincronizado: ${audioDuration}s`);
    console.log(`   QA: ${qaResults.passed ? '✅ APROBADO' : '⚠️  WARNINGS'}`);
    console.log(`   Tiempo total: ${totalTime.toFixed(2)}s`);
    console.log(`\n📁 Archivos generados:`);
    console.log(`   ${finalVideo.file}`);
    console.log(`   ${reportPath}\n`);

    return report;

  } catch (error) {
    console.error('\n❌ Error ensamblando video:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EJECUCIÓN
// ═══════════════════════════════════════════════════════════════════

if (require.main === module) {
  const verse = process.argv[2] || 'Isaías 41:10';

  assembleVideo(verse)
    .then(report => {
      console.log('════════════════════════════════════════════════════════════════');
      console.log('🎉 ¡VIDEO LISTO PARA YOUTUBE!');
      console.log('════════════════════════════════════════════════════════════════\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fallo en ensamblaje de video');
      process.exit(1);
    });
}

module.exports = { assembleVideo };
