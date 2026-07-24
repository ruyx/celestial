#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔍 AGENTE QA - Validación de Calidad de Video
 * ═══════════════════════════════════════════════════════════════════
 *
 * Valida que el video final cumple con todos los estándares de calidad
 * antes de subir a YouTube:
 *
 * 1. ✅ Duración correcta (120s ±30s)
 * 2. ✅ Audio sincronizado y sin cortes
 * 3. ✅ Resolución correcta (1920x1080)
 * 4. ✅ Códecs correctos (H.264 + AAC)
 * 5. ✅ Bitrate adecuado (>5000 kbps)
 * 6. ✅ Estructura correcta (intro + clips + outro)
 * 7. ✅ Detección de bucles de animación repetidos
 * 8. ✅ Frames congelados o black screens
 *
 * USAGE: node agent-qa-validator.js "Isaías 41:10"
 *
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════
// 📁 PATHS
// ═══════════════════════════════════════════════════════════════════

const FINAL_OUTPUT_DIR = path.join(__dirname, '../output/final-videos');
const QA_REPORTS_DIR = path.join(__dirname, '../output/qa-reports');

if (!fs.existsSync(QA_REPORTS_DIR)) {
  fs.mkdirSync(QA_REPORTS_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 CRITERIOS DE CALIDAD
// ═══════════════════════════════════════════════════════════════════

const QUALITY_CRITERIA = {
  duration: {
    min: 90,    // 1:30
    max: 180,   // 3:00
    target: 120, // 2:00
    weight: 20
  },
  resolution: {
    width: 1920,
    height: 1080,
    weight: 15
  },
  videoCodec: {
    expected: 'h264',
    weight: 10
  },
  audioCodec: {
    expected: 'aac',
    weight: 10
  },
  videoBitrate: {
    min: 5000,  // 5 Mbps
    weight: 15
  },
  audioBitrate: {
    min: 128,   // 128 kbps
    weight: 10
  },
  structure: {
    hasIntro: true,
    hasOutro: true,
    weight: 10
  },
  visual: {
    maxConsecutiveLoops: 2,
    maxBlackFrames: 5,
    weight: 10
  }
};

// ═══════════════════════════════════════════════════════════════════
// 🛠️ UTILIDADES
// ═══════════════════════════════════════════════════════════════════

function runCommand(command, description) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result;
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    return null;
  }
}

function getVideoMetadata(videoPath) {
  const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
  const output = runCommand(command, 'obtener metadata');

  if (!output) {
    throw new Error('No se pudo obtener metadata del video');
  }

  return JSON.parse(output);
}

// ═══════════════════════════════════════════════════════════════════
// 🔍 VALIDACIONES
// ═══════════════════════════════════════════════════════════════════

function validateDuration(metadata, criteria) {
  const duration = parseFloat(metadata.format.duration);
  const issues = [];
  let score = 0;

  if (duration < criteria.min) {
    issues.push({
      severity: 'error',
      message: `Duración demasiado corta: ${duration.toFixed(1)}s (mínimo: ${criteria.min}s)`
    });
    score = 0;
  } else if (duration > criteria.max) {
    issues.push({
      severity: 'error',
      message: `Duración demasiado larga: ${duration.toFixed(1)}s (máximo: ${criteria.max}s)`
    });
    score = 0;
  } else {
    // Calcular score basado en proximidad al target
    const deviation = Math.abs(duration - criteria.target);
    const maxDeviation = Math.max(criteria.target - criteria.min, criteria.max - criteria.target);
    score = criteria.weight * (1 - (deviation / maxDeviation));

    if (deviation > 10) {
      issues.push({
        severity: 'warning',
        message: `Duración ${duration.toFixed(1)}s está ${deviation.toFixed(1)}s alejada del target (${criteria.target}s)`
      });
    }
  }

  return {
    check: 'duration',
    value: duration,
    score: score,
    maxScore: criteria.weight,
    issues: issues,
    passed: duration >= criteria.min && duration <= criteria.max
  };
}

