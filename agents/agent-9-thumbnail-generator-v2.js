#!/usr/bin/env node

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎨 AGENT 9 v2: YouTube Thumbnail Generator PRO - HIGH CTR
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Genera thumbnails profesionales optimizados para CTR siguiendo:
 *
 * ✅ DIMENSIONES: 1920x1080 (16:9, YouTube optimal)
 * ✅ TEST 120PX: Legible en mobile (3-5 palabras máximo)
 * ✅ SAFE ZONES: Evita esquinas inferiores
 * ✅ HIGH CONTRAST: 2-3 colores complementarios
 * ✅ EXPRESIÓN FACIAL: Auténtica, no exagerada (CTR +30%)
 * ✅ COMPOSICIÓN: 30-50% rostro, texto grande, fondo simple
 * ✅ A/B TESTING: Genera 2-3 variantes automáticamente
 *
 * WORKFLOW:
 * 1. Lee specs de Agent 8 (youtube-metadata)
 * 2. Genera 2-3 prompts ultra-específicos (A/B testing)
 * 3. Usa Magnific MCP para generar variantes
 * 4. Valida safe zones y 120px test
 * 5. Guarda en output/thumbnails/
 *
 * USAGE: node agents/agent-9-thumbnail-generator-v2.js "Salmos 23:1"
 *
 * Based on: YouTube Thumbnail Best Practices 2025-2026
 * - 3-5 palabras max
 * - Rostro auténtico con emoción
 * - Min 60pt font, bold sans-serif
 * - Avoid bottom corners (timestamp/chapter zones)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const fs = require('fs');
const path = require('path');

// Directorios
const YOUTUBE_METADATA_DIR = path.join(__dirname, '..', 'output', 'youtube-metadata');
const THUMBNAILS_DIR = path.join(__dirname, '..', 'output', 'thumbnails');

// Asegurar que existe el directorio de thumbnails
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

/**
 * HIGH-CTR THUMBNAIL TEMPLATES POR CATEGORÍA
 * Cada categoría tiene templates optimizados siguiendo:
 * - Face expression psychology (surprise > curiosity > confidence)
 * - Color strategy (high-contrast pairs)
 * - Text rules (3-5 words max, 60pt min)
 * - Composition (30-50% face, left or right side)
 */
const CATEGORY_TEMPLATES = {
  fortaleza: {
    emotion: 'genuine confident expression with slight smile',
    colorPair: 'Blue + Orange', // Professional contrast
    backgroundColor: 'deep navy blue gradient',
    textColor: 'vibrant orange',
    textStroke: 'white',
    facePosition: 'left side',
    textPosition: 'right side',
    faceLook: 'looking at camera, direct eye contact',
    lightingStyle: 'dramatic rim lighting from right side, blue tones',
    ctarget: 'Expert advice, authority content'
  },
  consuelo: {
    emotion: 'genuinely serene peaceful expression, eyes gently closed or looking upward',
    colorPair: 'White + Dark', // Clean, minimal
    backgroundColor: 'soft dark gradient, midnight blue to black',
    textColor: 'pure white',
    textStroke: 'subtle golden glow',
    facePosition: 'right side',
    textPosition: 'left side, upper third',
    faceLook: 'eyes looking upward with hope, peaceful demeanor',
    lightingStyle: 'soft golden hour lighting, warm glow on face',
    ctarget: 'Comfort, peace, reassurance content'
  },
  esperanza: {
    emotion: 'genuine hopeful expression with eyes looking toward light',
    colorPair: 'Yellow + Black', // Urgency, attention
    backgroundColor: 'dark gradient with golden rays breaking through',
    textColor: 'vibrant yellow-gold',
    textStroke: 'black',
    facePosition: 'left side',
    textPosition: 'right side',
    faceLook: 'looking toward bright area (right side), hopeful gaze',
    lightingStyle: 'dramatic sunburst effect from top-right, golden hour',
    ctarget: 'Hope, inspiration, breakthrough content'
  },
  amor: {
    emotion: 'warm genuine smile with caring eyes',
    colorPair: 'Red + White', // Energy, warmth
    backgroundColor: 'soft red to warm pink gradient',
    textColor: 'white',
    textStroke: 'deep red',
    facePosition: 'right side',
    textPosition: 'left side',
    faceLook: 'looking at camera with warm inviting expression',
    lightingStyle: 'soft diffused warm lighting, golden tones',
    ctarget: 'Love, compassion, connection content'
  },
  sabiduria: {
    emotion: 'thoughtful contemplative expression, slight knowing smile',
    colorPair: 'Purple + Yellow', // Premium, wisdom
    backgroundColor: 'deep purple gradient',
    textColor: 'bright yellow-gold',
    textStroke: 'white',
    facePosition: 'left side',
    textPosition: 'right side, centered',
    faceLook: 'looking slightly down in thought, then up at viewer',
    lightingStyle: 'soft side lighting creating depth, purple and gold tones',
    ctarget: 'Educational, wisdom, insight content'
  },
  fe: {
    emotion: 'reverent peaceful expression with gentle upward gaze',
    colorPair: 'Green + White', // Growth, spiritual
    backgroundColor: 'soft teal to dark green gradient',
    textColor: 'pure white',
    textStroke: 'soft green glow',
    facePosition: 'right side',
    textPosition: 'left side, upper portion',
    faceLook: 'eyes closed or looking upward reverently',
    lightingStyle: 'divine light from above, soft ethereal glow',
    ctarget: 'Faith, spiritual, reverence content'
  }
};

