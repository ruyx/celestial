#!/usr/bin/env node

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎨 AGENT 9 PRODUCTION: THUMBNAIL GENERATOR - HARDENED VERSION
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * CARACTERÍSTICAS DE PRODUCCIÓN:
 * ✅ Validación de inputs (verso, metadata)
 * ✅ Retry con exponential backoff
 * ✅ Error recovery automático
 * ✅ Logging estructurado (JSON + console)
 * ✅ Health checks
 * ✅ Timeouts configurables
 * ✅ Graceful degradation
 * ✅ Métricas de performance
 *
 * ARQUITECTURA HÍBRIDA:
 * - PASO 1: Imagen Base SIN texto (Recraft V4.1 via Magnific MCP)
 * - PASO 2: Texto Overlay Programático (Sharp - compose-thumbnail.js)
 *
 * USAGE:
 *   node agents/agent-9-thumbnail-generator-production.js "Salmos 23:1"
 *   node agents/agent-9-thumbnail-generator-production.js "Salmos 23:1" --retry 3
 *
 * RETURN CODES:
 *   0 = Success
 *   1 = Input validation failed
 *   2 = Metadata not found
 *   3 = Image generation failed (after retries)
 *   4 = Text composition failed
 *   5 = Timeout
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════
// 📋 CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // Retry strategy
  MAX_RETRIES: parseInt(process.env.AGENT9_MAX_RETRIES || '3'),
  RETRY_DELAY_MS: parseInt(process.env.AGENT9_RETRY_DELAY || '2000'),
  RETRY_BACKOFF_FACTOR: parseFloat(process.env.AGENT9_BACKOFF_FACTOR || '2'),

  // Timeouts
  IMAGE_DOWNLOAD_TIMEOUT_MS: parseInt(process.env.AGENT9_DOWNLOAD_TIMEOUT || '120000'), // 2min
  COMPOSE_TIMEOUT_MS: parseInt(process.env.AGENT9_COMPOSE_TIMEOUT || '30000'), // 30s

  // Paths
  YOUTUBE_METADATA_DIR: path.join(__dirname, '..', 'output', 'youtube-metadata'),
  THUMBNAILS_DIR: path.join(__dirname, '..', 'output', 'thumbnails'),
  LOGS_DIR: path.join(__dirname, '..', 'logs', 'agent-9'),

  // Features
  ENABLE_METRICS: process.env.AGENT9_METRICS !== 'false',
  ENABLE_JSON_LOGS: process.env.AGENT9_JSON_LOGS !== 'false',
  FALLBACK_TO_DEFAULT_CATEGORY: true
};

// Asegurar directorios
[CONFIG.THUMBNAILS_DIR, CONFIG.LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🔧 LOGGER ESTRUCTURADO
// ═══════════════════════════════════════════════════════════════

class Logger {
  constructor(verse) {
    this.verse = verse;
    this.sessionId = `agent9-${Date.now()}`;
    this.startTime = Date.now();
    this.logs = [];
  }

  log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      verse: this.verse,
      level,
      message,
      ...metadata
    };

    this.logs.push(logEntry);

    // Console output con formato
    const emoji = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'debug': '🐛'
    }[level] || 'ℹ️';

    console.log(`${emoji} [${level.toUpperCase()}] ${message}`);

    if (Object.keys(metadata).length > 0 && level !== 'debug') {
      console.log('   ' + JSON.stringify(metadata, null, 2).replace(/\n/g, '\n   '));
    }
  }

  info(message, metadata) { this.log('info', message, metadata); }
  success(message, metadata) { this.log('success', message, metadata); }
  warning(message, metadata) { this.log('warning', message, metadata); }
  error(message, metadata) { this.log('error', message, metadata); }
  debug(message, metadata) {
    if (process.env.DEBUG) this.log('debug', message, metadata);
  }

  saveLogs() {
    if (!CONFIG.ENABLE_JSON_LOGS) return;

    const logPath = path.join(
      CONFIG.LOGS_DIR,
      `session-${this.sessionId}.json`
    );

    const summary = {
      sessionId: this.sessionId,
      verse: this.verse,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      durationMs: Date.now() - this.startTime,
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(l => l.level === 'error').length,
      warningCount: this.logs.filter(l => l.level === 'warning').length,
      logs: this.logs
    };

    fs.writeFileSync(logPath, JSON.stringify(summary, null, 2));
    this.debug('Logs guardados', { logPath });
  }
}

