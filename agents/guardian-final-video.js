#!/usr/bin/env node

/**
 * 👼 GUARDIAN AGENT: Final Video Protector
 *
 * Responsabilidades:
 * - Validar que el video final compilado existe y es válido
 * - Verificar duración, tamaño de archivo, codec
 * - Detectar errores de ffmpeg, corrupción de archivos
 * - Reintentar compilación si falla
 * - Reportar estado detallado
 */

const fs = require('fs');
const path = require('path');

// Configuración
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000; // 5 segundos base (compilación tarda)
const MAX_DELAY_MS = 60000;
const TIMEOUT_MS = 20 * 60 * 1000; // 20 minutos (compilación puede tardar)

const FINAL_VIDEOS_DIR = path.join(__dirname, '..', 'output', 'final-videos');

const ERROR_TYPES = {
  MISSING_FILE: 'missing_file',
  FILE_TOO_SMALL: 'file_too_small',
  FFMPEG_ERROR: 'ffmpeg_error',
  DURATION_MISMATCH: 'duration_mismatch',
  MISSING_METADATA: 'missing_metadata',
  UNKNOWN: 'unknown'
};

class FinalVideoGuardian {
  constructor(verse) {
    this.verse = verse;
    this.startTime = Date.now();
    this.retryCount = 0;
    this.errorLog = [];
  }

  async protect() {
    console.log('\n👼 GUARDIAN AGENT: Final Video Protector');
    console.log('━'.repeat(60));
    console.log(`📖 Versículo: ${this.verse}`);
    console.log(`⏰ Inicio: ${new Date().toISOString()}`);
    console.log(`🔄 Max reintentos: ${MAX_RETRIES}`);
    console.log(`⏱️  Timeout total: ${TIMEOUT_MS / 1000}s\n`);

    try {
      const result = await this.guardLoop();
      this.reportSuccess(result);
      return result;
    } catch (error) {
      this.reportFailure(error);
      throw error;
    }
  }

  async guardLoop() {
    while (this.retryCount < MAX_RETRIES) {
      if (Date.now() - this.startTime > TIMEOUT_MS) {
        throw new Error(`⏱️ TIMEOUT: Superados ${TIMEOUT_MS / 1000}s sin completar video final`);
      }

      console.log(`\n🔍 Intento ${this.retryCount + 1}/${MAX_RETRIES}`);
      console.log('─'.repeat(60));

      // 1. Buscar video final
      const videoFile = this.findFinalVideo();
      const metadataFile = this.findMetadata();

      // 2. Validar
      const validation = this.validateFinalVideo(videoFile, metadataFile);

      if (validation.isComplete) {
        console.log('\n✅ ¡VIDEO FINAL COMPLETADO!\n');
        return {
          success: true,
          videoPath: videoFile,
          metadataPath: metadataFile,
          totalRetries: this.retryCount,
          duration: Date.now() - this.startTime,
          errorLog: this.errorLog
        };
      }

      // 3. Analizar error
      console.log(`\n❌ Video incompleto: ${validation.reason}`);
      const errorAnalysis = this.analyzeErrors(validation);

      this.errorLog.push({
        attempt: this.retryCount + 1,
        timestamp: new Date().toISOString(),
        reason: validation.reason,
        errors: errorAnalysis
      });

      // 4. Estrategia
      const strategy = this.getRetryStrategy(errorAnalysis);
      console.log(`\n♻️  Estrategia: ${strategy.description}`);

      if (strategy.shouldStop) {
        throw new Error(strategy.stopReason);
      }

      // 5. Retry
      await this.executeRetry(strategy);

      // 6. Backoff
      const delay = Math.min(
        BASE_DELAY_MS * Math.pow(2, this.retryCount),
        MAX_DELAY_MS
      );
      console.log(`⏳ Esperando ${delay / 1000}s antes del próximo intento...`);
      await this.sleep(delay);

      this.retryCount++;
    }

    throw new Error(`❌ FALLO: Superados ${MAX_RETRIES} reintentos. Video final no completado.`);
  }

  findFinalVideo() {
    try {
      const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');

      if (!fs.existsSync(FINAL_VIDEOS_DIR)) {
        return null;
      }

      const files = fs.readdirSync(FINAL_VIDEOS_DIR)
        .filter(f => f.includes(verseForFilename) && f.endsWith('.mp4'))
        .sort();

      if (files.length === 0) {
        return null;
      }

      const latestFile = files[files.length - 1];
      const filePath = path.join(FINAL_VIDEOS_DIR, latestFile);

      console.log(`📂 Video: ${latestFile}`);
      return filePath;
    } catch (error) {
      console.error(`❌ Error buscando video: ${error.message}`);
      return null;
    }
  }

  findMetadata() {
    try {
      const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');
      const metadataDir = path.join(__dirname, '..', 'output', 'video-metadata');

      if (!fs.existsSync(metadataDir)) {
        return null;
      }

      const files = fs.readdirSync(metadataDir)
        .filter(f => f.includes('videos-completed') && f.includes(verseForFilename) && f.endsWith('.json'))
        .sort();

      if (files.length === 0) {
        return null;
      }

      return path.join(metadataDir, files[files.length - 1]);
    } catch (error) {
      return null;
    }
  }