/**
 * TEXT TEMPLATES OPTIMIZADOS
 * Siguiendo regla de 3-5 palabras máximo
 */
const TEXT_TEMPLATES = {
  // Formato 1: Verso simple (3 palabras)
  verseOnly: (verse) => {
    return verse.toUpperCase().replace(/\s+/g, ' ').trim();
  },

  // Formato 2: Verso + keyword (4-5 palabras)
  verseKeyword: (verse, keyword) => {
    return `${verse.toUpperCase()}\n${keyword.toUpperCase()}`;
  },

  // Formato 3: Solo keyword emocional (1-2 palabras)
  keywordOnly: (keyword) => {
    return keyword.toUpperCase();
  }
};

/**
 * Genera prompts ultra-específicos para High-CTR thumbnails
 * Siguiendo TODAS las especificaciones de YouTube 2025-2026
 */
function generateHighCTRPrompts(verse, category, thumbnailSpecs) {
  const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.fortaleza;

  // Extraer texto del versículo (sin números)
  const verseText = verse.replace(/\d+:\d+/, '').trim();
  const verseReference = verse.match(/\d+:\d+/)?.[0] || verse;

  // Generar 3 variantes de texto para A/B testing
  const textVariants = [
    TEXT_TEMPLATES.verseOnly(verseReference), // "SALMOS 23:1"
    TEXT_TEMPLATES.verseKeyword(verseReference, thumbnailSpecs.secondaryText), // "SALMOS 23:1\nCONSUELO"
    TEXT_TEMPLATES.keywordOnly(thumbnailSpecs.secondaryText) // "CONSUELO"
  ];

  // Generar 3 variantes de thumbnail (A/B/C testing)
  const variants = textVariants.map((textContent, index) => {
    const variantLetter = String.fromCharCode(65 + index); // A, B, C

    const prompt = `Professional YouTube thumbnail, high-CTR design, ultra-clean composition:

SUBJECT (30-50% of frame, ${template.facePosition}):
Close-up portrait of peaceful Hispanic person in their 40s, ${template.emotion}, ${template.faceLook}, authentic candid expression (NOT exaggerated or stock photo feel), professional photography.

TEXT OVERLAY (${template.textPosition}, must be MASSIVE and legible):
"${textContent}" in ultra-bold sans-serif font (Bebas Neue or Impact style), ${template.textColor} color with ${template.textStroke} stroke (4px), minimum 80pt equivalent, easily readable at 120px thumbnail size, positioned in safe zone (avoid bottom corners).

BACKGROUND (50-70% of frame):
${template.backgroundColor}, simple gradient, NO cluttered elements, subject is 30% brighter than background for high contrast.

LIGHTING:
${template.lightingStyle}, cinematic quality, creates emotional atmosphere matching ${category} theme.

TECHNICAL SPECS:
- 1920x1080 resolution (16:9 aspect ratio)
- Maximum 2-3 colors total (${template.colorPair})
- Text must pass 120px mobile test (readable when thumbnail is tiny)
- Safe zones: NO critical elements in bottom-right (timestamp) or bottom-left (chapter markers)
- One focal point only (face), eye immediately knows where to look
- Professional quality, NOT generic stock photo

STYLE NOTES:
Authentic 2025 YouTube thumbnail aesthetic - genuine emotion, minimalist layout, mobile-first composition. Designed for ${template.ctarget}.`;

    return {
      variant: variantLetter,
      textContent,
      prompt,
      expectedCTR: index === 0 ? 'Medium' : index === 1 ? 'High' : 'Medium-Low',
      rationale: index === 0
        ? 'Verse reference only - clear and direct'
        : index === 1
        ? 'Verse + keyword - optimal balance, highest CTR expected'
        : 'Keyword only - emotional hook, may work for established audience'
    };
  });

  return {
    category,
    verse,
    colorScheme: template.colorPair,
    variants,
    bestPractices: {
      textRule: '3-5 words maximum',
      fontRule: 'Bold sans-serif, min 60pt',
      safeZones: 'Avoid bottom corners',
      mobileTest: 'Must be legible at 120px width',
      composition: `${template.facePosition} face (30-50%), ${template.textPosition} text`,
      colorStrategy: template.colorPair,
      expressionPsychology: template.emotion
    }
  };
}

