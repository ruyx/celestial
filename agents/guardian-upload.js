#!/usr/bin/env node

/**
 * 👼 GUARDIAN AGENT: YouTube Upload Protector
 *
 * Responsabilidades:
 * - Validar que el video se subió exitosamente a YouTube
 * - Verificar que tiene video ID de YouTube
 * - Detectar errores de OAuth, cuotas, network
 * - Reintentar upload si falla
 * - Reportar URL final del video
 */

const fs = require('fs');
const path = require('path');

// Configuración
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 10000; // 10 segundos (uploads tardan)
const MAX_DELAY_MS = 120000; // 2 minutos
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos (upload puede tardar mucho)

const UPLOAD_METADATA_DIR = path.join(__dirname, '..', 'output', 'upload-metadata');

const ERROR_TYPES = {
  MISSING_FILE: 'missing_file',
  MISSING_VIDEO_ID: 'missing_video_id',
  OAUTH_ERROR: 'oauth_error',
  QUOTA_EXCEEDED: 'quota_exceeded',
  NETWORK_ERROR: 'network_error',
  UPLOAD_FAILED: 'upload_failed',
  UNKNOWN: 'unknown'
};

class UploadGuardian {
  constructor(verse) {
    this.verse = verse;
    this.startTime = Date.now();
    this.retryCount = 0;
    this.errorLog = [];
  }

  async protect() {
    console.log('\n👼 GUARDIAN AGENT: YouTube Upload Protector');
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
        throw new Error(`⏱️ TIMEOUT: Superados ${TIMEOUT_MS / 1000}s sin completar upload`);
      }

      console.log(`\n🔍 Intento ${this.retryCount + 1}/${MAX_RETRIES}`);
      console.log('─'.repeat(60));

      // 1. Cargar metadata
      const metadata = this.loadMetadata();

      // 2. Validar
      const validation = this.validateUpload(metadata);

      if (validation.isComplete) {
        console.log('\n✅ ¡VIDEO SUBIDO A YOUTUBE!\n');
        console.log(`🎥 URL: https://www.youtube.com/watch?v=${validation.videoId}\n`);

        return {
          success: true,
          metadata: metadata,
          videoId: validation.videoId,
          videoUrl: `https://www.youtube.com/watch?v=${validation.videoId}`,
          totalRetries: this.retryCount,
          duration: Date.now() - this.startTime,
          errorLog: this.errorLog
        };
      }

      // 3. Analizar error
      console.log(`\n❌ Upload incompleto: ${validation.reason}`);

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