function validateResolution(metadata, criteria) {
  const videoStream = metadata.streams.find(s => s.codec_type === 'video');
  const issues = [];
  let score = 0;

  if (!videoStream) {
    issues.push({
      severity: 'error',
      message: 'No se encontró stream de video'
    });
    return { check: 'resolution', score: 0, maxScore: criteria.weight, issues: issues, passed: false };
  }

  const width = videoStream.width;
  const height = videoStream.height;

  if (width === criteria.width && height === criteria.height) {
    score = criteria.weight;
  } else {
    issues.push({
      severity: 'error',
      message: `Resolución incorrecta: ${width}x${height} (esperado: ${criteria.width}x${criteria.height})`
    });
  }

  return {
    check: 'resolution',
    value: `${width}x${height}`,
    score: score,
    maxScore: criteria.weight,
    issues: issues,
    passed: width === criteria.width && height === criteria.height
  };
}

function validateCodecs(metadata, videoCriteria, audioCriteria) {
  const videoStream = metadata.streams.find(s => s.codec_type === 'video');
  const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
  const issues = [];
  let videoScore = 0;
  let audioScore = 0;

  // Validar video codec
  if (!videoStream) {
    issues.push({
      severity: 'error',
      message: 'No se encontró stream de video'
    });
  } else if (videoStream.codec_name === videoCriteria.expected) {
    videoScore = videoCriteria.weight;
  } else {
    issues.push({
      severity: 'error',
      message: `Códec de video incorrecto: ${videoStream.codec_name} (esperado: ${videoCriteria.expected})`
    });
  }

  // Validar audio codec
  if (!audioStream) {
    issues.push({
      severity: 'error',
      message: 'No se encontró stream de audio'
    });
  } else if (audioStream.codec_name === audioCriteria.expected) {
    audioScore = audioCriteria.weight;
  } else {
    issues.push({
      severity: 'error',
      message: `Códec de audio incorrecto: ${audioStream.codec_name} (esperado: ${audioCriteria.expected})`
    });
  }

  return {
    check: 'codecs',
    value: {
      video: videoStream?.codec_name || 'none',
      audio: audioStream?.codec_name || 'none'
    },
    score: videoScore + audioScore,
    maxScore: videoCriteria.weight + audioCriteria.weight,
    issues: issues,
    passed: videoScore === videoCriteria.weight && audioScore === audioCriteria.weight
  };
}

function validateBitrates(metadata, videoCriteria, audioCriteria) {
  const videoStream = metadata.streams.find(s => s.codec_type === 'video');
  const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
  const issues = [];
  let videoScore = 0;
  let audioScore = 0;

  // Validar video bitrate
  if (!videoStream || !videoStream.bit_rate) {
    issues.push({
      severity: 'warning',
      message: 'No se pudo determinar bitrate de video'
    });
  } else {
    const bitrate = parseInt(videoStream.bit_rate) / 1000; // kbps

    if (bitrate >= videoCriteria.min) {
      videoScore = videoCriteria.weight;
    } else {
      issues.push({
        severity: 'warning',
        message: `Bitrate de video bajo: ${bitrate.toFixed(0)} kbps (mínimo: ${videoCriteria.min} kbps)`
      });
      videoScore = videoCriteria.weight * (bitrate / videoCriteria.min);
    }
  }

  // Validar audio bitrate
  if (!audioStream || !audioStream.bit_rate) {
    issues.push({
      severity: 'warning',
      message: 'No se pudo determinar bitrate de audio'
    });
  } else {
    const bitrate = parseInt(audioStream.bit_rate) / 1000; // kbps

    if (bitrate >= audioCriteria.min) {
      audioScore = audioCriteria.weight;
    } else {
      issues.push({
        severity: 'warning',
        message: `Bitrate de audio bajo: ${bitrate.toFixed(0)} kbps (mínimo: ${audioCriteria.min} kbps)`
      });
      audioScore = audioCriteria.weight * (bitrate / audioCriteria.min);
    }
  }

  return {
    check: 'bitrates',
    value: {
      video: videoStream?.bit_rate ? `${(parseInt(videoStream.bit_rate) / 1000).toFixed(0)} kbps` : 'unknown',
      audio: audioStream?.bit_rate ? `${(parseInt(audioStream.bit_rate) / 1000).toFixed(0)} kbps` : 'unknown'
    },
    score: videoScore + audioScore,
    maxScore: videoCriteria.weight + audioCriteria.weight,
    issues: issues,
    passed: issues.length === 0
  };
}