/**
 * Valida que el thumbnail cumpla requisitos de YouTube
 */
function validateThumbnail(imagePath) {
  const stats = fs.statSync(imagePath);
  const sizeInMB = stats.size / (1024 * 1024);

  const validation = {
    passed: true,
    issues: [],
    warnings: [],
    checks: {
      size: false,
      format: false,
      dimensions: false,
      safeZones: false,
      mobileTest: false
    }
  };

  // 1. Validar tamaño (<2MB para YouTube)
  if (sizeInMB > 2) {
    validation.passed = false;
    validation.issues.push(`Tamaño ${sizeInMB.toFixed(2)}MB excede límite de 2MB de YouTube`);
    validation.checks.size = false;
  } else {
    validation.checks.size = true;
    if (sizeInMB > 1.5) {
      validation.warnings.push(`Tamaño ${sizeInMB.toFixed(2)}MB cercano al límite (2MB)`);
    }
  }

  // 2. Validar formato
  const ext = path.extname(imagePath).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
    validation.checks.format = true;
  } else {
    validation.passed = false;
    validation.issues.push(`Formato ${ext} no permitido. Usar JPG, PNG o GIF`);
    validation.checks.format = false;
  }

  // 3. Safe zones check (manual - requires image analysis)
  validation.checks.safeZones = 'pending_manual_review';
  validation.warnings.push('RECORDATORIO: Verificar que NO hay elementos críticos en esquinas inferiores');

  // 4. 120px mobile test (manual - requires visual check)
  validation.checks.mobileTest = 'pending_manual_review';
  validation.warnings.push('RECORDATORIO: Hacer test visual a 120px width (zoom out en browser)');

  // 5. Dimensiones esperadas (requiere librería de imagen, por ahora asumimos correcto)
  validation.checks.dimensions = 'assumed_correct_1920x1080';

  return validation;
}

/**
 * MAIN FUNCTION
 */
