#!/usr/bin/env node

/**
 * 👼 GUARDIAN AGENT: Audio TTS Protector
 *
 * Responsabilidades:
 * - Validar que el audio TTS se generó correctamente
 * - Detectar errores específicos (API limits, timeout, missing audio URL)
 * - Reintentar con estrategias adaptativas
 * - Reportar estado detallado y logging
 * - Implementar backoff exponencial
 */

const fs = require('fs');
const path = require('path');

// Configuración
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000; // 2 segundos base
const MAX_DELAY_MS = 60000; // 60 segundos máximo
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos timeout total

const AUDIO_METADATA_DIR = path.join(__dirname, '..', 'output', 'audio-metadata');

// Tipos de errores detectables
const ERROR_TYPES = {
  API_LIMIT: 'api_limit',
  TIMEOUT: 'timeout',
  MISSING_URL: 'missing_url',
  MISSING_IDENTIFIER: 'missing_identifier',
  INVALID_DURATION: 'invalid_duration',
  VOICE_ERROR: 'voice_error',
  UNKNOWN: 'unknown'
};

class AudioGuardian {
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
    console.log('\n👼 GUARDIAN AGENT: Audio TTS Protector');
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
        throw new Error(`⏱️ TIMEOUT: Superados ${TIMEOUT_MS / 1000}s sin completar el audio`);
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
      const validation = this.validateAudio(metadata);

      if (validation.isComplete) {
        console.log('\n✅ ¡AUDIO COMPLETADO!\n');
        return {
          success: true,
          metadata: metadata,
          totalRetries: this.retryCount,
          duration: Date.now() - this.startTime,
          errorLog: this.errorLog
        };
      }

      // 3. Analizar problemas
      console.log(`\n❌ Audio incompleto: ${validation.reason}`);

      // 4. Clasificar errores
      const errorAnalysis = this.analyzeErrors(validation);
      console.log(`\n📊 Tipo de error: ${errorAnalysis.primaryType}`);

      // 5. Log de errores
      this.errorLog.push({
        attempt: this.retryCount + 1,
        timestamp: new Date().toISOString(),
        reason: validation.reason,
        errors: errorAnalysis
      });

      // 6. Estrategia de retry
      const strategy = this.getRetryStrategy(errorAnalysis);
      console.log(`\n♻️  Estrategia: ${strategy.description}`);

      if (strategy.shouldStop) {
        throw new Error(strategy.stopReason);
      }