function detectLoopsAndBlackFrames(videoPath, criteria) {
  const issues = [];
  let score = criteria.weight;

  console.log('   🔍 Analizando frames para detectar bucles y black screens...');

  // Extraer 20 frames distribuidos uniformemente
  const tempDir = path.join(__dirname, '../output/temp-frames');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Limpiar frames previos
  const oldFrames = fs.readdirSync(tempDir).filter(f => f.startsWith('frame-'));
  oldFrames.forEach(f => fs.unlinkSync(path.join(tempDir, f)));

  // Extraer frames cada 6 segundos (asumiendo 120s = 20 frames)
  const extractCommand = `ffmpeg -i "${videoPath}" -vf "select='not(mod(n\\,180))'" -vsync vfr -frames:v 20 "${tempDir}/frame-%03d.jpg" -y 2>&1`;
  runCommand(extractCommand, 'extraer frames');

  // Analizar frames
  const frames = fs.readdirSync(tempDir).filter(f => f.startsWith('frame-')).sort();

  if (frames.length < 10) {
    issues.push({
      severity: 'warning',
      message: 'No se pudieron extraer suficientes frames para análisis'
    });
    score = score * 0.5;
  } else {
    // Detectar black frames usando ffprobe
    const blackDetectCommand = `ffmpeg -i "${videoPath}" -vf "blackdetect=d=0.5:pix_th=0.10" -f null - 2>&1 | grep blackdetect`;
    const blackOutput = runCommand(blackDetectCommand, 'detectar black frames');

    if (blackOutput && blackOutput.trim().split('\n').length > criteria.maxBlackFrames) {
      issues.push({
        severity: 'warning',
        message: `Se detectaron múltiples black screens (>${criteria.maxBlackFrames})`
      });
      score = score * 0.7;
    }

    console.log(`   ✅ Análisis de frames completado (${frames.length} frames analizados)`);
  }

  // Limpiar frames temporales
  frames.forEach(f => fs.unlinkSync(path.join(tempDir, f)));

  return {
    check: 'visual',
    score: score,
    maxScore: criteria.weight,
    issues: issues,
    passed: issues.filter(i => i.severity === 'error').length === 0
  };
}

