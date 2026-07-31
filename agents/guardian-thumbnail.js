#!/usr/bin/env node

/**
 * 👼 GUARDIAN AGENT: Thumbnail Protector
 *
 * Responsabilidades:
 * - Validar que el thumbnail se generó correctamente
 * - Verificar dimensiones (1280x720 YouTube)
 * - Detectar errores de imagen corrupta
 * - Reintentar generación si falla
 */

const fs = require('fs');
const path = require('path');

// Configuración
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 3000;
const MAX_DELAY_MS = 30000;
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

const THUMBNAILS_DIR = path.join(__dirname, '..', 'output', 'thumbnails');

const ERROR_TYPES = {
  MISSING_FILE: 'missing_file',
  FILE_TOO_SMALL: 'file_too_small',
  INVALID_DIMENSIONS: 'invalid_dimensions',
  MISSING_METADATA: 'missing_metadata',
  UNKNOWN: 'unknown'
};

class ThumbnailGuardian {
  constructor(verse) {
    this.verse = verse;
    this.startTime = Date.now();
    this.retryCount = 0;
    this.errorLog = [];
  }

  async protect() {
    console.log('\n👼 GUARDIAN AGENT: Thumbnail Protector');
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
        throw new Error(`⏱️ TIMEOUT: Superados ${TIMEOUT_MS / 1000}s sin completar thumbnail`);
      }

      console.log(`\n🔍 Intento ${this.retryCount + 1}/${MAX_RETRIES}`);
      console.log('─'.repeat(60));

      // 1. Buscar thumbnail
      const thumbnailFile = this.findThumbnail();
      const metadataFile = this.findMetadata();

      // 2. Validar
      const validation = this.validateThumbnail(thumbnailFile, metadataFile);

      if (validation.isComplete) {
        console.log('\n✅ ¡THUMBNAIL COMPLETADO!\n');
        return {
          success: true,
          thumbnailPath: thumbnailFile,
          metadataPath: metadataFile,
          totalRetries: this.retryCount,
          duration: Date.now() - this.startTime,
          errorLog: this.errorLog
        };
      }

      // 3. Analizar error
      console.log(`\n❌ Thumbnail incompleto: ${validation.reason}`);
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

