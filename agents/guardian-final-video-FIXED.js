#!/usr/bin/env node

/**
 * 👼 GUARDIAN FINAL VIDEO (FIXED)
 *
 * Valida que el video final compilado existe y es válido
 *
 * CAMBIOS vs VERSIÓN ANTERIOR:
 * ✅ Lee datos de Agent 5 (video clips) y Agent 6 (audio)
 * ✅ Integra con Agent 7 para regeneración real
 * ✅ Retorna JSON estructurado para n8n
 * ✅ Usa timestamp-based sorting (no alfabético)
 * ✅ NO hardcodea - todo fluye entre agentes
 *
 * ARQUITECTURA:
 * - Agent 5 → video-*.json (clips individuales)
 * - Agent 6 → audio-*.json (audio files)
 * - Agent 7 → videos-completed-*.json + final-*.mp4 (video concatenado)
 * - Guardian Final Video → valida + regenera + retorna JSON
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FINAL_VIDEOS_DIR = path.join(__dirname, '../output/final-videos');
const VIDEO_METADATA_DIR = path.join(__dirname, '../output/video-metadata');
const AUDIO_METADATA_DIR = path.join(__dirname, '../output/audio-metadata');

// Configuración
const MAX_RETRIES = 3;
const TIMEOUT_MS = 20 * 60 * 1000; // 20 minutos
const MIN_FILE_SIZE_KB = 100; // Videos muy pequeños están corruptos

class GuardianFinalVideoFIXED {
  constructor(verse) {
    this.verse = verse;
    this.verseSlug = verse.replace(/[:\s]/g, '-');

    // Datos de agentes upstream (NO HARDCODEADOS)
    this.videoClipsMetadata = null;
    this.audioMetadata = null;
    this.finalVideoMetadata = null;

    // Estado de validación
    this.finalVideoValid = false;
    this.finalVideoPath = null;
    this.retriesPerformed = 0;
    this.maxRetries = MAX_RETRIES;
    this.startTime = Date.now();
    this.errorLog = [];
  }

  /**
   * Helper: Encontrar archivo más reciente por timestamp FILTRADO POR VERSÍCULO
   */
  findLatestFile(directory, prefix, suffix = '.json') {
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory not found: ${directory}`);
    }

    // CRÍTICO: Convertir versículo a formato de filename para filtrado correcto
    const verseFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');

    const files = fs.readdirSync(directory)
      .filter(f => {
        // Filtro 1: Debe empezar con el prefix
        if (!f.startsWith(prefix)) return false;

        // Filtro 2: Debe terminar con el suffix
        if (!f.endsWith(suffix)) return false;

        // Filtro 3: CRÍTICO - Debe contener el versículo específico
        // Ejemplo: "video-Salmos-23-1-1785754802924.json" debe coincidir con "Salmos-23-1"
        if (!f.includes(verseFilename)) return false;

        return true;
      })
      .map(f => ({
        name: f,
        path: path.join(directory, f),
        timestamp: parseInt(f.match(/-(\d+)\.(json|mp4)$/)?.[1] || '0')
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    if (files.length === 0) {
      throw new Error(`No files found in ${directory} with prefix "${prefix}" for verse "${verseFilename}"`);
    }

    return files[0];
  }

  /**
   * 1. Cargar datos de Agent 5 (Video Clips)
   * NOTA: Busca tanto "video-" como "videos-" debido a inconsistencia de nomenclatura
   */
  loadVideoClipsMetadata() {
    console.log('\n🎬 Cargando datos de Agent 5 (Video Clips)...');

    try {
      let latestVideo;

      // Intentar primero con "video-" (singular - nomenclatura más común)
      try {
        latestVideo = this.findLatestFile(VIDEO_METADATA_DIR, 'video-');
        console.log(`   ✅ Video clips metadata encontrado (video-): ${latestVideo.name}`);
      } catch (e1) {
        // Si falla, intentar con "videos-" (plural - nomenclatura alternativa)
        try {
          latestVideo = this.findLatestFile(VIDEO_METADATA_DIR, 'videos-');
          console.log(`   ✅ Video clips metadata encontrado (videos-): ${latestVideo.name}`);
        } catch (e2) {
          throw new Error(`No se encontró metadata de video con prefijos "video-" ni "videos-" para versículo "${this.verse}"`);
        }
      }

      this.videoClipsMetadata = JSON.parse(fs.readFileSync(latestVideo.path, 'utf-8'));

      // Soportar tanto "clips" como "videos" debido a variaciones en metadata
      const clips = this.videoClipsMetadata.clips || this.videoClipsMetadata.videos || [];
      console.log(`   📊 Clips disponibles: ${clips.length}`);

    } catch (error) {
      console.log(`   ⚠️  No video clips metadata found: ${error.message}`);
      this.videoClipsMetadata = null;
    }
  }

  /**
   * 2. Cargar datos de Agent 6 (Audio)
   */
  loadAudioMetadata() {
    console.log('\n🎤 Cargando datos de Agent 6 (Audio)...');

    try {
      const latestAudio = this.findLatestFile(AUDIO_METADATA_DIR, 'audio-');
      console.log(`   ✅ Audio metadata encontrado: ${latestAudio.name}`);

      this.audioMetadata = JSON.parse(fs.readFileSync(latestAudio.path, 'utf-8'));

      const audioFiles = this.audioMetadata.audioFiles || this.audioMetadata.scenes || [];
      console.log(`   📊 Audio files disponibles: ${audioFiles.length}`);

    } catch (error) {
      console.log(`   ⚠️  No audio metadata found: ${error.message}`);
      this.audioMetadata = null;
    }
  }

  /**
   * 3. Cargar metadata de video final (Agent 7)
   */
  loadFinalVideoMetadata() {
    console.log('\n📹 Cargando metadata de video final (Agent 7)...');

    try {
      const latestCompleted = this.findLatestFile(VIDEO_METADATA_DIR, 'videos-completed-');
      console.log(`   ✅ Final video metadata encontrado: ${latestCompleted.name}`);

      this.finalVideoMetadata = JSON.parse(fs.readFileSync(latestCompleted.path, 'utf-8'));

      console.log(`   📊 Status: ${this.finalVideoMetadata.status || 'unknown'}`);
      console.log(`   📁 Final video path: ${this.finalVideoMetadata.finalVideoPath || 'N/A'}`);

      return true;

    } catch (error) {
      console.log(`   ⚠️  No final video metadata found: ${error.message}`);
      this.finalVideoMetadata = null;
      return false;
    }
  }

  /**
   * 4. Validar que el video final existe y es válido
   */
  validateFinalVideo() {
    console.log('\n🔍 Validando video final...');

    const issues = [];

    // Verificar metadata
    if (!this.finalVideoMetadata) {
      console.log('   ❌ No final video metadata found');
      issues.push('missing_metadata');
    } else {
      // Verificar status
      if (this.finalVideoMetadata.status && this.finalVideoMetadata.status !== 'completed') {
        console.log(`   ❌ Final video status: ${this.finalVideoMetadata.status}`);
        issues.push(`status_${this.finalVideoMetadata.status}`);
      }

      // Verificar finalVideoPath
      if (!this.finalVideoMetadata.finalVideoPath || this.finalVideoMetadata.finalVideoPath.trim() === '') {
        console.log('   ❌ Missing finalVideoPath in metadata');
        issues.push('missing_final_video_path');
      } else {
        this.finalVideoPath = this.finalVideoMetadata.finalVideoPath;
      }
    }

    // Verificar que el archivo existe
    if (!this.finalVideoPath) {
      // Intentar buscar por patrón
      console.log('   🔍 Buscando video final por patrón...');
      try {
        if (fs.existsSync(FINAL_VIDEOS_DIR)) {
          const files = fs.readdirSync(FINAL_VIDEOS_DIR)
            .filter(f => f.startsWith('final-') && f.includes(this.verseSlug) && f.endsWith('.mp4'))
            .map(f => ({
              name: f,
              path: path.join(FINAL_VIDEOS_DIR, f),
              timestamp: parseInt(f.match(/-(\d+)\.mp4$/)?.[1] || '0')
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

          if (files.length > 0) {
            this.finalVideoPath = files[0].path;
            console.log(`   ✅ Video encontrado: ${files[0].name}`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Error searching for video: ${error.message}`);
      }
    }

    if (!this.finalVideoPath || !fs.existsSync(this.finalVideoPath)) {
      console.log('   ❌ Final video file does not exist');
      issues.push('missing_video_file');
    } else {
      // Verificar tamaño (mínimo 100KB - videos muy pequeños están corruptos)
      const stats = fs.statSync(this.finalVideoPath);
      const sizeKB = stats.size / 1024;
      const sizeMB = sizeKB / 1024;

      console.log(`   📊 Video file size: ${sizeMB.toFixed(2)} MB`);

      if (sizeKB < MIN_FILE_SIZE_KB) {
        console.log(`   ❌ File too small: ${sizeKB.toFixed(2)} KB (corrupted)`);
        issues.push(`file_too_small_${sizeKB.toFixed(2)}KB`);
      } else {
        console.log('   ✅ Valid video file found');
      }
    }

    this.finalVideoValid = issues.length === 0;

    console.log(`\n📊 Resumen de validación:`);
    console.log(`   Total issues: ${issues.length}`);
    console.log(`   Video válido: ${this.finalVideoValid ? '✅' : '❌'}`);

    return {
      valid: this.finalVideoValid,
      issues: issues
    };
  }

  /**
   * 5. Regenerar video final usando Agent 7
   */
  async regenerateFinalVideo() {
    if (this.finalVideoValid) {
      console.log('\n✅ Video final ya existe y es válido - skip regeneration');
      return true;
    }

    console.log('\n🔧 Regenerando video final...');

    try {
      // Ejecutar Agent 7 (usa el script run-agent-7.sh como hace agent-server.js)
      console.log('\n🎬 Ejecutando Agent 7 (Video Editor)...');

      const agent7Output = execSync(
        `bash run-agent-7.sh "${this.verse}"`,
        {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 20 * 60 * 1000, // 20 minutos
          cwd: path.join(__dirname, '..')
        }
      );

      console.log(agent7Output);

      // Recargar final video metadata después de regenerar
      console.log('\n🔄 Recargando final video metadata después de regeneración...');
      this.loadFinalVideoMetadata();

      // Validar nuevamente
      const validation = this.validateFinalVideo();

      if (validation.valid) {
        console.log('\n✅ Regeneración exitosa - video final ahora existe');
        return true;
      } else {
        console.log(`\n⚠️  Regeneración parcial - aún hay ${validation.issues.length} issues`);
        this.errorLog.push(`Regeneration incomplete: ${validation.issues.join(', ')}`);
        return false;
      }

    } catch (error) {
      console.error(`\n❌ Error regenerando video final: ${error.message}`);
      this.errorLog.push(`Regeneration failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 6. Proteger con retry automático
   */
  async protect() {
    console.log('👼 Guardian Final Video (FIXED) - Iniciando protección');
    console.log('====================================================\n');
    console.log(`📖 Versículo: "${this.verse}"`);

    try {
      // Paso 1: Cargar datos de agentes upstream
      this.loadVideoClipsMetadata();
      this.loadAudioMetadata();

      // Paso 2: Cargar metadata de video final (si existe)
      const hasFinalVideoMetadata = this.loadFinalVideoMetadata();

      // Paso 3: Validar video final
      let validation = this.validateFinalVideo();

      // Paso 4: Regenerar si no es válido (con retry)
      while (!validation.valid && this.retriesPerformed < this.maxRetries) {
        // Verificar timeout
        if (Date.now() - this.startTime > TIMEOUT_MS) {
          throw new Error(`Timeout: ${TIMEOUT_MS / 1000}s exceeded`);
        }

        this.retriesPerformed++;
        console.log(`\n🔄 Intento de regeneración ${this.retriesPerformed}/${this.maxRetries}`);

        const success = await this.regenerateFinalVideo();

        if (success) {
          break;
        }

        // Revalidar
        validation = this.validateFinalVideo();

        if (this.retriesPerformed >= this.maxRetries && !validation.valid) {
          throw new Error(`Max retries reached (${this.maxRetries}). Final video still invalid: ${validation.issues.join(', ')}`);
        }
      }

      // Paso 5: Resultado final
      console.log('\n✅ Guardian Final Video completado exitosamente');
      console.log(`   Video válido: ${this.finalVideoValid ? '✅' : '❌'}`);
      console.log(`   Video path: ${this.finalVideoPath || 'N/A'}`);
      console.log(`   Reintentos realizados: ${this.retriesPerformed}`);

      const stats = this.finalVideoPath && fs.existsSync(this.finalVideoPath)
        ? fs.statSync(this.finalVideoPath)
        : null;

      const result = {
        success: true,
        verse: this.verse,
        guardianFinalVideoSuccess: true,
        finalVideoValid: this.finalVideoValid,
        finalVideoPath: this.finalVideoPath,
        fileSizeMB: stats ? (stats.size / 1024 / 1024).toFixed(2) : null,
        retriesPerformed: this.retriesPerformed,
        metadata: {
          videoClipsLoaded: !!this.videoClipsMetadata,
          audioMetadataLoaded: !!this.audioMetadata,
          finalVideoMetadataLoaded: !!this.finalVideoMetadata
        }
      };

      console.log('\n📋 JSON Output (for n8n):');
      console.log(JSON.stringify(result, null, 2));

      return result;

    } catch (error) {
      console.error('\n❌ Guardian Final Video FAILED');
      console.error(`   Error: ${error.message}`);

      const result = {
        success: false,
        verse: this.verse,
        guardianFinalVideoSuccess: false,
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
    console.error('Usage: node guardian-final-video-FIXED.js "Juan 3:16"');
    process.exit(1);
  }

  const guardian = new GuardianFinalVideoFIXED(verse);

  guardian.protect()
    .then(result => {
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { GuardianFinalVideoFIXED };