// ═══════════════════════════════════════════════════════════════
// ✅ VALIDADORES
// ═══════════════════════════════════════════════════════════════

class Validator {
  static validateVerse(verse) {
    if (!verse || typeof verse !== 'string') {
      return { valid: false, error: 'Verso debe ser un string no vacío' };
    }

    // Formato esperado: "Libro Capítulo:Versículo" (ej: "Salmos 23:1")
    const verseRegex = /^[A-Za-zÁ-ÿ\s]+\s+\d+:\d+$/;
    if (!verseRegex.test(verse.trim())) {
      return {
        valid: false,
        error: `Formato inválido: "${verse}". Esperado: "Libro Capítulo:Versículo"`
      };
    }

    return { valid: true };
  }

  static validateMetadata(metadata) {
    const required = ['youtube', 'category'];
    const missing = required.filter(field => !metadata[field]);

    if (missing.length > 0) {
      return {
        valid: false,
        error: `Campos faltantes en metadata: ${missing.join(', ')}`
      };
    }

    if (!metadata.youtube.title) {
      return { valid: false, error: 'metadata.youtube.title es requerido' };
    }

    return { valid: true };
  }

  static validateCategory(category) {
    const validCategories = ['fortaleza', 'consuelo', 'esperanza', 'amor', 'sabiduria', 'fe'];

    if (!validCategories.includes(category)) {
      return {
        valid: false,
        error: `Categoría "${category}" inválida. Válidas: ${validCategories.join(', ')}`
      };
    }

    return { valid: true };
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔄 RETRY HANDLER
// ═══════════════════════════════════════════════════════════════

class RetryHandler {
  static async withRetry(fn, options = {}) {
    const {
      maxRetries = CONFIG.MAX_RETRIES,
      delayMs = CONFIG.RETRY_DELAY_MS,
      backoffFactor = CONFIG.RETRY_BACKOFF_FACTOR,
      operationName = 'operation',
      logger
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        if (logger && attempt > 1) {
          logger.info(`Reintentando ${operationName}`, { attempt, maxRetries: maxRetries + 1 });
        }

        return await fn(attempt);

      } catch (error) {
        lastError = error;

        if (attempt <= maxRetries) {
          const delay = delayMs * Math.pow(backoffFactor, attempt - 1);

          if (logger) {
            logger.warning(`${operationName} falló, reintentando en ${delay}ms`, {
              attempt,
              error: error.message,
              nextAttemptIn: delay
            });
          }

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `${operationName} falló después de ${maxRetries + 1} intentos: ${lastError.message}`
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// 🎨 CATEGORY VISUAL TEMPLATES
// ═══════════════════════════════════════════════════════════════

const CATEGORY_TEMPLATES = {
  consuelo: {
    emotion: 'DEEPLY EMOTIONAL expression, tears of relief streaming down face, eyes closed in profound peace, mouth slightly open as if releasing a deep breath of relief',
    backgroundColor: 'soft dark gradient from midnight blue to black',
    facePosition: 'center-right (40-50% of frame)',
    faceLook: 'looking upward with INTENSE emotional relief, face illuminated by divine light, tear on cheek catching the light',
    lightingStyle: 'DRAMATIC golden hour lighting from top, warm ethereal glow, heavenly atmosphere with visible light rays, cinematic high-contrast lighting',
    textColor: '#FFD700',
    textColorSecondary: '#FFFFFF',
    textStroke: '#000000',
    sceneDescription: 'Person in deeply emotional prayer, hands clasped to chest, tears of joy, profound relief expression, biblical comfort scene with dramatic lighting'
  },
  fortaleza: {
    emotion: 'FIERCE determined expression, intense focused eyes staring directly at camera, jaw set with unshakeable confidence, slight forward lean showing power',
    backgroundColor: 'deep navy blue gradient with DRAMATIC contrast lighting',
    facePosition: 'center (40-50% of frame)',
    faceLook: 'PIERCING direct eye contact with viewer, commanding presence, warrior intensity, eyebrows slightly furrowed with determination',
    lightingStyle: 'DRAMATIC rim lighting from side creating sharp highlights, blue and fiery orange tones, POWERFUL cinematic atmosphere, strong shadows defining facial features',
    textColor: '#FFA500',
    textColorSecondary: '#FFFFFF',
    textStroke: '#000000',
    sceneDescription: 'Biblical warrior or prophet in commanding pose, intense presence, David facing Goliath energy, powerful confident stance with dramatic backlight'
  },
  esperanza: {
    emotion: 'AWE-STRUCK hopeful expression, eyes WIDE with wonder looking toward brilliant light, mouth slightly open in amazement, face radiating pure hope',
    backgroundColor: 'dark gradient with BRILLIANT golden rays breaking through storm clouds',
    facePosition: 'center-left (40-50% of frame)',
    faceLook: 'looking toward BRILLIANT light source with AWE and HOPE, eyes reflecting the divine light, overwhelmed with hopeful wonder',
    lightingStyle: 'DRAMATIC sunburst from top-right, INTENSE golden hour with visible God rays, rays of divine hope piercing darkness, cinematic high-drama lighting',
    textColor: '#FFD700',
    textColorSecondary: '#FFFFFF',
    textStroke: '#000000',
    sceneDescription: 'Person experiencing breakthrough moment, face illuminated by divine sunrise breaking through darkness, hopeful biblical scene with DRAMATIC light contrast'
  },
  amor: {
    emotion: 'DEEPLY COMPASSIONATE expression, gentle tears of love, soft warm smile with eyes full of divine love, tender emotional vulnerability',
    backgroundColor: 'soft warm gradient from deep red to golden pink',
    facePosition: 'center-right (40-50% of frame)',
    faceLook: 'looking with PROFOUND warmth and compassion, eyes conveying unconditional divine love, gentle emotional intensity',
    lightingStyle: 'soft diffused WARM golden lighting, loving glow surrounding face, tender cinematic quality, warm emotional atmosphere',
    textColor: '#FFFFFF',
    textColorSecondary: '#FF6B6B',
    textStroke: '#8B0000',
    sceneDescription: 'Loving biblical scene, Jesus-like compassion, tender embrace moment, profound emotional connection, warm intimate biblical setting'
  },
  sabiduria: {
    emotion: 'PROFOUND contemplative expression, wise knowing eyes with depth of understanding, slight meaningful smile of divine wisdom, aged thoughtful face',
    backgroundColor: 'deep royal purple gradient with golden accents',
    facePosition: 'center-left (40-50% of frame)',
    faceLook: 'looking with DEEP wisdom and understanding, eyes conveying ancient biblical knowledge, contemplative gaze with slight knowing expression',
    lightingStyle: 'DRAMATIC side lighting creating strong shadows, purple and GOLDEN tones highlighting wisdom, sophisticated cinematic atmosphere',
    textColor: '#FFD700',
    textColorSecondary: '#FFFFFF',
    textStroke: '#000000',
    sceneDescription: 'Wise biblical elder or prophet, ancient scrolls visible, scholarly setting, deep contemplation, profound wisdom radiating from expression'
  },
  fe: {
    emotion: 'REVERENT worship expression, face lifted toward heaven with INTENSE devotion, eyes closed in profound spiritual connection, peaceful but POWERFUL faith',
    backgroundColor: 'soft teal to deep emerald gradient with divine light',
    facePosition: 'center-right (40-50% of frame)',
    faceLook: 'eyes closed or looking upward with INTENSE reverence, face bathed in divine light, expression of complete surrender and faith',
    lightingStyle: 'DIVINE light from above creating DRAMATIC illumination, soft ethereal glow, SPIRITUAL atmosphere with visible light beams, cinematic worship lighting',
    textColor: '#FFFFFF',
    textColorSecondary: '#90EE90',
    textStroke: '#2F4F2F',
    sceneDescription: 'Person in INTENSE worship, hands raised toward heaven, spiritual breakthrough moment, profound faith expression, biblical worship scene with dramatic divine lighting'
  }
};

// ═══════════════════════════════════════════════════════════════
// 🎬 MAIN GENERATOR CLASS
// ═══════════════════════════════════════════════════════════════

class ThumbnailGenerator {
  constructor(verse, logger) {
    this.verse = verse;
    this.logger = logger;
    this.metrics = {
      startTime: Date.now(),
      steps: {}
    };
  }

  async generate() {
    try {
      this.logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.info('🎨 AGENT 9 PRODUCTION: THUMBNAIL GENERATOR');
      this.logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.info('Iniciando generación', { verse: this.verse });

      // STEP 1: Validar input
      await this.validateInput();

      // STEP 2: Cargar metadata
      const metadata = await this.loadMetadata();

      // STEP 3: Generar prompt para imagen base - ACTUALIZADO: usa thumbnailDescription
      const basePrompt = this.generateBaseImagePrompt(metadata);

      // STEP 4: Retornar especificaciones para Claude Code
      const result = this.prepareResult(metadata, basePrompt);

      this.logger.success('Generación completada exitosamente');
      this.logMetrics();

      return result;

    } catch (error) {
      this.logger.error('Generación falló', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async validateInput() {
    const stepStart = Date.now();
    this.logger.info('STEP 1: Validando input');

    const validation = Validator.validateVerse(this.verse);
    if (!validation.valid) {
      throw new Error(`Validación falló: ${validation.error}`);
    }

    this.logger.success('Input válido', { verse: this.verse });
    this.metrics.steps.validation = Date.now() - stepStart;
  }

  async loadMetadata() {
    const stepStart = Date.now();
    this.logger.info('STEP 2: Cargando metadata');

    const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');

    // Buscar archivo de metadata con retry
    const metadataPath = await RetryHandler.withRetry(
      async () => {
        const files = fs.readdirSync(CONFIG.YOUTUBE_METADATA_DIR)
          .filter(file =>
            file.startsWith('youtube-metadata-') &&
            file.includes(verseForFilename)
          );

        if (files.length === 0) {
          throw new Error(`Metadata no encontrada para: ${this.verse}`);
        }

        return path.join(CONFIG.YOUTUBE_METADATA_DIR, files[0]);
      },
      {
        maxRetries: 2,
        delayMs: 1000,
        operationName: 'Búsqueda de metadata',
        logger: this.logger
      }
    );

    // Leer y validar metadata
    const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    const validation = Validator.validateMetadata(metadata);
    if (!validation.valid) {
      throw new Error(`Metadata inválida: ${validation.error}`);
    }

    // Validar categoría con fallback
    const categoryValidation = Validator.validateCategory(metadata.category);
    if (!categoryValidation.valid) {
      if (CONFIG.FALLBACK_TO_DEFAULT_CATEGORY) {
        this.logger.warning(
          `Categoría inválida "${metadata.category}", usando "consuelo" por defecto`,
          { originalCategory: metadata.category }
        );
        metadata.category = 'consuelo';
      } else {
        throw new Error(categoryValidation.error);
      }
    }

    this.logger.success('Metadata cargada', {
      category: metadata.category,
      title: metadata.youtube.title,
      metadataPath
    });

    this.metrics.steps.loadMetadata = Date.now() - stepStart;
    return metadata;
  }

  generateBaseImagePrompt(metadata) {
    const stepStart = Date.now();
    this.logger.info('STEP 3: Generando prompt para imagen base');

    const category = metadata.category;
    const template = CATEGORY_TEMPLATES[category];

    // ✅ NUEVO: Usar thumbnailDescription de Agent 1 si existe
    let subjectDescription;
    if (metadata.thumbnailDescription && metadata.thumbnailDescription.subject) {
      subjectDescription = metadata.thumbnailDescription.subject;
      this.logger.success('Usando thumbnailDescription específica de Agent 1');
    } else {
      // Fallback a template hardcoded si no hay thumbnailDescription
      subjectDescription = `Close-up portrait of peaceful Hispanic person in their 40s, ${template.emotion}, ${template.faceLook}, authentic expression (NOT stock photo), professional photography quality, ${template.sceneDescription}`;
      this.logger.warning('thumbnailDescription no encontrada, usando template por categoría');
    }

    const prompt = `Professional cinematic photograph for YouTube thumbnail, 16:9 aspect ratio, photorealistic quality:

SUBJECT (${template.facePosition}):
${subjectDescription}, authentic expression (NOT stock photo), professional photography quality.

BACKGROUND (remaining 60-70% of frame):
${template.backgroundColor}, simple clean composition, biblical/spiritual atmosphere, subject is 30% brighter than background for high contrast, ${category} theme.

LIGHTING & MOOD:
${template.lightingStyle}, cinematic quality lighting, creates emotional ${category} atmosphere.

COMPOSITION:
- Subject positioned on ${template.facePosition} following rule of thirds
- LEFT THIRD OF FRAME completely open and clean for text overlay (NO visual elements there)
- One focal point (the face), immediately draws attention
- Professional YouTube thumbnail aesthetic 2025
- 16:9 aspect ratio (1920x1080 equivalent)
- High contrast, mobile-optimized composition

STYLE:
Cinematic biblical photography, authentic emotion, minimalist clean layout, professional quality (NOT generic stock), designed for spiritual ${category} content.

IMPORTANT: NO TEXT, NO WORDS, NO LETTERS anywhere in the image. Clean space for text overlay.`;

    this.logger.success('Prompt generado', {
      category,
      hasThumbnailDescription: !!metadata.thumbnailDescription,
      promptLength: prompt.length
    });

    this.metrics.steps.generatePrompt = Date.now() - stepStart;
    return prompt;
  }

  prepareResult(metadata, basePrompt) {
    const verseForFilename = this.verse.replace(/\s+/g, '-').replace(/:/g, '-');

    return {
      step: 'awaiting_base_image',
      verse: this.verse,
      category: metadata.category,
      seoTitle: metadata.youtube.title,
      basePrompt,
      outputPaths: {
        base: path.join(CONFIG.THUMBNAILS_DIR, `base-${verseForFilename}.png`),
        final: path.join(CONFIG.THUMBNAILS_DIR, `thumbnail-${verseForFilename}.jpg`)
      },
      nextSteps: {
        description: 'Claude Code debe generar la imagen base con Magnific MCP',
        magnificParams: {
          tool: 'mcp__magnific__images_generate',
          params: {
            prompt: basePrompt,
            mode: 'recraft-v4-1',
            aspectRatio: '16:9',
            count: 1
          }
        },
        thenCallContinue: {
          function: 'continueWithBaseImage',
          params: ['verse', 'baseImageUrl', 'metadata']
        }
      }
    };
  }

  logMetrics() {
    if (!CONFIG.ENABLE_METRICS) return;

    const totalDuration = Date.now() - this.metrics.startTime;

    this.logger.info('📊 Métricas de Performance', {
      totalDurationMs: totalDuration,
      steps: this.metrics.steps
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔄 CONTINUACIÓN POST-GENERACIÓN
// ═══════════════════════════════════════════════════════════════

async function continueWithBaseImage(verse, baseImageUrl, metadata) {
  const logger = new Logger(verse);

  try {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📐 CONTINUACIÓN: Composición de texto');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const verseForFilename = verse.replace(/\s+/g, '-').replace(/:/g, '-');
    const baseImagePath = path.join(CONFIG.THUMBNAILS_DIR, `base-${verseForFilename}.png`);

    // STEP 1: Descargar imagen base con timeout
    await RetryHandler.withRetry(
      async () => {
        logger.info('Descargando imagen base', { url: baseImageUrl });

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout descargando imagen'));
          }, CONFIG.IMAGE_DOWNLOAD_TIMEOUT_MS);

          const file = fs.createWriteStream(baseImagePath);

          https.get(baseImageUrl, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
              return;
            }

            response.pipe(file);

            file.on('finish', () => {
              clearTimeout(timeout);
              file.close();
              resolve();
            });
          }).on('error', (err) => {
            clearTimeout(timeout);
            fs.unlink(baseImagePath, () => {});
            reject(err);
          });
        });

        logger.success('Imagen base descargada', { path: baseImagePath });
      },
      {
        maxRetries: CONFIG.MAX_RETRIES,
        operationName: 'Descarga de imagen',
        logger
      }
    );

    // STEP 2: Obtener frase optimizada del metadata (generada por Agent-8)
    logger.info('Obteniendo frase para thumbnail');

    if (!metadata.thumbnailPhrase) {
      throw new Error('metadata.thumbnailPhrase no existe. Ejecutar Agent-8 primero.');
    }

    const phrase = metadata.thumbnailPhrase;
    logger.success('Frase thumbnail obtenida', {
      phrase,
      length: phrase.length,
      wordCount: phrase.split(' ').length
    });

    // STEP 3: Componer con texto usando Pillow V2 (Python - word wrapping + área segura)
    logger.info('Componiendo thumbnail con Pillow V2');

    const composeScript = path.join(__dirname, '..', 'compose-thumbnail-pillow-v2.py');
    const finalPath = path.join(CONFIG.THUMBNAILS_DIR, `thumbnail-${verseForFilename}.jpg`);

    await RetryHandler.withRetry(
      async () => {
        execSync(`python3 "${composeScript}" "${baseImagePath}" "${phrase}" "${metadata.category}" "${finalPath}"`, {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit',
          timeout: CONFIG.COMPOSE_TIMEOUT_MS
        });
      },
      {
        maxRetries: 2,
        delayMs: 1000,
        operationName: 'Composición de texto Pillow',
        logger
      }
    );

    // Validar que el archivo final existe
    if (!fs.existsSync(finalPath)) {
      throw new Error('Thumbnail final no fue generado');
    }

    const stats = fs.statSync(finalPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    logger.success('Thumbnail completado', {
      path: finalPath,
      sizeInMB: parseFloat(sizeInMB)
    });

    logger.saveLogs();

    return {
      success: true,
      thumbnailPath: finalPath,
      sizeInMB: parseFloat(sizeInMB),
      verse,
      category: metadata.category
    };

  } catch (error) {
    logger.error('Composición falló', {
      error: error.message,
      stack: error.stack
    });
    logger.saveLogs();
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🏥 HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

async function healthCheck() {
  const checks = [];

  // Check 1: Directorios existen
  checks.push({
    name: 'Directories',
    status: fs.existsSync(CONFIG.THUMBNAILS_DIR) &&
            fs.existsSync(CONFIG.YOUTUBE_METADATA_DIR) ? 'OK' : 'FAIL'
  });

  // Check 2: compose-thumbnail-pillow-v2.py existe
  const composeScript = path.join(__dirname, '..', 'compose-thumbnail-pillow-v2.py');
  checks.push({
    name: 'compose-thumbnail-pillow-v2.py',
    status: fs.existsSync(composeScript) ? 'OK' : 'FAIL'
  });

  // Check 3: Python 3 disponible
  try {
    execSync('python3 --version', { stdio: 'pipe' });
    checks.push({ name: 'Python 3', status: 'OK' });
  } catch {
    checks.push({ name: 'Python 3', status: 'FAIL' });
  }

  // Check 4: Pillow instalado
  try {
    execSync('python3 -c "import PIL"', { stdio: 'pipe' });
    checks.push({ name: 'Pillow (PIL)', status: 'OK' });
  } catch {
    checks.push({ name: 'Pillow (PIL)', status: 'FAIL' });
  }

  const allOk = checks.every(c => c.status === 'OK');

  console.log('\n🏥 HEALTH CHECK\n');
  checks.forEach(check => {
    const icon = check.status === 'OK' ? '✅' : '❌';
    console.log(`${icon} ${check.name}: ${check.status}`);
  });
  console.log('');

  return allOk ? 0 : 1;
}

// ═══════════════════════════════════════════════════════════════
// 🚀 CLI
// ═══════════════════════════════════════════════════════════════

if (require.main === module) {
  const args = process.argv.slice(2);

  // Health check mode
  if (args[0] === '--health') {
    healthCheck().then(code => process.exit(code));
    return;
  }

  const verse = args[0];

  if (!verse) {
    console.error('❌ Usage: node agent-9-thumbnail-generator-production.js "Salmos 23:1"');
    console.error('   Options:');
    console.error('     --health  : Run health check');
    console.error('');
    console.error('   Environment variables:');
    console.error('     AGENT9_MAX_RETRIES      : Max retry attempts (default: 3)');
    console.error('     AGENT9_RETRY_DELAY      : Initial retry delay in ms (default: 2000)');
    console.error('     AGENT9_BACKOFF_FACTOR   : Exponential backoff factor (default: 2)');
    console.error('     DEBUG                   : Enable debug logs');
    process.exit(1);
  }

  const logger = new Logger(verse);

  const generator = new ThumbnailGenerator(verse, logger);

  generator.generate()
    .then(result => {
      if (result.step === 'awaiting_base_image') {
        logger.info('⏸️  Agente pausado. Claude Code debe completar generación de imagen base.');
        logger.info('Próximos pasos', result.nextSteps);
      }
      logger.saveLogs();
      process.exit(0);
    })
    .catch(err => {
      logger.error('Generación falló', { error: err.message });
      logger.saveLogs();

      // Exit codes por tipo de error
      if (err.message.includes('Validación')) process.exit(1);
      if (err.message.includes('Metadata no encontrada')) process.exit(2);
      if (err.message.includes('Timeout')) process.exit(5);

      process.exit(3);
    });
}

module.exports = { ThumbnailGenerator, continueWithBaseImage, healthCheck };
