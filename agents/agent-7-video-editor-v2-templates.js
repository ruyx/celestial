#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎬 AGENTE 7: VIDEO EDITOR & QA SPECIALIST (CON TEMPLATES)
 * ═══════════════════════════════════════════════════════════════════
 *
 * VERSIÓN CON TEMPLATES CINEMATOGRÁFICOS:
 * ✅ Intro cinematográfico (5s) - Generado con Magnific/Seedance
 * ✅ Clips de contenido (~90s) - Descargados de Magnific
 * ✅ Outro cinematográfico (15s) - Generado con Magnific/Seedance
 * ✅ Audio completo sincronizado (120s)
 * ✅ 100% desatendido para n8n
 *
 * ESTRATEGIA DE EDICIÓN CON TEMPLATES:
 * 1. Cargar intro cinematográfico (template pre-generado)
 * 2. Clips disponibles → Video base (~90s)
 * 3. Loop/extend clips para cubrir gaps
 * 4. Cargar outro cinematográfico (template pre-generado)
 * 5. Concatenar: intro + clips + outro
 * 6. Sincronizar audio completo (120s)
 * 7. QA automatizado
 *
 * TEMPLATES POR CATEGORÍA:
 * - fortaleza: Epic warrior, flames, Mad Max intensity
 * - consuelo: Gentle light, peaceful rain, comfort
 * - salvación: Light breaking storm, radiant gateway
 *
 * PREREQUISITO: Templates deben estar en output/final-videos/
 *   - intro-template.mp4 (preparado por agent-7-with-templates.js)
 *   - outro-template.mp4 (preparado por agent-7-with-templates.js)
 *
 * IMPORTANTE: Requiere FFmpeg y curl instalados
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

// ═══════════════════════════════════════════════════════════════════
// 📥 STEP 0: DESCARGAR CLIPS
// ═══════════════════════════════════════════════════════════════════