      // 7. Ejecutar retry
      await this.executeRetry(metadata, strategy);

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
    throw new Error(`❌ FALLO: Superados ${MAX_RETRIES} reintentos. Audio no completado.`);
  }

  /**
   * Cargar metadata de audio
   */
  loadMetadata() {
    try {
      const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');
      const files = fs.readdirSync(AUDIO_METADATA_DIR)
        .filter(f => f.includes(verseForFilename) && f.endsWith('.json'))
        .sort();

      if (files.length === 0) {
        return null;
      }

      // Tomar el más reciente
      const latestFile = files[files.length - 1];
      const filePath = path.join(AUDIO_METADATA_DIR, latestFile);

      console.log(`📂 Metadata: ${latestFile}`);

      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      console.error(`❌ Error cargando metadata: ${error.message}`);
      return null;
    }
  }

  /**
   * Validar audio
   */
  validateAudio(metadata) {
    const issues = [];

    // Verificar status
    if (metadata.status && metadata.status !== 'COMPLETED') {
      issues.push(`status=${metadata.status}`);
    }

    // Verificar identifier
    if (!metadata.identifier || metadata.identifier.trim() === '') {
      issues.push('missing_identifier');
    }

    // Verificar URL del audio
    if (!metadata.audioUrl || metadata.audioUrl.trim() === '') {
      issues.push('missing_audio_url');
    }

    // Verificar voice ID
    if (!metadata.voice || !metadata.voice.id) {
      issues.push('missing_voice_config');
    }

    // Verificar duración estimada
    if (!metadata.estimatedDuration || metadata.estimatedDuration <= 0) {
      issues.push('invalid_duration');
    }

    // Verificar error messages
    if (metadata.error) {
      issues.push(`error: ${metadata.error}`);
    }

    return {
      isComplete: issues.length === 0,
      reason: issues.join(', '),
      metadata: metadata
    };
  }

  /**
   * Analizar tipos de errores
   */
  analyzeErrors(validation) {
    const reason = validation.reason.toLowerCase();
    let primaryType = ERROR_TYPES.UNKNOWN;

    if (reason.includes('limit') || reason.includes('quota')) {
      primaryType = ERROR_TYPES.API_LIMIT;
    } else if (reason.includes('timeout')) {
      primaryType = ERROR_TYPES.TIMEOUT;
    } else if (reason.includes('missing_audio_url')) {
      primaryType = ERROR_TYPES.MISSING_URL;
    } else if (reason.includes('missing_identifier')) {
      primaryType = ERROR_TYPES.MISSING_IDENTIFIER;
    } else if (reason.includes('invalid_duration')) {
      primaryType = ERROR_TYPES.INVALID_DURATION;
    } else if (reason.includes('voice')) {
      primaryType = ERROR_TYPES.VOICE_ERROR;
    }

    return {
      primaryType,
      reason: validation.reason
    };
  }

  /**
   * Determinar estrategia de retry
   */
  getRetryStrategy(errorAnalysis) {
    const { primaryType } = errorAnalysis;

    // Si hay límites de API, esperar más tiempo
    if (primaryType === ERROR_TYPES.API_LIMIT) {
      return {
        shouldStop: false,
        description: 'Reintentar con backoff largo (API limits)',
        waitMultiplier: 2
      };
    }

    // Missing URLs/identifiers - probablemente aún generando
    if (primaryType === ERROR_TYPES.MISSING_URL || primaryType === ERROR_TYPES.MISSING_IDENTIFIER) {
      return {
        shouldStop: false,
        description: 'Esperando finalización de generación de audio',
        waitMultiplier: 1.5
      };
    }

    // Errores de configuración de voz - crítico
    if (primaryType === ERROR_TYPES.VOICE_ERROR) {
      return {
        shouldStop: true,
        stopReason: '🚫 DETENIDO: Error en configuración de voz. Requiere intervención manual.',
        description: 'Detener - Error de voz'
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
   * Ejecutar retry para audio
   */
  async executeRetry(metadata, strategy) {
    console.log(`\n🔧 Ejecutando retry para audio TTS...`);
    console.log(`   - Voice: ${metadata.voice?.name || 'unknown'} (ID: ${metadata.voice?.id || 'N/A'})`);
    console.log(`   - Duración esperada: ${metadata.estimatedDuration || 0}s`);
    console.log(`   - Texto longitud: ${metadata.textLength || 0} chars`);

    // TODO: Integrar con Agent 6 (Audio TTS) para regenerar
    // const agent6 = require('./agent-6-audio-voice-expert.js');
    // await agent6.regenerateAudio(this.verse);
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
    console.log(`   - Audio URL: ${result.metadata.audioUrl ? '✅' : '❌'}`);
    console.log(`   - Duración audio: ${result.metadata.estimatedDuration || 0}s`);
    console.log(`\n📁 Metadata guardada en:`);
    console.log(`   ${AUDIO_METADATA_DIR}\n`);
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
      console.log(`   - Razón: ${log.reason}`);
      console.log(`   - Tipo de error: ${log.errors.primaryType}`);
    });
    console.log('');
  }
}

// Punto de entrada
async function main() {
  const verse = process.argv[2];

  if (!verse) {
    console.error('❌ Error: Debes proporcionar el versículo como argumento');
    console.error('Uso: node guardian-audio.js "Salmos 23:1"');
    process.exit(1);
  }

  const guardian = new AudioGuardian(verse);

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

module.exports = { AudioGuardian };
