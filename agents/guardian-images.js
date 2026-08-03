#!/usr/bin/env node

/**
 * 👼 GUARDIAN AGENT: Image Generation Protector
 *
 * Responsabilidades:
 * - Validar que todas las imágenes esperadas se generaron
 * - Detectar errores específicos (moderation, API limits, download failures)
 * - Reintentar imágenes faltantes con estrategias adaptativas
 * - Reportar estado detallado y logging
 * - Implementar backoff exponencial
 * - Timeout y límites de reintentos
 */

const fs = require('fs');
const path = require('path');

// Configuración
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000; // 2 segundos base
const MAX_DELAY_MS = 60000; // 60 segundos máximo
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos timeout total

const IMAGE_METADATA_DIR = path.join(__dirname, '..', 'output', 'image-metadata');

// Tipos de errores detectables
const ERROR_TYPES = {
  MODERATION_BLOCK: 'moderation_block',
  API_LIMIT: 'api_limit',
  DOWNLOAD_FAILED: 'download_failed',
  TIMEOUT: 'timeout',
  INVALID_PROMPT: 'invalid_prompt',
  MISSING_URL: 'missing_url',
  UNKNOWN: 'unknown'
};

class ImageGuardian {
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
    console.log('\n👼 GUARDIAN AGENT: Image Generation Protector');
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
        throw new Error(`⏱️ TIMEOUT: Superados ${TIMEOUT_MS / 1000}s sin completar todas las imágenes`);
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
      const validation = this.validateImages(metadata);

      if (validation.isComplete) {
        console.log('\n✅ ¡TODAS LAS IMÁGENES COMPLETADAS!\n');
        return {
          success: true,
          metadata: metadata,
          totalRetries: this.retryCount,
          duration: Date.now() - this.startTime,
          errorLog: this.errorLog
        };
      }

      // 3. Analizar imágenes faltantes
      console.log(`\n❌ Imágenes faltantes: ${validation.missing.length}/${validation.total}`);
      validation.missing.forEach(miss => {
        console.log(`   - Scene ${miss.sceneId} (${miss.type}): ${miss.reason}`);
      });

      // 4. Clasificar errores
      const errorAnalysis = this.analyzeErrors(validation.missing);
      console.log(`\n📊 Análisis de errores:`);
      Object.entries(errorAnalysis.byType).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`   - ${type}: ${count} imágenes`);
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
      const delay = Math.min(
        BASE_DELAY_MS * Math.pow(2, this.retryCount),
        MAX_DELAY_MS
      );
      console.log(`⏳ Esperando ${delay / 1000}s antes del próximo intento...`);
      await this.sleep(delay);

      this.retryCount++;
    }

    // Si llegamos aquí, superamos los reintentos
    throw new Error(`❌ FALLO: Superados ${MAX_RETRIES} reintentos. Algunas imágenes no se completaron.`);
  }

  /**
   * Cargar metadata de imágenes
   */
  loadMetadata() {
    try {
      const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');
      const files = fs.readdirSync(IMAGE_METADATA_DIR)
        .filter(f => f.includes(verseForFilename) && f.endsWith('.json'))
        .sort();

      if (files.length === 0) {
        return null;
      }

      // Tomar el más reciente
      const latestFile = files[files.length - 1];
      const filePath = path.join(IMAGE_METADATA_DIR, latestFile);

      console.log(`📂 Metadata: ${latestFile}`);

      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      console.error(`❌ Error cargando metadata: ${error.message}`);
      return null;
    }
  }

  /**
   * Validar imágenes
   */
  validateImages(metadata) {
    const total = metadata.images.length;
    const missing = [];

    metadata.images.forEach(img => {
      const issues = [];

      // Verificar status
      if (img.status !== 'completed') {
        issues.push(`status=${img.status}`);
      }

      // Verificar URL
      if (!img.url || img.url.trim() === '') {
        issues.push('missing_url');
      }

      // Verificar creationIdentifier (Agent 4 genera 'creationIdentifier', no 'identifier')
      if (!img.creationIdentifier || img.creationIdentifier.trim() === '') {
        issues.push('missing_creationIdentifier');
      }

      // Verificar error messages
      if (img.error) {
        issues.push(`error: ${img.error}`);
      }

      if (issues.length > 0) {
        missing.push({
          sceneId: img.sceneId,
          type: img.type,
          reason: issues.join(', '),
          image: img
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
      [ERROR_TYPES.INVALID_PROMPT]: 0,
      [ERROR_TYPES.MISSING_URL]: 0,
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
      } else if (reason.includes('invalid') || reason.includes('prompt')) {
        byType[ERROR_TYPES.INVALID_PROMPT]++;
      } else if (reason.includes('missing_url')) {
        byType[ERROR_TYPES.MISSING_URL]++;
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
        stopReason: '🚫 DETENIDO: Todas las imágenes bloqueadas por moderación. Requiere intervención manual para ajustar prompts.',
        description: 'Detener - Moderación'
      };
    }

    // Si hay límites de API, esperar más tiempo
    if (byType[ERROR_TYPES.API_LIMIT] > 0) {
      return {
        shouldStop: false,
        description: 'Reintentar con backoff largo (API limits)',
        waitMultiplier: 2
      };
    }

    // Errores de download - reintentar inmediatamente
    if (byType[ERROR_TYPES.DOWNLOAD_FAILED] > 0) {
      return {
        shouldStop: false,
        description: 'Reintentar descarga (errors transitorios)',
        waitMultiplier: 0.5
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
   * Ejecutar retry para imágenes faltantes
   */
  async executeRetry(missing, strategy) {
    console.log(`\n🔧 Ejecutando retry para ${missing.length} imágenes...`);

    // Aquí se invocaría al agente de generación de imágenes
    // Por ahora solo logueamos qué haríamos
    missing.forEach(miss => {
      console.log(`   ↻ Reintentando Scene ${miss.sceneId} (${miss.type})`);
    });

    // TODO: Integrar con Agent 4 (Magnific API) para regenerar
    // const agent4 = require('./agent-4-magnific-api.js');
    // await agent4.regenerateImages(this.verse, missing);
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
    console.log(`   - Imágenes completadas: ${result.metadata.images.length}`);
    console.log(`\n📁 Metadata guardada en:`);
    console.log(`   ${IMAGE_METADATA_DIR}\n`);
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
      console.log(`   - Imágenes faltantes: ${log.missing}`);
      console.log(`   - Errores críticos: ${log.errors.criticalErrors}`);
    });
    console.log('');
  }
}

// Punto de entrada
async function main() {
  const verse = process.argv[2];

  if (!verse) {
    console.error('❌ Error: Debes proporcionar el versículo como argumento');
    console.error('Uso: node guardian-images.js "Salmos 23:1"');
    process.exit(1);
  }

  const guardian = new ImageGuardian(verse);

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

module.exports = { ImageGuardian };