    throw new Error(`❌ FALLO: Superados ${MAX_RETRIES} reintentos. Video no subido a YouTube.`);
  }

  loadMetadata() {
    try {
      const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');

      if (!fs.existsSync(UPLOAD_METADATA_DIR)) {
        return null;
      }

      const files = fs.readdirSync(UPLOAD_METADATA_DIR)
        .filter(f => f.includes(verseForFilename) && f.endsWith('.json'))
        .sort();

      if (files.length === 0) {
        return null;
      }

      const latestFile = files[files.length - 1];
      const filePath = path.join(UPLOAD_METADATA_DIR, latestFile);

      console.log(`📂 Metadata: ${latestFile}`);

      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      console.error(`❌ Error cargando metadata: ${error.message}`);
      return null;
    }
  }

  validateUpload(metadata) {
    const issues = [];

    if (!metadata) {
      issues.push('metadata_file_not_found');
      return {
        isComplete: false,
        reason: issues.join(', ')
      };
    }

    // Verificar videoId de YouTube
    if (!metadata.youtubeVideoId || metadata.youtubeVideoId.trim() === '') {
      issues.push('missing_youtube_video_id');
    }

    // Verificar status
    if (metadata.status && metadata.status !== 'uploaded') {
      issues.push(`status=${metadata.status}`);
    }

    // Verificar error messages
    if (metadata.error) {
      issues.push(`error: ${metadata.error}`);
    }

    // Si tiene uploadResponse, verificar que tiene id
    if (metadata.uploadResponse && !metadata.uploadResponse.id) {
      issues.push('upload_response_missing_id');
    }

    return {
      isComplete: issues.length === 0,
      reason: issues.join(', '),
      videoId: metadata.youtubeVideoId || metadata.uploadResponse?.id || null,
      metadata: metadata
    };
  }

  analyzeErrors(validation) {
    const reason = validation.reason.toLowerCase();
    let primaryType = ERROR_TYPES.UNKNOWN;

    if (reason.includes('metadata_file_not_found')) {
      primaryType = ERROR_TYPES.MISSING_FILE;
    } else if (reason.includes('missing_youtube_video_id') || reason.includes('upload_response_missing_id')) {
      primaryType = ERROR_TYPES.MISSING_VIDEO_ID;
    } else if (reason.includes('oauth') || reason.includes('auth')) {
      primaryType = ERROR_TYPES.OAUTH_ERROR;
    } else if (reason.includes('quota') || reason.includes('limit')) {
      primaryType = ERROR_TYPES.QUOTA_EXCEEDED;
    } else if (reason.includes('network') || reason.includes('timeout')) {
      primaryType = ERROR_TYPES.NETWORK_ERROR;
    } else if (reason.includes('upload') && reason.includes('failed')) {
      primaryType = ERROR_TYPES.UPLOAD_FAILED;
    }

    return {
      primaryType,
      reason: validation.reason
    };
  }

  getRetryStrategy(errorAnalysis) {
    const { primaryType } = errorAnalysis;

    // Error de OAuth - crítico, requiere intervención manual
    if (primaryType === ERROR_TYPES.OAUTH_ERROR) {
      return {
        shouldStop: true,
        stopReason: '🚫 DETENIDO: Error de autenticación OAuth. Requiere intervención manual para renovar credenciales.',
        description: 'Detener - OAuth error'
      };
    }

    // Cuota excedida - esperar mucho más tiempo
    if (primaryType === ERROR_TYPES.QUOTA_EXCEEDED) {
      return {
        shouldStop: false,
        description: 'Reintentar con backoff extra largo (Cuota de YouTube excedida)',
        waitMultiplier: 5 // Esperar mucho más
      };
    }

    // Error de red - reintentar con backoff moderado
    if (primaryType === ERROR_TYPES.NETWORK_ERROR) {
      return {
        shouldStop: false,
        description: 'Reintentar upload (error de red transitorio)',
        waitMultiplier: 2
      };
    }

    // Missing video ID - probablemente aún subiendo
    if (primaryType === ERROR_TYPES.MISSING_VIDEO_ID || primaryType === ERROR_TYPES.MISSING_FILE) {
      return {
        shouldStop: false,
        description: 'Esperando finalización de upload',
        waitMultiplier: 3
      };
    }

    // Upload failed - reintentar
    if (primaryType === ERROR_TYPES.UPLOAD_FAILED) {
      return {
        shouldStop: false,
        description: 'Reintentar upload completo',
        waitMultiplier: 2
      };
    }

    return {
      shouldStop: false,
      description: 'Reintentar estándar',
      waitMultiplier: 1
    };
  }

  async executeRetry(strategy) {
    console.log(`\n🔧 Ejecutando retry para upload a YouTube...`);

    // TODO: Integrar con Agent 10 (YouTube Uploader)
    // const agent10 = require('./agent-10-youtube-uploader.js');
    // await agent10.uploadVideo(this.verse);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reportSuccess(result) {
    const duration = result.duration / 1000;

    console.log('\n╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '✅ GUARDIAN: ÉXITO' + ' '.repeat(22) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Duración: ${duration.toFixed(2)}s`);
    console.log(`   - Reintentos: ${result.totalRetries}`);
    console.log(`   - Video ID: ${result.videoId}`);
    console.log(`\n🎥 VIDEO PUBLICADO:`);
    console.log(`   ${result.videoUrl}`);
    console.log(`\n📁 Metadata guardada en:`);
    console.log(`   ${UPLOAD_METADATA_DIR}\n`);
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
      console.log(`   - Tipo de error: ${log.errors.primaryType}`);
    });
    console.log('');
  }
}

async function main() {
  const verse = process.argv[2];

  if (!verse) {
    console.error('❌ Error: Debes proporcionar el versículo como argumento');
    console.error('Uso: node guardian-upload.js "Salmos 23:1"');
    process.exit(1);
  }

  const guardian = new UploadGuardian(verse);

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

module.exports = { UploadGuardian };
