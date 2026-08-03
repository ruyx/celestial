#!/usr/bin/env node

/**
 * 👼 GUARDIAN UPLOAD (FIXED)
 *
 * Valida que el video se subió exitosamente a YouTube
 *
 * CAMBIOS vs VERSIÓN ANTERIOR:
 * ✅ Lee datos de Agent 7 (final video), Agent 8 (SEO), Agent 9 (thumbnail)
 * ✅ Integra con upload-to-youtube-v2.js para upload real
 * ✅ Retorna JSON estructurado para n8n
 * ✅ Usa timestamp-based sorting (no alfabético)
 * ✅ NO hardcodea - todo fluye entre agentes
 *
 * ARQUITECTURA:
 * - Agent 7 → videos-completed-*.json + final-*.mp4 (video a subir)
 * - Agent 8 → youtube-metadata-*.json (título, descripción, tags)
 * - Agent 9 → thumbnail-*.json (thumbnail image)
 * - upload-to-youtube-v2.js → upload-result-*.json (videoId de YouTube)
 * - Guardian Upload → valida + sube + retorna JSON
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const YOUTUBE_METADATA_DIR = path.join(__dirname, '../output/youtube-metadata');
const VIDEO_METADATA_DIR = path.join(__dirname, '../output/video-metadata');
const THUMBNAIL_DIR = path.join(__dirname, '../output/thumbnails');

// Configuración
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos (upload puede tardar)

class GuardianUploadFIXED {
  constructor(verse) {
    this.verse = verse;
    this.verseSlug = verse.replace(/[:\s]/g, '-');

    // Datos de agentes upstream (NO HARDCODEADOS)
    this.finalVideoMetadata = null;
    this.seoMetadata = null;
    this.thumbnailMetadata = null;
    this.uploadResult = null;

    // Estado de validación
    this.uploadComplete = false;
    this.youtubeVideoId = null;
    this.youtubeUrl = null;
    this.retriesPerformed = 0;
    this.maxRetries = MAX_RETRIES;
    this.startTime = Date.now();
    this.errorLog = [];
  }

  /**
   * Helper: Encontrar archivo más reciente por timestamp
   */
  findLatestFile(directory, prefix, suffix = '.json') {
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory not found: ${directory}`);
    }

    const files = fs.readdirSync(directory)
      .filter(f => f.startsWith(prefix) && f.endsWith(suffix))
      .map(f => ({
        name: f,
        path: path.join(directory, f),
        timestamp: parseInt(f.match(/-(\d+)\.(json|jpg|png)$/)?.[1] || '0')
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    if (files.length === 0) {
      throw new Error(`No files found in ${directory} with prefix "${prefix}"`);
    }

    return files[0];
  }

  /**
   * 1. Cargar datos de Agent 7 (Final Video)
   */
  loadFinalVideoMetadata() {
    console.log('\n📹 Cargando datos de Agent 7 (Final Video)...');

    try {
      const latestCompleted = this.findLatestFile(VIDEO_METADATA_DIR, 'videos-completed-');
      console.log(`   ✅ Final video metadata encontrado: ${latestCompleted.name}`);

      this.finalVideoMetadata = JSON.parse(fs.readFileSync(latestCompleted.path, 'utf-8'));

      console.log(`   📊 Status: ${this.finalVideoMetadata.status || 'unknown'}`);
      console.log(`   📁 Final video path: ${this.finalVideoMetadata.finalVideoPath || 'N/A'}`);

    } catch (error) {
      console.log(`   ⚠️  No final video metadata found: ${error.message}`);
      this.finalVideoMetadata = null;
    }
  }

  /**
   * 2. Cargar datos de Agent 8 (SEO Metadata)
   */
  loadSEOMetadata() {
    console.log('\n🎯 Cargando datos de Agent 8 (SEO Metadata)...');

    try {
      const latestSEO = this.findLatestFile(YOUTUBE_METADATA_DIR, 'youtube-metadata-');
      console.log(`   ✅ SEO metadata encontrado: ${latestSEO.name}`);

      this.seoMetadata = JSON.parse(fs.readFileSync(latestSEO.path, 'utf-8'));

      console.log(`   📊 Title: ${this.seoMetadata.seoTitle || 'N/A'}`);
      console.log(`   📊 Tags: ${(this.seoMetadata.tags || []).length} tags`);

    } catch (error) {
      console.log(`   ⚠️  No SEO metadata found: ${error.message}`);
      this.seoMetadata = null;
    }
  }

  /**
   * 3. Cargar datos de Agent 9 (Thumbnail)
   */
  loadThumbnailMetadata() {
    console.log('\n🖼️  Cargando datos de Agent 9 (Thumbnail)...');

    try {
      // Buscar tanto archivo .json como .jpg/.png
      if (fs.existsSync(THUMBNAIL_DIR)) {
        const thumbnailFiles = fs.readdirSync(THUMBNAIL_DIR)
          .filter(f => f.startsWith('thumbnail-') && f.includes(this.verseSlug));

        if (thumbnailFiles.length > 0) {
          console.log(`   ✅ Thumbnail files encontrados: ${thumbnailFiles.join(', ')}`);
          this.thumbnailMetadata = { files: thumbnailFiles };
        } else {
          console.log('   ⚠️  No thumbnail files found');
          this.thumbnailMetadata = null;
        }
      }

    } catch (error) {
      console.log(`   ⚠️  Error loading thumbnail: ${error.message}`);
      this.thumbnailMetadata = null;
    }
  }

  /**
   * 4. Cargar resultado de upload (si existe)
   */
  loadUploadResult() {
    console.log('\n📤 Cargando resultado de upload...');

    try {
      const latestUpload = this.findLatestFile(YOUTUBE_METADATA_DIR, 'upload-result-');
      console.log(`   ✅ Upload result encontrado: ${latestUpload.name}`);

      this.uploadResult = JSON.parse(fs.readFileSync(latestUpload.path, 'utf-8'));

      this.youtubeVideoId = this.uploadResult.videoId || this.uploadResult.youtubeVideoId || null;
      this.youtubeUrl = this.uploadResult.videoUrl || (this.youtubeVideoId ? `https://www.youtube.com/watch?v=${this.youtubeVideoId}` : null);

      console.log(`   📊 Video ID: ${this.youtubeVideoId || 'N/A'}`);
      console.log(`   📊 URL: ${this.youtubeUrl || 'N/A'}`);

      return true;

    } catch (error) {
      console.log(`   ⚠️  No upload result found: ${error.message}`);
      this.uploadResult = null;
      return false;
    }
  }

  /**
   * 5. Validar que el upload fue exitoso
   */
  validateUpload() {
    console.log('\n🔍 Validando upload a YouTube...');

    const issues = [];

    // Verificar upload result
    if (!this.uploadResult) {
      console.log('   ❌ No upload result found');
      issues.push('missing_upload_result');
    } else {
      // Verificar video ID
      if (!this.youtubeVideoId || this.youtubeVideoId.trim() === '') {
        console.log('   ❌ Missing YouTube video ID');
        issues.push('missing_youtube_video_id');
      }

      // Verificar status
      if (this.uploadResult.status && this.uploadResult.status !== 'uploaded') {
        console.log(`   ❌ Upload status: ${this.uploadResult.status}`);
        issues.push(`status_${this.uploadResult.status}`);
      }

      // Verificar error messages
      if (this.uploadResult.error) {
        console.log(`   ❌ Upload error: ${this.uploadResult.error}`);
        issues.push(`upload_error: ${this.uploadResult.error}`);
      }

      if (issues.length === 0) {
        console.log('   ✅ Upload successful!');
        console.log(`   🎥 YouTube URL: ${this.youtubeUrl}`);
      }
    }

    this.uploadComplete = issues.length === 0;

    console.log(`\n📊 Resumen de validación:`);
    console.log(`   Total issues: ${issues.length}`);
    console.log(`   Upload completo: ${this.uploadComplete ? '✅' : '❌'}`);

    return {
      valid: this.uploadComplete,
      issues: issues
    };
  }

  /**
   * 6. Ejecutar upload a YouTube usando upload-to-youtube-v2.js
   */
  async executeUpload() {
    if (this.uploadComplete) {
      console.log('\n✅ Upload ya existe y es válido - skip upload');
      return true;
    }

    console.log('\n🔧 Ejecutando upload a YouTube...');

    try {
      // Ejecutar upload-to-youtube-v2.js
      console.log('\n📤 Ejecutando upload-to-youtube-v2.js...');

      const uploadOutput = execSync(
        `node upload-to-youtube-v2.js "${this.verse}"`,
        {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 30 * 60 * 1000, // 30 minutos
          cwd: path.join(__dirname, '..')
        }
      );

      console.log(uploadOutput);

      // Recargar upload result después de upload
      console.log('\n🔄 Recargando upload result después de upload...');
      this.loadUploadResult();

      // Validar nuevamente
      const validation = this.validateUpload();

      if (validation.valid) {
        console.log('\n✅ Upload exitoso - video publicado en YouTube');
        return true;
      } else {
        console.log(`\n⚠️  Upload parcial - aún hay ${validation.issues.length} issues`);
        this.errorLog.push(`Upload incomplete: ${validation.issues.join(', ')}`);
        return false;
      }

    } catch (error) {
      console.error(`\n❌ Error ejecutando upload: ${error.message}`);
      this.errorLog.push(`Upload failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 7. Proteger con retry automático
   */
  async protect() {
    console.log('👼 Guardian Upload (FIXED) - Iniciando protección');
    console.log('====================================================\n');
    console.log(`📖 Versículo: "${this.verse}"`);

    try {
      // Paso 1: Cargar datos de agentes upstream
      this.loadFinalVideoMetadata();
      this.loadSEOMetadata();
      this.loadThumbnailMetadata();

      // Paso 2: Cargar upload result (si existe)
      const hasUploadResult = this.loadUploadResult();

      // Paso 3: Validar upload
      let validation = this.validateUpload();

      // Paso 4: Ejecutar upload si no está completo (con retry)
      while (!validation.valid && this.retriesPerformed < this.maxRetries) {
        // Verificar timeout
        if (Date.now() - this.startTime > TIMEOUT_MS) {
          throw new Error(`Timeout: ${TIMEOUT_MS / 1000}s exceeded`);
        }

        this.retriesPerformed++;
        console.log(`\n🔄 Intento de upload ${this.retriesPerformed}/${this.maxRetries}`);

        const success = await this.executeUpload();

        if (success) {
          break;
        }

        // Revalidar
        validation = this.validateUpload();

        if (this.retriesPerformed >= this.maxRetries && !validation.valid) {
          throw new Error(`Max retries reached (${this.maxRetries}). Upload still incomplete: ${validation.issues.join(', ')}`);
        }
      }

      // Paso 5: Resultado final
      console.log('\n✅ Guardian Upload completado exitosamente');
      console.log(`   Upload completo: ${this.uploadComplete ? '✅' : '❌'}`);
      console.log(`   YouTube Video ID: ${this.youtubeVideoId || 'N/A'}`);
      console.log(`   YouTube URL: ${this.youtubeUrl || 'N/A'}`);
      console.log(`   Reintentos realizados: ${this.retriesPerformed}`);

      const result = {
        success: true,
        verse: this.verse,
        guardianUploadSuccess: true,
        uploadComplete: this.uploadComplete,
        youtubeVideoId: this.youtubeVideoId,
        youtubeUrl: this.youtubeUrl,
        retriesPerformed: this.retriesPerformed,
        metadata: {
          finalVideoLoaded: !!this.finalVideoMetadata,
          seoMetadataLoaded: !!this.seoMetadata,
          thumbnailLoaded: !!this.thumbnailMetadata,
          uploadResultLoaded: !!this.uploadResult
        }
      };

      console.log('\n📋 JSON Output (for n8n):');
      console.log(JSON.stringify(result, null, 2));

      return result;

    } catch (error) {
      console.error('\n❌ Guardian Upload FAILED');
      console.error(`   Error: ${error.message}`);

      const result = {
        success: false,
        verse: this.verse,
        guardianUploadSuccess: false,
        error: error.message,
        errorLog: this.errorLog,
        retriesPerformed: this.retriesPerformed
      };

      console.log('\n📋 JSON Output (error):');
      console.log(JSON.stringify(result, null, 2));

      throw error;
    }
  }
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  const verse = process.argv[2];

  if (!verse) {
    console.error('❌ Error: Verse parameter required');
    console.error('Usage: node guardian-upload-FIXED.js "Juan 3:16"');
    process.exit(1);
  }

  const guardian = new GuardianUploadFIXED(verse);

  guardian.protect()
    .then(result => {
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { GuardianUploadFIXED };