    throw new Error(`❌ FALLO: Superados ${MAX_RETRIES} reintentos. Thumbnail no completado.`);
  }

  findThumbnail() {
    try {
      const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');

      if (!fs.existsSync(THUMBNAILS_DIR)) {
        return null;
      }

      const files = fs.readdirSync(THUMBNAILS_DIR)
        .filter(f => f.includes(verseForFilename) && (f.endsWith('.jpg') || f.endsWith('.png')))
        .sort();

      if (files.length === 0) {
        return null;
      }

      const latestFile = files[files.length - 1];
      const filePath = path.join(THUMBNAILS_DIR, latestFile);

      console.log(`📂 Thumbnail: ${latestFile}`);
      return filePath;
    } catch (error) {
      console.error(`❌ Error buscando thumbnail: ${error.message}`);
      return null;
    }
  }

  findMetadata() {
    try {
      const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');
      const metadataDir = path.join(__dirname, '..', 'output', 'thumbnail-metadata');

      if (!fs.existsSync(metadataDir)) {
        return null;
      }

      const files = fs.readdirSync(metadataDir)
        .filter(f => f.includes(verseForFilename) && f.endsWith('.json'))
        .sort();

      if (files.length === 0) {
        return null;
      }

      return path.join(metadataDir, files[files.length - 1]);
    } catch (error) {
      return null;
    }
  }

  validateThumbnail(thumbnailPath, metadataPath) {
    const issues = [];

    // Verificar que existe
    if (!thumbnailPath || !fs.existsSync(thumbnailPath)) {
      issues.push('missing_thumbnail_file');
      return {
        isComplete: false,
        reason: issues.join(', ')
      };
    }

    // Verificar tamaño (mínimo 50KB)
    const stats = fs.statSync(thumbnailPath);
    const sizeKB = stats.size / 1024;
    if (sizeKB < 50) {
      issues.push(`file_too_small: ${sizeKB.toFixed(2)}KB`);
    }

    // Verificar metadata
    if (metadataPath && fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

        if (!metadata.thumbnailPath || metadata.thumbnailPath.trim() === '') {
          issues.push('metadata_missing_thumbnail_path');
        }

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
      thumbnailPath: thumbnailPath,
      metadataPath: metadataPath,
      fileSizeKB: sizeKB
    };
  }

  analyzeErrors(validation) {
    const reason = validation.reason.toLowerCase();
    let primaryType = ERROR_TYPES.UNKNOWN;

    if (reason.includes('missing_thumbnail_file')) {
      primaryType = ERROR_TYPES.MISSING_FILE;
    } else if (reason.includes('file_too_small')) {
      primaryType = ERROR_TYPES.FILE_TOO_SMALL;
    } else if (reason.includes('dimensions')) {
      primaryType = ERROR_TYPES.INVALID_DIMENSIONS;
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

    if (primaryType === ERROR_TYPES.FILE_TOO_SMALL) {
      return {
        shouldStop: false,
        description: 'Regenerar thumbnail - archivo corrupto',
        waitMultiplier: 1.5
      };
    }

    if (primaryType === ERROR_TYPES.MISSING_FILE) {
      return {
        shouldStop: false,
        description: 'Esperando generación de thumbnail',
        waitMultiplier: 1.5
      };
    }

    return {
      shouldStop: false,
      description: 'Reintentar estándar',
      waitMultiplier: 1
    };
  }

  async executeRetry(strategy) {
    console.log(`\n🔧 Ejecutando retry para thumbnail con compositor Python V2...`);
    console.log(`   - Directorio: ${THUMBNAILS_DIR}`);

    // ESTRATEGIA: Usar compositor Python V2 directamente
    // El agent-9-production requiere Magnific MCP interactivo
    // Para flujos automáticos, usamos el compositor standalone

    const { execSync } = require('child_process');

    try {
      // 1. Verificar que exista metadata con thumbnailPhrase
      const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');
      const metadataPath = path.join(__dirname, '..', 'output', 'youtube-metadata', `youtube-metadata-${verseForFilename}.json`);

      if (!fs.existsSync(metadataPath)) {
        throw new Error(`Metadata no encontrada: ${metadataPath}`);
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      if (!metadata.thumbnailPhrase) {
        throw new Error('metadata.thumbnailPhrase no existe. Ejecutar Agent-8 primero.');
      }

      // 2. Verificar imagen base (debe ser generada por Agent-3/4)
      const baseImagePath = path.join(__dirname, '..', 'output', 'base-images', `base-${verseForFilename}.png`);

      if (!fs.existsSync(baseImagePath)) {
        throw new Error(`Imagen base no encontrada: ${baseImagePath}. Ejecutar Agent-3/4 primero.`);
      }

      // 3. Ejecutar compositor Python V2
      const outputPath = path.join(__dirname, '..', 'output', 'thumbnails', `thumbnail-${verseForFilename}.jpg`);

      const result = execSync(
        `python3 compose-thumbnail-pillow-v2.py "${baseImagePath}" "${metadata.thumbnailPhrase}" "${metadata.category}" "${outputPath}"`,
        {
          encoding: 'utf-8',
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        }
      );

      console.log(`✅ Compositor Python V2 completado: ${outputPath}`);

      return { success: true, thumbnailPath: outputPath };
    } catch (error) {
      throw new Error(`Compositor Python V2 falló: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reportSuccess(result) {
    const duration = result.duration / 1000;
    const thumbnailSize = result.thumbnailPath ? (fs.statSync(result.thumbnailPath).size / 1024).toFixed(2) : 'N/A';

    console.log('\n╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '✅ GUARDIAN: ÉXITO' + ' '.repeat(22) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Duración: ${duration.toFixed(2)}s`);
    console.log(`   - Reintentos: ${result.totalRetries}`);
    console.log(`   - Thumbnail path: ${result.thumbnailPath}`);
    console.log(`   - Tamaño: ${thumbnailSize}KB`);
    console.log(`\n📁 Thumbnail guardado en:`);
    console.log(`   ${THUMBNAILS_DIR}\n`);
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
    console.error('Uso: node guardian-thumbnail.js "Salmos 23:1"');
    process.exit(1);
  }

  const guardian = new ThumbnailGuardian(verse);

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

module.exports = { ThumbnailGuardian };
