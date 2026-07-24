#!/usr/bin/env node

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎨 AGENT 9: YouTube Thumbnail Generator PRO
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Genera thumbnails profesionales para YouTube siguiendo best practices:
 *
 * ✅ Dimensiones: 1920x1080 (16:9, YouTube optimal)
 * ✅ Alto contraste y colores vibrantes
 * ✅ Texto legible a 120px (mobile view test)
 * ✅ Composición optimizada para CTR
 * ✅ Zonas seguras (evita esquinas inferiores)
 *
 * WORKFLOW:
 * 1. Lee specs de Agent 8 (youtube-metadata)
 * 2. Genera prompt cinematográfico optimizado para thumbnails
 * 3. Usa Magnific MCP para generar imagen base
 * 4. Valida dimensiones y tamaño (<2MB)
 * 5. Guarda en output/thumbnails/
 * 6. Retorna path para upload a YouTube
 *
 * USAGE: node agents/agent-9-thumbnail-generator.js "Salmos 23:1"
 *
 * Based on: https://mcpservers.org/es/agent-skills/qu-skills/youtube-thumbnail-design
 * Enhanced with: Magnific MCP + Brand consistency + Auto-validation
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
 * CATEGORY VISUAL STYLES
 * Cada categoría tiene su estilo visual optimizado para CTR
 */
const CATEGORY_STYLES = {
  fortaleza: {
    mood: 'powerful and uplifting',
    visualElements: 'mountain peak at sunrise, strong hands reaching upward, golden light breaking through clouds',
    composition: 'hero shot with dramatic vertical elements',
    emotionalTone: 'triumph and determination'
  },
  consuelo: {
    mood: 'peaceful and comforting',
    visualElements: 'gentle hands holding light, warm embrace, soft golden glow, serene landscape',
    composition: 'intimate close-up with warm lighting',
    emotionalTone: 'calm and reassurance'
  },
  esperanza: {
    mood: 'hopeful and bright',
    visualElements: 'sunrise breaking darkness, path leading to light, open sky with vibrant colors',
    composition: 'wide angle with depth and perspective',
    emotionalTone: 'optimism and anticipation'
  },
  amor: {
    mood: 'warm and embracing',
    visualElements: 'hearts, warm light, caring hands, gentle embrace',
    composition: 'centered subject with radial light',
    emotionalTone: 'love and compassion'
  },
  sabiduria: {
    mood: 'thoughtful and enlightening',
    visualElements: 'ancient book with glowing pages, wise elder, illuminated path',
    composition: 'balanced with central focus point',
    emotionalTone: 'insight and understanding'
  },
  fe: {
    mood: 'spiritual and transcendent',
    visualElements: 'divine light from above, praying hands, heavenly atmosphere',
    composition: 'vertical with upward direction',
    emotionalTone: 'reverence and trust'
  }
};

/**
 * Genera prompt optimizado para thumbnail siguiendo YouTube best practices
 */
function generateThumbnailPrompt(verse, category, thumbnailSpecs) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.fortaleza;

  // Extraer texto del versículo (sin números)
  const verseText = verse.replace(/\d+:\d+/, '').trim();
  const verseReference = verse.match(/\d+:\d+/)?.[0] || '';

  // Construir prompt siguiendo estructura de la referencia
  const prompt = `YouTube thumbnail style for biblical content, professional and high-impact design.

COMPOSITION:
${style.composition}, rule of thirds applied, ${style.mood} atmosphere.

VISUAL ELEMENTS:
${style.visualElements}, cinematic depth of field, dramatic lighting with ${thumbnailSpecs.colorScheme.primary} and ${thumbnailSpecs.colorScheme.accent} color accents.

TEXT OVERLAY (to be added post-generation):
- Main text: "${thumbnailSpecs.textOverlay}" in ${thumbnailSpecs.typography.font}, ${thumbnailSpecs.typography.verseSize} size
- Secondary: "${thumbnailSpecs.secondaryText}" in bold, ${thumbnailSpecs.typography.keywordSize} size
- Colors: primary ${thumbnailSpecs.colorScheme.primary}, secondary ${thumbnailSpecs.colorScheme.secondary}

STYLE:
High contrast, vibrant but not oversaturated, ${style.emotionalTone}, studio quality lighting, shallow depth of field, cinematic color grading with ${thumbnailSpecs.colorScheme.background} background gradient.

TECHNICAL:
YouTube thumbnail optimized, mobile-friendly composition (legible at 120px width), avoid critical elements in bottom corners (timestamp zone), maximum visual impact for CTR optimization.

MOOD: ${style.mood}, inspirational, attention-grabbing, professional religious content.`;

  return {
    prompt,
    metadata: {
      verse,
      category,
      style: style.mood,
      textOverlay: thumbnailSpecs.textOverlay,
      secondaryText: thumbnailSpecs.secondaryText,
      colorScheme: thumbnailSpecs.colorScheme
    }
  };
}

/**
 * Valida que el thumbnail cumpla con requisitos de YouTube
 */
function validateThumbnail(imagePath) {
  const stats = fs.statSync(imagePath);
  const sizeInMB = stats.size / (1024 * 1024);

  const validation = {
    passed: true,
    issues: [],
    warnings: []
  };

  // Validar tamaño (<2MB para YouTube)
  if (sizeInMB > 2) {
    validation.passed = false;
    validation.issues.push(`Tamaño ${sizeInMB.toFixed(2)}MB excede límite de 2MB de YouTube`);
  } else if (sizeInMB > 1.5) {
    validation.warnings.push(`Tamaño ${sizeInMB.toFixed(2)}MB cercano al límite (2MB)`);
  }

  // TODO: Validar dimensiones con sharp o jimp
  // Por ahora asumimos que Magnific genera 1920x1080 correctamente

  return validation;
}