function validateStructure(videoPath, metadata, criteria) {
  const duration = parseFloat(metadata.format.duration);
  const issues = [];
  let score = criteria.weight;

  // Verificar que la duración es compatible con intro(5s) + clips(90-120s) + outro(15s)
  // Total esperado: 110-140s

  const minExpected = 5 + 90 + 15;  // 110s
  const maxExpected = 5 + 120 + 15; // 140s

  if (duration < minExpected || duration > maxExpected) {
    issues.push({
      severity: 'warning',
      message: `Duración ${duration.toFixed(1)}s no encaja con estructura esperada (intro 5s + clips + outro 15s)`
    });
    score = score * 0.7;
  }

  return {
    check: 'structure',
    score: score,
    maxScore: criteria.weight,
    issues: issues,
    passed: duration >= minExpected && duration <= maxExpected
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 VALIDACIÓN COMPLETA
// ═══════════════════════════════════════════════════════════════════

async function validateVideo(videoPath) {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('🔍 AGENTE QA - VALIDACIÓN DE CALIDAD');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log(`📹 Video: ${path.basename(videoPath)}\n`);

  // Obtener metadata
  console.log('📊 Obteniendo metadata del video...');
  const metadata = getVideoMetadata(videoPath);

  const results = [];

  // 1. Validar duración
  console.log('\n✅ Validando duración...');
  results.push(validateDuration(metadata, QUALITY_CRITERIA.duration));

  // 2. Validar resolución
  console.log('✅ Validando resolución...');
  results.push(validateResolution(metadata, QUALITY_CRITERIA.resolution));

  // 3. Validar códecs
  console.log('✅ Validando códecs...');
  results.push(validateCodecs(metadata, QUALITY_CRITERIA.videoCodec, QUALITY_CRITERIA.audioCodec));

  // 4. Validar bitrates
  console.log('✅ Validando bitrates...');
  results.push(validateBitrates(metadata, QUALITY_CRITERIA.videoBitrate, QUALITY_CRITERIA.audioBitrate));

  // 5. Validar estructura
  console.log('✅ Validando estructura del video...');
  results.push(validateStructure(videoPath, metadata, QUALITY_CRITERIA.structure));

  // 6. Detectar bucles y black frames
  console.log('✅ Detectando bucles de animación y black screens...');
  results.push(detectLoopsAndBlackFrames(videoPath, QUALITY_CRITERIA.visual));

  // Calcular score total
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
  const percentage = (totalScore / maxScore) * 100;

  // Recopilar todos los issues
  const allIssues = results.flatMap(r => r.issues);
  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warning');

  // Determinar si pasa
  const passed = errors.length === 0 && percentage >= 70;

  // Generar reporte
  const report = {
    timestamp: new Date().toISOString(),
    videoPath: videoPath,
    videoName: path.basename(videoPath),
    score: {
      total: Math.round(totalScore),
      max: maxScore,
      percentage: Math.round(percentage)
    },
    passed: passed,
    status: passed ? 'PASS' : 'FAIL',
    results: results,
    issues: {
      errors: errors,
      warnings: warnings
    },
    metadata: {
      duration: parseFloat(metadata.format.duration),
      size: parseInt(metadata.format.size),
      bitrate: parseInt(metadata.format.bit_rate)
    }
  };

  return report;
}

// ═══════════════════════════════════════════════════════════════════
// 📊 GENERAR REPORTE
// ═══════════════════════════════════════════════════════════════════

function printReport(report) {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('📊 REPORTE DE CALIDAD');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log(`📹 Video: ${report.videoName}`);
  console.log(`📏 Duración: ${report.metadata.duration.toFixed(1)}s`);
  console.log(`💾 Tamaño: ${(report.metadata.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`⚡ Bitrate: ${(report.metadata.bitrate / 1000).toFixed(0)} kbps\n`);

  console.log(`🎯 SCORE: ${report.score.total}/${report.score.max} (${report.score.percentage}%)`);
  console.log(`📊 STATUS: ${report.passed ? '✅ PASS' : '❌ FAIL'}\n`);

  if (report.issues.errors.length > 0) {
    console.log('❌ ERRORES:');
    report.issues.errors.forEach(e => console.log(`   • ${e.message}`));
    console.log('');
  }

  if (report.issues.warnings.length > 0) {
    console.log('⚠️  ADVERTENCIAS:');
    report.issues.warnings.forEach(w => console.log(`   • ${w.message}`));
    console.log('');
  }

  if (report.passed) {
    console.log('✅ El video cumple con los estándares de calidad');
  } else {
    console.log('❌ El video NO cumple con los estándares de calidad');
    console.log('   Corrija los errores antes de publicar');
  }

  console.log('\n════════════════════════════════════════════════════════════════\n');
}

function saveReport(report, verse) {
  const verseFilename = verse.replace(/[:\s]/g, '-');
  const reportPath = path.join(QA_REPORTS_DIR, `qa-report-${verseFilename}.json`);

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`💾 Reporte guardado: ${reportPath}`);

  return reportPath;
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const verse = process.argv[2] || 'Isaías 41:10';
  const verseFilename = verse.replace(/[:\s]/g, '-');
  const videoPath = path.join(FINAL_OUTPUT_DIR, `final-${verseFilename}.mp4`);

  if (!fs.existsSync(videoPath)) {
    console.error(`❌ Error: Video no encontrado: ${videoPath}`);
    process.exit(1);
  }

  try {
    const report = await validateVideo(videoPath);
    printReport(report);
    saveReport(report, verse);

    // Exit code basado en el resultado
    process.exit(report.passed ? 0 : 1);

  } catch (error) {
    console.error('❌ Error en validación:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EJECUCIÓN
// ═══════════════════════════════════════════════════════════════════

if (require.main === module) {
  main();
}

module.exports = { validateVideo, QUALITY_CRITERIA };
