#!/usr/bin/env node

/**
 * 👼 GUARDIAN AGENT: YouTube SEO Protector
 *
 * Responsabilidades:
 * - Validar que se generó metadata SEO completa (título, descripción, tags)
 * - Verificar límites de YouTube (título 100 chars, descripción 5000 chars)
 * - Detectar metadata vacía o incompleta
 * - Reintentar generación si falla
 */

const fs = require('fs');
const path = require('path');

// Configuración
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 30000;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

const SEO_METADATA_DIR = path.join(__dirname, '..', 'output', 'youtube-metadata');

// Límites de YouTube
const YOUTUBE_LIMITS = {
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 5000,
  TAGS_MAX: 500, // caracteres totales
  TAGS_COUNT_MAX: 30
};

const ERROR_TYPES = {
  MISSING_FILE: 'missing_file',
  MISSING_TITLE: 'missing_title',
  MISSING_DESCRIPTION: 'missing_description',
  MISSING_TAGS: 'missing_tags',
  TITLE_TOO_LONG: 'title_too_long',
  DESCRIPTION_TOO_LONG: 'description_too_long',
  TAGS_TOO_MANY: 'tags_too_many',
  UNKNOWN: 'unknown'
};

class SEOGuardian {
  constructor(verse) {
    this.verse = verse;
    this.startTime = Date.now();
    this.retryCount = 0;
    this.errorLog = [];
  }

  async protect() {
    console.log('\n👼 GUARDIAN AGENT: YouTube SEO Protector');
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
        throw new Error(`⏱️ TIMEOUT: Superados ${TIMEOUT_MS / 1000}s sin completar metadata SEO`);
      }

      console.log(`\n🔍 Intento ${this.retryCount + 1}/${MAX_RETRIES}`);
      console.log('─'.repeat(60));

      // 1. Cargar metadata
      const metadata = this.loadMetadata();

      // 2. Validar
      const validation = this.validateSEO(metadata);

      if (validation.isComplete) {
        console.log('\n✅ ¡METADATA SEO COMPLETADA!\n');
        return {
          success: true,
          metadata: metadata,
          totalRetries: this.retryCount,
          duration: Date.now() - this.startTime,
          errorLog: this.errorLog
        };
      }

      // 3. Analizar error
      console.log(`\n❌ Metadata SEO incompleta:`);
      validation.issues.forEach(issue => console.log(`   - ${issue}`));

      const errorAnalysis = this.analyzeErrors(validation);