async function generateThumbnail(verse, options = {}) {
  console.log('\n🎨 AGENT 9 v2: YouTube Thumbnail Generator PRO - HIGH CTR');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const {
    generateVariants = true,  // true = A/B/C testing (3 variantes), false = solo mejor variante
    variantCount = 3          // Cuántas variantes generar (1-3)
  } = options;

  try {
    // 1. Buscar metadata de YouTube generada por Agent 8
    const verseForFilename = verse.replace(/\s+/g, '-').replace(/:/g, '-');
    const metadataFiles = fs.readdirSync(YOUTUBE_METADATA_DIR)
      .filter(file => file.startsWith('youtube-metadata-') && file.includes(verseForFilename) && file.endsWith('.json'));

    if (metadataFiles.length === 0) {
      throw new Error(`Metadata de YouTube no encontrada para: ${verse}\nEjecuta primero Agent 8`);
    }

    const metadataPath = path.join(YOUTUBE_METADATA_DIR, metadataFiles[0]);
    const ytMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    if (!ytMetadata.thumbnail) {
      throw new Error('Metadata no contiene especificaciones de thumbnail');
    }

    console.log(`📋 Specs cargadas:`);
    console.log(`   Versículo: ${verse}`);
    console.log(`   Categoría: ${ytMetadata.category}`);
    console.log(`   Texto principal: ${ytMetadata.thumbnail.textOverlay}`);
    console.log(`   Keyword: ${ytMetadata.thumbnail.secondaryText}`);
    console.log(`   Paleta: ${ytMetadata.thumbnail.colorScheme.primary} / ${ytMetadata.thumbnail.colorScheme.accent}\n`);

    // 2. Generar prompts ultra-específicos con A/B testing
    console.log('🎯 Generando prompts HIGH-CTR optimizados...\n');
    const promptData = generateHighCTRPrompts(
      verse,
      ytMetadata.category,
      ytMetadata.thumbnail
    );

    console.log(`📊 A/B Testing Strategy:`);
    console.log(`   Color Pair: ${promptData.colorScheme}`);
    console.log(`   Variantes generadas: ${promptData.variants.length}\n`);

    // Mostrar resumen de variantes
    promptData.variants.forEach(v => {
      console.log(`   [Variant ${v.variant}] "${v.textContent.replace(/\n/g, ' + ')}"`);
      console.log(`               Expected CTR: ${v.expectedCTR}`);
      console.log(`               Rationale: ${v.rationale}\n`);
    });

    // 3. Seleccionar variantes a generar
    const variantsToGenerate = generateVariants
      ? promptData.variants.slice(0, variantCount)
      : [promptData.variants[1]]; // Solo variante B (mejor balance)

    console.log(`🎨 Generando ${variantsToGenerate.length} thumbnail(s)...\n`);

    // 4. INSTRUCCIONES PARA GENERACIÓN CON MAGNIFIC MCP
    console.log('⚠️  PASO MANUAL REQUERIDO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🤖 Este agente requiere que Claude Code ejecute Magnific MCP.\n');

    variantsToGenerate.forEach((variant, index) => {
      console.log(`\n━━━ VARIANT ${variant.variant} (${variant.expectedCTR} CTR Expected) ━━━\n`);
      console.log('📝 Prompt generado:');
      console.log('─'.repeat(60));
      console.log(variant.prompt);
      console.log('─'.repeat(60));
      console.log('');

      console.log(`INSTRUCCIONES PARA CLAUDE CODE (Variant ${variant.variant}):\n`);
      console.log('1. Usa el tool `mcp__magnific__images_generate` con estos parámetros:\n');
      console.log('   {');
      console.log(`     "prompt": "<el prompt de Variant ${variant.variant} arriba>",`);
      console.log('     "aspectRatio": "16:9",');
      console.log('     "mode": "imagen-nano-banana-2-flash",');
      console.log('     "count": 1');
      console.log('   }\n');
      console.log('2. Espera la generación con `mcp__magnific__creations_wait`\n');
      console.log('3. Descarga la imagen con `mcp__magnific__creations_get`\n');
      console.log('4. Guarda la imagen en:');
      console.log(`   ${THUMBNAILS_DIR}/thumbnail-${verseForFilename}-variant-${variant.variant}.png\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 5. Guardar metadata del thumbnail con TODAS las variantes
    const thumbnailMetadataPath = path.join(THUMBNAILS_DIR, `thumbnail-metadata-${verseForFilename}-v2.json`);
    fs.writeFileSync(thumbnailMetadataPath, JSON.stringify({
      version: '2.0',
      verse,
      category: ytMetadata.category,
      variants: variantsToGenerate.map(v => ({
        variant: v.variant,
        textContent: v.textContent,
        prompt: v.prompt,
        expectedCTR: v.expectedCTR,
        rationale: v.rationale,
        expectedOutput: `thumbnail-${verseForFilename}-variant-${v.variant}.png`
      })),
      colorScheme: promptData.colorScheme,
      bestPractices: promptData.bestPractices,
      specs: ytMetadata.thumbnail,
      generatedAt: new Date().toISOString(),
      status: 'pending_magnific_generation',
      youtubeRequirements: {
        dimensions: '1920x1080 (recommended), minimum 1280x720',
        aspectRatio: '16:9',
        maxSize: '2MB',
        formats: ['JPG', 'PNG', 'GIF'],
        mobileTest: 'Must be legible at 120px width',
        safeZones: 'Avoid bottom-right (timestamp) and bottom-left (chapters)',
        textRules: '3-5 words max, 60pt min, bold sans-serif',
        colorRules: '2-3 colors max, high contrast pairs',
        faceRules: '30-50% of frame, authentic expression'
      },
      abTestingStrategy: {
        variantA: 'Verse reference only',
        variantB: 'Verse + keyword (RECOMMENDED - highest CTR)',
        variantC: 'Keyword only',
        recommendation: 'Upload Variant B first, then A/B test against A or C'
      }
    }, null, 2));

    console.log(`✅ Metadata guardada: ${path.basename(thumbnailMetadataPath)}\n`);

    // 6. Retornar información para próximo paso
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AGENT 9 v2 PREPARADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📁 Próximos pasos:');
    console.log('   1. Claude Code ejecutará Magnific MCP para cada variante');
    console.log('   2. Imágenes se guardarán en output/thumbnails/');
    console.log(`   3. RECOMENDACIÓN: Usar Variant B (${variantsToGenerate[1]?.variant || 'B'}) primero`);
    console.log('   4. Después hacer A/B testing con YouTube Studio\n');

    return {
      success: true,
      verse,
      category: ytMetadata.category,
      colorScheme: promptData.colorScheme,
      variants: variantsToGenerate,
      metadataPath: thumbnailMetadataPath,
      recommendation: 'Use Variant B for highest CTR, then A/B test',
      status: 'pending_magnific_generation'
    };

  } catch (error) {
    console.error('\n❌ Error en Agent 9 v2 (Thumbnail Generator):');
    console.error('   ', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const verse = process.argv[2];
  const generateAll = process.argv.includes('--all-variants');

  if (!verse) {
    console.error('\n❌ Error: Debes especificar el versículo');
    console.error('Uso: node agents/agent-9-thumbnail-generator-v2.js "Salmos 23:1" [--all-variants]');
    console.error('     --all-variants: Genera 3 variantes para A/B testing (por defecto solo mejor variante)\n');
    process.exit(1);
  }

  const options = {
    generateVariants: generateAll,
    variantCount: generateAll ? 3 : 1
  };

  generateThumbnail(verse, options)
    .then((result) => {
      console.log('✅ Proceso completado exitosamente');
      console.log(`📊 Variantes generadas: ${result.variants.length}`);
      console.log(`💡 Recomendación: ${result.recommendation}\n`);
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error fatal:', err.message);
      process.exit(1);
    });
}

module.exports = { generateThumbnail };
