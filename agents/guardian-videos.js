#!/usr/bin/env node

/**
 * 👼 GUARDIAN AGENT: Video Generation Protector
 *
 * Responsabilidades:
 * - Validar que todos los videos esperados se generaron
 * - Detectar errores específicos (moderation, API limits, download failures)
 * - Reintentar videos faltantes con estrategias adaptativas
 * - Reportar estado detallado y logging
 * - Implementar backoff exponencial
 * - Timeout y límites de reintentos
 */

const fs = require('fs');
const path = require('path');

// Configuración
const MAX_RETRIES = 10; // ✅ 10 intentos para cubrir 25 minutos
const BASE_DELAY_MS = 60000; // ✅ 1 minuto base entre intentos
const MAX_DELAY_MS = 5 * 60 * 1000; // ✅ 5 minutos máximo entre intentos (capped)
const TIMEOUT_MS = 25 * 60 * 1000; // ✅ 25 minutos timeout total (si pasa de aquí, es un problema)

const VIDEO_METADATA_DIR = path.join(__dirname, '..', 'output', 'video-metadata');

// Tipos de errores detectables
const ERROR_TYPES = {
  MODERATION_BLOCK: 'moderation_block',
  API_LIMIT: 'api_limit',
  DOWNLOAD_FAILED: 'download_failed',
  TIMEOUT: 'timeout',
  INVALID_PARAMS: 'invalid_params',
  MISSING_URL: 'missing_url',
  MISSING_IDENTIFIER: 'missing_identifier',
  DURATION_MISMATCH: 'duration_mismatch',
  UNKNOWN: 'unknown'
};

class VideoGuardian {
  constructor(verse) {
    this.verse = verse;
    this.startTime = Date.now();
    this.retryCount = 0;
    this.errorLog = [];
  }