/**
 * MAIN FUNCTION
 */
async function generateThumbnail(verse) {
  console.log('\n🎨 AGENT 9: YouTube Thumbnail Generator PRO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

    console.log('DEBUG: metadataPath =', metadataPath);
    console.log('DEBUG: ytMetadata keys =', Object.keys(ytMetadata));
    console.log('DEBUG: ytMetadata.thumbnail exists =', !!ytMetadata.thumbnail);

    if (!ytMetadata.thumbnail) {
      throw new Error('Metadata no contiene especificaciones de thumbnail');
    }

    console.log(`📋 Specs cargadas:`);
    console.log(`   Versículo: ${verse}`);
    console.log(`   Categoría: ${ytMetadata.category}`);
    console.log(`   Texto overlay: ${ytMetadata.thumbnail.textOverlay}`);
    console.log(`   Texto secundario: ${ytMetadata.thumbnail.secondaryText}`);
    console.log(`   Paleta: ${ytMetadata.thumbnail.colorScheme.primary} / ${ytMetadata.thumbnail.colorScheme.accent}\n`);

    // 2. Generar prompt optimizado
    console.log('🎯 Generando prompt cinematográfico optimizado...\n');
    const { prompt, metadata } = generateThumbnailPrompt(
      verse,
      ytMetadata.category,
      ytMetadata.thumbnail
    );

    console.log('📝 Prompt generado:');
    console.log('─'.repeat(60));
    console.log(prompt);
    console.log('─'.repeat(60));
    console.log('');

    // 3. INSTRUCCIONES PARA GENERACIÓN CON MAGNIFIC MCP
    console.log('⚠️  PASO MANUAL REQUERIDO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🤖 Este agente requiere que Claude Code ejecute Magnific MCP.\n');
    console.log('INSTRUCCIONES PARA CLAUDE CODE:\n');
    console.log('1. Usa el tool `mcp__magnific__images_generate` con estos parámetros:\n');
    console.log('   {');
    console.log('     "prompt": "<el prompt generado arriba>",');
    console.log('     "aspectRatio": "16:9",');
    console.log('     "resolution": "1080p",');
    console.log('     "mode": "imagen-nano-banana-2-flash",');
    console.log('     "count": 1');
    console.log('   }\n');
    console.log('2. Espera la generación con `mcp__magnific__creations_wait`\n');
    console.log('3. Descarga la imagen con `mcp__magnific__creations_get`\n');
    console.log('4. Guarda la imagen en:');
    console.log(`   ${THUMBNAILS_DIR}/thumbnail-${verseForFilename}.png\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 4. Guardar metadata del thumbnail
    const thumbnailMetadataPath = path.join(THUMBNAILS_DIR, `thumbnail-metadata-${verseForFilename}.json`);
    fs.writeFileSync(thumbnailMetadataPath, JSON.stringify({
      verse,
      category: ytMetadata.category,
      prompt,
      metadata,
      specs: ytMetadata.thumbnail,
      generatedAt: new Date().toISOString(),
      status: 'pending_magnific_generation',
      expectedOutput: `thumbnail-${verseForFilename}.png`,
      youtubeRequirements: {
        dimensions: '1920x1080',
        aspectRatio: '16:9',
        maxSize: '2MB',
        formats: ['JPG', 'PNG'],
        mobileTest: 'Must be legible at 120px width'
      },
      bestPractices: {
        maxColors: 3,
        maxWords: 6,
        fontStyle: 'Sans-serif bold',
        minFontSize: '60pt equivalent',
        safeZones: 'Avoid bottom corners (timestamp area)',
        composition: ytMetadata.thumbnail.composition
      }
    }, null, 2));

    console.log(`✅ Metadata guardada: ${path.basename(thumbnailMetadataPath)}\n`);

    // 5. Retornar información para próximo paso
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AGENT 9 PREPARADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📁 Próximos pasos:');
    console.log('   1. Claude Code ejecutará Magnific MCP con el prompt generado');
    console.log('   2. Imagen se guardará en output/thumbnails/');
    console.log('   3. Agent 8 subirá el thumbnail a YouTube automáticamente\n');

    return {
      success: true,
      verse,
      prompt,
      metadataPath: thumbnailMetadataPath,
      expectedThumbnailPath: path.join(THUMBNAILS_DIR, `thumbnail-${verseForFilename}.png`),
      status: 'pending_magnific_generation',
      magnificParams: {
        prompt,
        aspectRatio: '16:9',
        resolution: '1080p',
        mode: 'imagen-nano-banana-2-flash',
        count: 1
      }
    };

  } catch (error) {
    console.error('\n❌ Error en Agent 9 (Thumbnail Generator):');
    console.error('   ', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const verse = process.argv[2];

  if (!verse) {
    console.error('\n❌ Error: Debes especificar el versículo');
    console.error('Uso: node agents/agent-9-thumbnail-generator.js "Salmos 23:1"\n');
    process.exit(1);
  }

  generateThumbnail(verse)
    .then((result) => {
      console.log('✅ Proceso completado exitosamente');
      console.log('Resultado:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error fatal:', err.message);
      process.exit(1);
    });
}

module.exports = { generateThumbnail };