      this.errorLog.push({
        attempt: this.retryCount + 1,
        timestamp: new Date().toISOString(),
        issues: validation.issues,
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

    throw new Error(`❌ FALLO: Superados ${MAX_RETRIES} reintentos. Metadata SEO no completada.`);
  }

  loadMetadata() {
    try {
      const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');

      if (!fs.existsSync(SEO_METADATA_DIR)) {
        return null;
      }

      const files = fs.readdirSync(SEO_METADATA_DIR)
        .filter(f => f.includes(verseForFilename) && f.endsWith('.json'))
        .sort();

      if (files.length === 0) {
        return null;
      }

      const latestFile = files[files.length - 1];
      const filePath = path.join(SEO_METADATA_DIR, latestFile);

      console.log(`📂 Metadata: ${latestFile}`);

      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      console.error(`❌ Error cargando metadata: ${error.message}`);
      return null;
    }
  }

  validateSEO(metadata) {
    const issues = [];

    if (!metadata) {
      issues.push('metadata_file_not_found');
      return {
        isComplete: false,
        issues: issues
      };
    }

    // Agent-8 guarda datos en metadata.youtube.*
    const youtube = metadata.youtube || {};

    // Verificar título
    if (!youtube.title || youtube.title.trim() === '') {
      issues.push('missing_title');
    } else if (youtube.title.length > YOUTUBE_LIMITS.TITLE_MAX) {
      issues.push(`title_too_long: ${youtube.title.length}/${YOUTUBE_LIMITS.TITLE_MAX} chars`);
    }

    // Verificar descripción
    if (!youtube.description || youtube.description.trim() === '') {
      issues.push('missing_description');
    } else if (youtube.description.length > YOUTUBE_LIMITS.DESCRIPTION_MAX) {
      issues.push(`description_too_long: ${youtube.description.length}/${YOUTUBE_LIMITS.DESCRIPTION_MAX} chars`);
    }

    // Verificar tags
    if (!youtube.tags || youtube.tags.length === 0) {
      issues.push('missing_tags');
    } else if (youtube.tags.length > YOUTUBE_LIMITS.TAGS_COUNT_MAX) {
      issues.push(`too_many_tags: ${youtube.tags.length}/${YOUTUBE_LIMITS.TAGS_COUNT_MAX} tags`);
    } else {
      const totalTagsLength = youtube.tags.join(', ').length;
      if (totalTagsLength > YOUTUBE_LIMITS.TAGS_MAX) {
        issues.push(`tags_text_too_long: ${totalTagsLength}/${YOUTUBE_LIMITS.TAGS_MAX} chars`);
      }
    }

    // Verificar thumbnailPhrase (campo nuevo agregado por Agent-8)
    if (!metadata.thumbnailPhrase || metadata.thumbnailPhrase.trim() === '') {
      issues.push('missing_thumbnailPhrase');
    }

    return {
      isComplete: issues.length === 0,
      issues: issues,
      metadata: metadata
    };
  }

  analyzeErrors(validation) {
    const primaryTypes = [];

    validation.issues.forEach(issue => {
      if (issue.includes('missing_title')) {
        primaryTypes.push(ERROR_TYPES.MISSING_TITLE);
      } else if (issue.includes('missing_description')) {
        primaryTypes.push(ERROR_TYPES.MISSING_DESCRIPTION);
      } else if (issue.includes('missing_tags')) {
        primaryTypes.push(ERROR_TYPES.MISSING_TAGS);
      } else if (issue.includes('title_too_long')) {
        primaryTypes.push(ERROR_TYPES.TITLE_TOO_LONG);
      } else if (issue.includes('description_too_long')) {
        primaryTypes.push(ERROR_TYPES.DESCRIPTION_TOO_LONG);
      } else if (issue.includes('too_many_tags')) {
        primaryTypes.push(ERROR_TYPES.TAGS_TOO_MANY);
      }
    });

    return {
      primaryTypes: primaryTypes.length > 0 ? primaryTypes : [ERROR_TYPES.UNKNOWN],
      issues: validation.issues
    };
  }

  getRetryStrategy(errorAnalysis) {
    const { primaryTypes } = errorAnalysis;

    // Campos faltantes - regenerar
    if (primaryTypes.includes(ERROR_TYPES.MISSING_TITLE) ||
        primaryTypes.includes(ERROR_TYPES.MISSING_DESCRIPTION) ||
        primaryTypes.includes(ERROR_TYPES.MISSING_TAGS)) {
      return {
        shouldStop: false,
        description: 'Regenerar metadata SEO - campos faltantes',
        waitMultiplier: 1
      };
    }

    // Límites excedidos - truncar y regenerar
    if (primaryTypes.includes(ERROR_TYPES.TITLE_TOO_LONG) ||
        primaryTypes.includes(ERROR_TYPES.DESCRIPTION_TOO_LONG) ||
        primaryTypes.includes(ERROR_TYPES.TAGS_TOO_MANY)) {
      return {
        shouldStop: false,
        description: 'Regenerar metadata SEO - límites de YouTube excedidos',
        waitMultiplier: 0.5
      };
    }

    return {
      shouldStop: false,
      description: 'Reintentar estándar',
      waitMultiplier: 1
    };
  }

  async executeRetry(strategy) {
    console.log(`\n🔧 Ejecutando retry para metadata SEO...`);

    // Ejecutar Agent 8 (YouTube SEO Expert con thumbnailPhrase)
    const { execSync } = require('child_process');
    const path = require('path');

    try {
      const result = execSync(
        `node agents/agent-8-youtube-seo-expert.js "${this.verse}"`,
        {
          encoding: 'utf-8',
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        }
      );

      console.log(`✅ Agent 8 completado`);

      return { success: true };
    } catch (error) {
      throw new Error(`Agent 8 falló: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reportSuccess(result) {
    const duration = result.duration / 1000;
    const youtube = result.metadata.youtube || {};

    console.log('\n╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '✅ GUARDIAN: ÉXITO' + ' '.repeat(22) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Duración: ${duration.toFixed(2)}s`);
    console.log(`   - Reintentos: ${result.totalRetries}`);
    console.log(`\n📝 Metadata SEO:`);
    console.log(`   - Título: "${youtube.title}" (${youtube.title?.length || 0} chars)`);
    console.log(`   - Descripción: ${youtube.description?.length || 0} chars`);
    console.log(`   - Tags: ${youtube.tags?.length || 0} tags`);
    console.log(`   - Thumbnail Phrase: "${result.metadata.thumbnailPhrase}"`);
    console.log(`\n📁 Metadata guardada en:`);
    console.log(`   ${SEO_METADATA_DIR}\n`);
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
      log.issues.forEach(issue => console.log(`      - ${issue}`));
    });
    console.log('');
  }
}

async function main() {
  const verse = process.argv[2];

  if (!verse) {
    console.error('❌ Error: Debes proporcionar el versículo como argumento');
    console.error('Uso: node guardian-seo.js "Salmos 23:1"');
    process.exit(1);
  }

  const guardian = new SEOGuardian(verse);

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

module.exports = { SEOGuardian };