async function downloadVideos(videoMetadata) {
  console.log('\n\n📥 STEP 0: Descargar Videos');
  console.log('============================\n');

  const completedClips = videoMetadata.clips.filter(clip => clip.status === 'completed');

  console.log(`   Total clips a descargar: ${completedClips.length}`);
  console.log(`   Destino: ${CLIPS_DIR}\n`);

  const downloadedClips = [];

  for (const clip of completedClips) {
    const localFilename = `clip-${clip.clipId.toString().padStart(2, '0')}.mp4`;
    const localPath = path.join(CLIPS_DIR, localFilename);

    if (fs.existsSync(localPath)) {
      console.log(`   ⏭️  Clip ${clip.clipId} ya descargado: ${localFilename}`);
      downloadedClips.push({ ...clip, localPath });
      continue;
    }

    console.log(`   📥 Descargando clip ${clip.clipId}/${completedClips.length}...`);

    try {
      runCommand(
        `curl -L -o "${localPath}" "${clip.url}"`,
        `Descargar clip ${clip.clipId}`,
        true
      );

      const stats = fs.statSync(localPath);
      console.log(`      ✅ Descargado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      downloadedClips.push({ ...clip, localPath });

    } catch (error) {
      console.error(`      ❌ Error descargando clip ${clip.clipId}:`, error.message);
      throw error;
    }
  }

  console.log(`\n   ✅ Total descargados: ${downloadedClips.length} clips`);

  return downloadedClips;
}

// ═══════════════════════════════════════════════════════════════════
// 🎞️  STEP 1: CONCATENAR CLIPS BASE
// ═══════════════════════════════════════════════════════════════════

async function concatenateBaseClips(downloadedClips) {
  console.log('\n\n🎞️  STEP 1: Concatenar Clips Base');
  console.log('==================================\n');

  // Crear concat file
  const concatListPath = path.join(FINAL_OUTPUT_DIR, 'concat-list.txt');
  const concatList = downloadedClips
    .map(clip => `file '${clip.localPath}'`)
    .join('\n');

  fs.writeFileSync(concatListPath, concatList);

  console.log(`   📝 Lista de concatenación:`);
  downloadedClips.forEach(clip => {
    console.log(`      - Clip ${clip.clipId}: ${clip.duration}s`);
  });

  const totalDuration = downloadedClips.reduce((sum, clip) => sum + clip.duration, 0);
  console.log(`\n   ⏱️  Duración total base: ${totalDuration}s`);

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
// 🎬 STEP 2.5: OBTENER INTRO CINEMATOGRÁFICO (TEMPLATE)
// ═══════════════════════════════════════════════════════════════════

async function getIntro() {
  console.log('\n\n🎬 STEP 2.5: Obtener Intro Cinematográfico');
  console.log('==========================================\n');

  const introTemplatePath = path.join(FINAL_OUTPUT_DIR, 'intro-template.mp4');

  if (!fs.existsSync(introTemplatePath)) {
    throw new Error(
      `❌ Template de intro no encontrado: ${introTemplatePath}\n` +
      `   Ejecuta primero: node agents/agent-7-with-templates.js "${verse}"`
    );
  }

  const introDuration = getVideoDuration(introTemplatePath);
  const stats = fs.statSync(introTemplatePath);

  console.log(`   ✅ Intro cinematográfico cargado`);
  console.log(`   📁 Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   ⏱️  Duración: ${introDuration.toFixed(2)}s`);
  console.log(`   📍 ${introTemplatePath}`);

  return {
    file: introTemplatePath,
    duration: introDuration,
    size: stats.size
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 STEP 4: OBTENER OUTRO CINEMATOGRÁFICO (TEMPLATE)
// ═══════════════════════════════════════════════════════════════════

async function getOutro() {
  console.log('\n\n🎯 STEP 4: Obtener Outro Cinematográfico');
  console.log('=========================================\n');

  const outroTemplatePath = path.join(FINAL_OUTPUT_DIR, 'outro-template.mp4');

  if (!fs.existsSync(outroTemplatePath)) {
    throw new Error(
      `❌ Template de outro no encontrado: ${outroTemplatePath}\n` +
      `   Ejecuta primero: node agents/agent-7-with-templates.js "${verse}"`
    );
  }

  const outroDuration = getVideoDuration(outroTemplatePath);
  const stats = fs.statSync(outroTemplatePath);

  console.log(`   ✅ Outro cinematográfico cargado`);
  console.log(`   📁 Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   ⏱️  Duración: ${outroDuration.toFixed(2)}s`);
  console.log(`   📍 ${outroTemplatePath}`);

  return {
    file: outroTemplatePath,
    duration: outroDuration,
    size: stats.size
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🔗 STEP 5: CONCATENAR INTRO + VIDEO + OUTRO
// ═══════════════════════════════════════════════════════════════════

async function assembleFullVideo(intro, extendedVideo, outro) {
  console.log('\n\n🔗 STEP 5: Ensamblar Video Completo (Intro + Clips + Outro)');
  console.log('==========================================================\n');

  console.log(`   🎬 Intro:  ${intro.duration.toFixed(1)}s`);
  console.log(`   🎥 Clips:  ${extendedVideo.duration.toFixed(1)}s`);
  console.log(`   🎯 Outro:  ${outro.duration.toFixed(1)}s`);
  console.log(`   ⏱️  Total: ${(intro.duration + extendedVideo.duration + outro.duration).toFixed(1)}s\n`);

  const finalConcatPath = path.join(FINAL_OUTPUT_DIR, 'final-concat.txt');
  const finalConcatList = `file '${intro.file}'\nfile '${extendedVideo.file}'\nfile '${outro.file}'`;

  fs.writeFileSync(finalConcatPath, finalConcatList);

  const finalVideoPath = path.join(FINAL_OUTPUT_DIR, 'video-complete.mp4');

  const finalConcatCommand = `ffmpeg -f concat -safe 0 -i "${finalConcatPath}" \\
    -c copy "${finalVideoPath}" -y`;

  runCommand(finalConcatCommand, 'Ensamblar video completo');

  const finalDuration = getVideoDuration(finalVideoPath);

  const stats = fs.statSync(finalVideoPath);
  console.log(`\n   📁 Video ensamblado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
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

    const videoMetadataPath = path.join(VIDEO_METADATA_DIR, `videos-completed-${verseForFilename}.json`);
    const videoMetadata = JSON.parse(fs.readFileSync(videoMetadataPath, 'utf-8'));

    const audioMetadataFiles = fs.readdirSync(AUDIO_METADATA_DIR)
      .filter(file => file.includes(verseForFilename) && file.startsWith('audio-spec'));
    const audioMetadataPath = path.join(AUDIO_METADATA_DIR, audioMetadataFiles[0]);
    const audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));

    // ───────────────────────────────────────────────────────────────
    // Pipeline de edición con templates cinematográficos
    // ───────────────────────────────────────────────────────────────

    const downloadedClips = await downloadVideos(videoMetadata);
    const baseVideo = await concatenateBaseClips(downloadedClips);

    const audioDuration = audioMetadata.estimatedDuration;
    const extendedVideo = await extendVideoForAudio(baseVideo, audioDuration, downloadedClips);

    const intro = await getIntro();
    const outro = await getOutro();
    const videoComplete = await assembleFullVideo(intro, extendedVideo, outro);

    const finalVideo = await syncAudioComplete(videoComplete.file, audioMetadata, verse);
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