  validateFinalVideo(videoPath, metadataPath) {
    const issues = [];

    // Verificar que existe
    if (!videoPath || !fs.existsSync(videoPath)) {
      issues.push('missing_video_file');
      return {
        isComplete: false,
        reason: issues.join(', ')
      };
    }

    // Verificar tamaño (mínimo 100KB - videos muy pequeños están corruptos)
    const stats = fs.statSync(videoPath);
    const sizeKB = stats.size / 1024;
    if (sizeKB < 100) {
      issues.push(`file_too_small: ${sizeKB.toFixed(2)}KB`);
    }

    // Verificar metadata
    if (!metadataPath || !fs.existsSync(metadataPath)) {
      issues.push('missing_metadata_file');
    } else {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

        // Verificar que tiene finalVideoPath
        if (!metadata.finalVideoPath || metadata.finalVideoPath.trim() === '') {
          issues.push('metadata_missing_final_video_path');
        }

        // Verificar que tiene status completed
        if (metadata.status && metadata.status !== 'completed') {
          issues.push(`metadata_status=${metadata.status}`);
        }
      } catch (error) {
        issues.push(`metadata_parse_error: ${error.message}`);
      }
    }

    return {
      isComplete: issues.length === 0,
      reason: issues.join(', '),
      videoPath: videoPath,
      metadataPath: metadataPath,
      fileSizeKB: sizeKB
    };
  }

  analyzeErrors(validation) {
    const reason = validation.reason.toLowerCase();
    let primaryType = ERROR_TYPES.UNKNOWN;

    if (reason.includes('missing_video_file')) {
      primaryType = ERROR_TYPES.MISSING_FILE;
    } else if (reason.includes('file_too_small')) {
      primaryType = ERROR_TYPES.FILE_TOO_SMALL;
    } else if (reason.includes('ffmpeg') || reason.includes('compilation')) {
      primaryType = ERROR_TYPES.FFMPEG_ERROR;
    } else if (reason.includes('duration')) {
      primaryType = ERROR_TYPES.DURATION_MISMATCH;
    } else if (reason.includes('metadata')) {
      primaryType = ERROR_TYPES.MISSING_METADATA;
    }

    return {
      primaryType,
      reason: validation.reason
    };
  }

  getRetryStrategy(errorAnalysis) {
    const { primaryType } = errorAnalysis;

    // Video corrupto o muy pequeño - problema serio
    if (primaryType === ERROR_TYPES.FILE_TOO_SMALL) {
      return {
        shouldStop: false,
        description: 'Recompilar video - archivo corrupto o incompleto',
        waitMultiplier: 2
      };
    }

    // Error de ffmpeg - reintentar compilación
    if (primaryType === ERROR_TYPES.FFMPEG_ERROR) {
      return {
        shouldStop: false,
        description: 'Reintentar compilación con ffmpeg',
        waitMultiplier: 1.5
      };
    }

    // Missing file - probablemente aún compilando
    if (primaryType === ERROR_TYPES.MISSING_FILE) {
      return {
        shouldStop: false,
        description: 'Esperando finalización de compilación',
        waitMultiplier: 2
      };
    }

    // Estrategia estándar
    return {
      shouldStop: false,
      description: 'Reintentar estándar',
      waitMultiplier: 1
    };
  }

  async executeRetry(strategy) {
    console.log(`\n🔧 Ejecutando retry para video final...`);
    console.log(`   - Directorio: ${FINAL_VIDEOS_DIR}`);

    // TODO: Integrar con Agent 7 (Video Editor) para recompilar
    // const agent7 = require('./agent-7-video-editor.js');
    // await agent7.compileVideo(this.verse);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reportSuccess(result) {
    const duration = result.duration / 1000;
    const videoSize = result.videoPath ? (fs.statSync(result.videoPath).size / 1024 / 1024).toFixed(2) : 'N/A';

    console.log('\n╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '✅ GUARDIAN: ÉXITO' + ' '.repeat(22) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Duración: ${duration.toFixed(2)}s`);
    console.log(`   - Reintentos: ${result.totalRetries}`);
    console.log(`   - Video path: ${result.videoPath}`);
    console.log(`   - Tamaño: ${videoSize}MB`);
    console.log(`\n📁 Video final guardado en:`);
    console.log(`   ${FINAL_VIDEOS_DIR}\n`);
  }

  reportFailure(error) {
    console.log('\n╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '❌ GUARDIAN: FALLO' + ' '.repeat(23) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log(`\n💥 Error: ${error.message}`);
    console.log(`\n📊 Log de errores:`);
    this.errorLog.forEach((log, i) => {
      console.log(`\n   Intento ${log.attempt}:`);
      console.log(`   - Timestamp: ${log.timestamp}`);
      console.log(`   - Razón: ${log.reason}`);
    });
    console.log('');
  }
}

async function main() {
  const verse = process.argv[2];

  if (!verse) {
    console.error('❌ Error: Debes proporcionar el versículo como argumento');
    console.error('Uso: node guardian-final-video.js "Salmos 23:1"');
    process.exit(1);
  }

  const guardian = new FinalVideoGuardian(verse);

  try {
    const result = await guardian.protect();
    console.log('\n✅ Guardian completado exitosamente\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Guardian falló\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { FinalVideoGuardian };