  /**
   * Punto de entrada principal
   */
  async protect() {
    console.log('\n👼 GUARDIAN AGENT: Video Generation Protector');
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

  /**
   * Loop de protección con reintentos
   */
  async guardLoop() {
    while (this.retryCount < MAX_RETRIES) {
      // Verificar timeout global
      if (Date.now() - this.startTime > TIMEOUT_MS) {
        throw new Error(`⏱️ TIMEOUT: Superados ${TIMEOUT_MS / 1000}s sin completar todos los videos`);
      }

      console.log(`\n🔍 Intento ${this.retryCount + 1}/${MAX_RETRIES}`);
      console.log('─'.repeat(60));

      // 1. Cargar metadata actual
      const metadata = this.loadMetadata();
      if (!metadata) {
        console.log('⚠️  Metadata no encontrada. Esperando que se genere...');
        await this.sleep(BASE_DELAY_MS);
        this.retryCount++;
        continue;
      }

      // 2. Validar completitud
      const validation = this.validateVideos(metadata);

      if (validation.isComplete) {
        console.log('\n✅ ¡TODOS LOS VIDEOS COMPLETADOS!\n');
        return {
          success: true,
          metadata: metadata,
          totalRetries: this.retryCount,
          duration: Date.now() - this.startTime,
          errorLog: this.errorLog
        };
      }

      // 3. Analizar videos faltantes
      console.log(`\n❌ Videos faltantes: ${validation.missing.length}/${validation.total}`);
      validation.missing.forEach(miss => {
        console.log(`   - Clip ${miss.clipId} (Scene ${miss.sceneId}, ${miss.sceneType}): ${miss.reason}`);
      });

      // 4. Clasificar errores
      const errorAnalysis = this.analyzeErrors(validation.missing);
      console.log(`\n📊 Análisis de errores:`);
      Object.entries(errorAnalysis.byType).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`   - ${type}: ${count} clips`);
        }
      });

      // 5. Log de errores
      this.errorLog.push({
        attempt: this.retryCount + 1,
        timestamp: new Date().toISOString(),
        missing: validation.missing.length,
        errors: errorAnalysis
      });

      // 6. Estrategia de retry
      const strategy = this.getRetryStrategy(errorAnalysis);
      console.log(`\n♻️  Estrategia: ${strategy.description}`);

      if (strategy.shouldStop) {
        throw new Error(strategy.stopReason);
      }

      // 7. Ejecutar retry
      await this.executeRetry(validation.missing, strategy);

      // 8. Backoff exponencial
      const baseDelay = BASE_DELAY_MS * Math.pow(2, this.retryCount);
      const delay = Math.min(baseDelay * (strategy.waitMultiplier || 1), MAX_DELAY_MS);
      console.log(`⏳ Esperando ${delay / 1000}s antes del próximo intento...`);
      await this.sleep(delay);

      this.retryCount++;
    }

    // Si llegamos aquí, superamos los reintentos
    throw new Error(`❌ FALLO: Superados ${MAX_RETRIES} reintentos. Algunos videos no se completaron.`);
  }

  /**
   * Cargar metadata de videos
   */
  loadMetadata() {
    try {
      const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');
      const files = fs.readdirSync(VIDEO_METADATA_DIR)
        .filter(f => f.includes(verseForFilename) && f.endsWith('.json'))
        .sort();

      if (files.length === 0) {
        return null;
      }

      // Tomar el más reciente
      const latestFile = files[files.length - 1];
      const filePath = path.join(VIDEO_METADATA_DIR, latestFile);

      console.log(`📂 Metadata: ${latestFile}`);

      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      console.error(`❌ Error cargando metadata: ${error.message}`);
      return null;
    }
  }

  /**
   * Validar videos
   */
  validateVideos(metadata) {
    // ✅ COMPATIBILIDAD: Aceptar tanto 'clips' como 'videos'
    const clips = metadata.clips || metadata.videos || [];
    const total = clips.length;
    const missing = [];

    if (clips.length === 0) {
      return {
        isComplete: false,
        total: 0,
        completed: 0,
        missing: [{
          clipId: 'N/A',
          sceneId: 'N/A',
          sceneType: 'N/A',
          reason: 'no_clips_or_videos_found',
          clip: null
        }]
      };
    }

    clips.forEach(clip => {
      const issues = [];

      // Verificar status
      if (clip.status && clip.status !== 'completed') {
        issues.push(`status=${clip.status}`);
      }

      // Verificar identifier (creationIdentifier)
      if (!clip.creationIdentifier || clip.creationIdentifier.trim() === '') {
        issues.push('missing_identifier');
      }

      // Verificar URL del video generado
      // ✅ COMPATIBILIDAD: Aceptar tanto 'videoUrl' como 'url'
      const videoUrl = clip.videoUrl || clip.url;
      if (!videoUrl || videoUrl.trim() === '') {
        issues.push('missing_video_url');
      }

      // Verificar duración esperada
      if (clip.duration && clip.actualDuration &&
          Math.abs(clip.duration - clip.actualDuration) > 2) {
        issues.push(`duration_mismatch: expected ${clip.duration}s, got ${clip.actualDuration}s`);
      }

      // Verificar error messages
      if (clip.error) {
        issues.push(`error: ${clip.error}`);
      }

      // Verificar parámetros de Magnific
      // ✅ COMPATIBILIDAD: Aceptar tanto 'magnificParams.slug' como 'model'
      const hasModel = (clip.magnificParams && clip.magnificParams.slug) || clip.model;
      if (!hasModel) {
        issues.push('missing_magnific_params');
      }

      if (issues.length > 0) {
        missing.push({
          clipId: clip.clipId,
          sceneId: clip.sceneId,
          sceneType: clip.sceneType,
          reason: issues.join(', '),
          clip: clip
        });
      }
    });

    return {
      isComplete: missing.length === 0,
      total: total,
      completed: total - missing.length,
      missing: missing
    };
  }

  /**
   * Analizar tipos de errores
   */
  analyzeErrors(missing) {
    const byType = {
      [ERROR_TYPES.MODERATION_BLOCK]: 0,
      [ERROR_TYPES.API_LIMIT]: 0,
      [ERROR_TYPES.DOWNLOAD_FAILED]: 0,
      [ERROR_TYPES.TIMEOUT]: 0,
      [ERROR_TYPES.INVALID_PARAMS]: 0,
      [ERROR_TYPES.MISSING_URL]: 0,
      [ERROR_TYPES.MISSING_IDENTIFIER]: 0,
      [ERROR_TYPES.DURATION_MISMATCH]: 0,
      [ERROR_TYPES.UNKNOWN]: 0
    };

    missing.forEach(miss => {
      const reason = miss.reason.toLowerCase();

      if (reason.includes('moderation') || reason.includes('blocked')) {
        byType[ERROR_TYPES.MODERATION_BLOCK]++;
      } else if (reason.includes('limit') || reason.includes('quota')) {
        byType[ERROR_TYPES.API_LIMIT]++;
      } else if (reason.includes('download') || reason.includes('fetch')) {
        byType[ERROR_TYPES.DOWNLOAD_FAILED]++;
      } else if (reason.includes('timeout')) {
        byType[ERROR_TYPES.TIMEOUT]++;
      } else if (reason.includes('missing_video_url')) {
        byType[ERROR_TYPES.MISSING_URL]++;
      } else if (reason.includes('missing_identifier')) {
        byType[ERROR_TYPES.MISSING_IDENTIFIER]++;
      } else if (reason.includes('duration_mismatch')) {
        byType[ERROR_TYPES.DURATION_MISMATCH]++;
      } else if (reason.includes('invalid') || reason.includes('params')) {
        byType[ERROR_TYPES.INVALID_PARAMS]++;
      } else {
        byType[ERROR_TYPES.UNKNOWN]++;
      }
    });

    return {
      byType,
      totalErrors: missing.length,
      criticalErrors: byType[ERROR_TYPES.MODERATION_BLOCK] + byType[ERROR_TYPES.API_LIMIT]
    };
  }

  /**
   * Determinar estrategia de retry
   */
  getRetryStrategy(errorAnalysis) {
    const { byType, criticalErrors, totalErrors } = errorAnalysis;

    // Si TODAS son errores de moderación, detener
    if (byType[ERROR_TYPES.MODERATION_BLOCK] === totalErrors && totalErrors > 0) {
      return {
        shouldStop: true,
        stopReason: '🚫 DETENIDO: Todos los videos bloqueados por moderación. Requiere intervención manual para ajustar prompts o cambiar modelo (usar Pikaso API en lugar de Seedance/Veo).',
        description: 'Detener - Moderación'
      };
    }

    // Si hay MUCHOS errores de moderación (>50%), advertir pero continuar
    if (byType[ERROR_TYPES.MODERATION_BLOCK] > totalErrors / 2) {
      console.log('\n⚠️  WARNING: Más del 50% de videos bloqueados por moderación.');
      console.log('   Considere cambiar a Pikaso API o ajustar prompts.');
    }

    // Si hay límites de API, esperar mucho más tiempo
    if (byType[ERROR_TYPES.API_LIMIT] > 0) {
      return {
        shouldStop: false,
        description: 'Reintentar con backoff extra largo (API limits en video)',
        waitMultiplier: 3 // Videos son más pesados, esperar más
      };
    }

    // Errores de download - reintentar con backoff moderado
    if (byType[ERROR_TYPES.DOWNLOAD_FAILED] > 0) {
      return {
        shouldStop: false,
        description: 'Reintentar descarga (errores transitorios)',
        waitMultiplier: 1.5
      };
    }

    // Missing URLs/identifiers - probablemente aún generando
    if (byType[ERROR_TYPES.MISSING_URL] > 0 || byType[ERROR_TYPES.MISSING_IDENTIFIER] > 0) {
      return {
        shouldStop: false,
        description: 'Esperando finalización de generación',
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

  /**
   * Ejecutar retry para videos faltantes
   */
  async executeRetry(missing, strategy) {
    console.log(`\n🔧 Ejecutando retry para ${missing.length} videos...`);

    // Aquí se invocaría al agente de generación de videos
    // Por ahora solo logueamos qué haríamos
    missing.forEach(miss => {
      console.log(`   ↻ Reintentando Clip ${miss.clipId} (Scene ${miss.sceneId}, ${miss.sceneType})`);

      // Información adicional sobre cómo regenerar
      if (miss.clip) {
        const model = miss.clip.magnificParams?.slug || miss.clip.model || 'unknown';
        console.log(`      - Modelo: ${model}`);
        console.log(`      - Duración esperada: ${miss.clip.duration}s`);
        console.log(`      - Movimiento cámara: ${miss.clip.cameraMotion || 'static'}`);
      }
    });

    // TODO: Integrar con Agent 5 (Video Animator) para regenerar
    // const agent5 = require('./agent-5-video-animator.js');
    // await agent5.regenerateVideos(this.verse, missing);
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reporte de éxito
   */
  reportSuccess(result) {
    const duration = result.duration / 1000;
    console.log('\n╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '✅ GUARDIAN: ÉXITO' + ' '.repeat(22) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Duración: ${duration.toFixed(2)}s`);
    console.log(`   - Reintentos: ${result.totalRetries}`);
    // ✅ COMPATIBILIDAD: Aceptar tanto 'clips' como 'videos'
    const videosCount = (result.metadata.clips || result.metadata.videos || []).length;
    console.log(`   - Videos completados: ${videosCount}`);
    console.log(`   - Duración total: ${result.metadata.totalDuration || 0}s`);
    console.log(`\n📁 Metadata guardada en:`);
    console.log(`   ${VIDEO_METADATA_DIR}\n`);
  }

  /**
   * Reporte de fallo
   */
  reportFailure(error) {
    console.log('\n╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '❌ GUARDIAN: FALLO' + ' '.repeat(23) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log(`\n💥 Error: ${error.message}`);
    console.log(`\n📊 Log de errores:`);
    this.errorLog.forEach((log, i) => {
      console.log(`\n   Intento ${log.attempt}:`);
      console.log(`   - Timestamp: ${log.timestamp}`);
      console.log(`   - Videos faltantes: ${log.missing}`);
      console.log(`   - Errores críticos: ${log.errors.criticalErrors}`);
      if (log.errors.byType[ERROR_TYPES.MODERATION_BLOCK] > 0) {
        console.log(`   ⚠️  Bloques por moderación: ${log.errors.byType[ERROR_TYPES.MODERATION_BLOCK]}`);
      }
    });
    console.log('');
  }
}

// Punto de entrada
async function main() {
  const verse = process.argv[2];

  if (!verse) {
    console.error('❌ Error: Debes proporcionar el versículo como argumento');
    console.error('Uso: node guardian-videos.js "Salmos 23:1"');
    process.exit(1);
  }

  const guardian = new VideoGuardian(verse);

  try {
    const result = await guardian.protect();
    console.log('\n✅ Guardian completado exitosamente\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Guardian falló\n');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { VideoGuardian };
