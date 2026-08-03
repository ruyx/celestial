#!/usr/bin/env node

/**
 * 🎨 THUMBNAIL COMPOSER V2 - BOTTOM BANNER STYLE
 *
 * DISEÑO INTENCIONAL:
 * - Título completo en UNA SOLA LÍNEA HORIZONTAL
 * - Posicionado en el BOTTOM (no tapa caras ni expresiones)
 * - Barra de gradiente dramática como fondo
 * - Efectos de resplandor y sombras
 * - Distintivo por categoría (cada una tiene su identidad visual)
 *
 * PRINCIPIOS DE DISEÑO:
 * - Composición intencional (no genérica)
 * - Jerarquía visual clara
 * - Memorable y llamativo
 * - Mobile-optimized (legible en thumbnails pequeños)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// 📋 CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const verse = process.argv[2] || 'Salmos 23:1';
const verseSlug = verse.replace(/[\s:]+/g, '-');
const metadataPath = `/home/suario/ruy-projects/project-yt/output/youtube-metadata/youtube-metadata-${verseSlug}.json`;
const ytMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

if (!ytMetadata.youtube || !ytMetadata.youtube.title) {
  throw new Error('Metadata no contiene título SEO (youtube.title)');
}

const category = ytMetadata.category || 'consuelo';
const seoTitle = ytMetadata.youtube.title;

// Extraer versículo del título SEO (e.g., "Isaías 41:10 | ...")
const verseMatch = seoTitle.match(/^([^\|]+)/);
const verseText = verseMatch ? verseMatch[1].trim().toUpperCase() : verse.toUpperCase();

// ═══════════════════════════════════════════════════════════════
// 🎨 SISTEMAS VISUALES POR CATEGORÍA
// ═══════════════════════════════════════════════════════════════

const VISUAL_SYSTEMS = {
  fortaleza: {
    // Naranja fuego + amarillo dorado - potencia y energía
    gradientStart: '#FF6B35',
    gradientEnd: '#FFA500',
    textPrimary: '#FFFFFF',
    textAccent: '#FFD700',
    glowColor: '#FF6B35',
    shadowIntensity: 'strong',
    barOpacity: 0.95
  },
  consuelo: {
    // Azul cielo + dorado suave - paz y calidez
    gradientStart: '#4A90E2',
    gradientEnd: '#FFD700',
    textPrimary: '#FFFFFF',
    textAccent: '#FFE066',
    glowColor: '#FFD700',
    shadowIntensity: 'medium',
    barOpacity: 0.92
  },
  esperanza: {
    // Turquesa + verde esperanza - vida y renovación
    gradientStart: '#4ECDC4',
    gradientEnd: '#44B08D',
    textPrimary: '#FFFFFF',
    textAccent: '#A8E6CF',
    glowColor: '#4ECDC4',
    shadowIntensity: 'medium',
    barOpacity: 0.93
  },
  amor: {
    // Rosa coral + rojo - pasión y compasión
    gradientStart: '#FF6B9D',
    gradientEnd: '#FF1744',
    textPrimary: '#FFFFFF',
    textAccent: '#FFB6C1',
    glowColor: '#FF1744',
    shadowIntensity: 'strong',
    barOpacity: 0.94
  },
  sabiduria: {
    // Púrpura + azul profundo - sabiduría divina
    gradientStart: '#9C27B0',
    gradientEnd: '#5E35B1',
    textPrimary: '#FFFFFF',
    textAccent: '#E1BEE7',
    glowColor: '#9C27B0',
    shadowIntensity: 'medium',
    barOpacity: 0.93
  },
  fe: {
    // Azul cielo + índigo - confianza y firmeza
    gradientStart: '#2196F3',
    gradientEnd: '#1565C0',
    textPrimary: '#FFFFFF',
    textAccent: '#90CAF9',
    glowColor: '#2196F3',
    shadowIntensity: 'medium',
    barOpacity: 0.92
  }
};

const visual = VISUAL_SYSTEMS[category] || VISUAL_SYSTEMS.consuelo;

// ═══════════════════════════════════════════════════════════════
// 🎬 GENERACIÓN DE SVG - BOTTOM BANNER
// ═══════════════════════════════════════════════════════════════

const width = 1920;
const height = 1080;

// Posicionamiento BOTTOM (20% inferior de la imagen)
const bannerHeight = 220;
const bannerY = height - bannerHeight; // Y=860 (deja 220px en bottom)
const textY = bannerY + (bannerHeight / 2); // Centro vertical de la barra

// Tamaños de texto dinámicos basados en longitud del versículo
const verseLength = verseText.length;
let fontSize = 140;
if (verseLength > 15) fontSize = 120;
if (verseLength > 20) fontSize = 100;
if (verseLength > 25) fontSize = 90;

// Intensidad de sombras según categoría
const shadowBlur = visual.shadowIntensity === 'strong' ? 20 : 15;
const shadowOffset = visual.shadowIntensity === 'strong' ? 8 : 6;

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&amp;display=swap');

      .verse-text {
        font-family: 'Montserrat', 'Impact', sans-serif;
        font-size: ${fontSize}px;
        font-weight: 900;
        fill: ${visual.textPrimary};
        stroke: #000000;
        stroke-width: 12px;
        paint-order: stroke fill;
        text-anchor: middle;
        dominant-baseline: middle;
        letter-spacing: 4px;
      }
    </style>

    <!-- Gradiente de fondo de la barra -->
    <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${visual.gradientStart};stop-opacity:${visual.barOpacity}" />
      <stop offset="50%" style="stop-color:${visual.gradientEnd};stop-opacity:${visual.barOpacity}" />
      <stop offset="100%" style="stop-color:${visual.gradientStart};stop-opacity:${visual.barOpacity}" />
    </linearGradient>

    <!-- Sombra dramática del texto -->
    <filter id="textShadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowBlur}"/>
      <feOffset dx="0" dy="${shadowOffset}" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="1"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Resplandor de color de categoría -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Barra de fondo con gradiente (BOTTOM) -->
  <rect
    x="0"
    y="${bannerY}"
    width="${width}"
    height="${bannerHeight}"
    fill="url(#barGradient)"
  />

  <!-- Borde superior brillante -->
  <line
    x1="0"
    y1="${bannerY}"
    x2="${width}"
    y2="${bannerY}"
    stroke="${visual.glowColor}"
    stroke-width="4"
    opacity="0.8"
    filter="url(#glow)"
  />

  <!-- Texto del versículo (UNA SOLA LÍNEA HORIZONTAL) -->
  <text
    x="${width / 2}"
    y="${textY}"
    class="verse-text"
    filter="url(#textShadow)"
  >${verseText}</text>
</svg>`;

// ═══════════════════════════════════════════════════════════════
// 🖼️ COMPOSICIÓN FINAL
// ═══════════════════════════════════════════════════════════════

const baseImagePath = `/home/suario/ruy-projects/project-yt/output/thumbnails/base-${verseSlug}.png`;
const outputPath = `/home/suario/ruy-projects/project-yt/output/thumbnails/thumbnail-${verseSlug}.png`;

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🎨 THUMBNAIL COMPOSER V2 - BOTTOM BANNER STYLE');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📝 Título SEO: "${seoTitle}"`);
console.log(`🎨 Texto en thumbnail: "${verseText}" (1 línea horizontal)`);
console.log(`📏 Tamaño de fuente: ${fontSize}px (dinámico)`);
console.log(`🎨 Categoría: ${category}`);
console.log(`🌈 Sistema visual:`);
console.log(`   - Gradiente: ${visual.gradientStart} → ${visual.gradientEnd}`);
console.log(`   - Texto: ${visual.textPrimary} + ${visual.textAccent}`);
console.log(`   - Resplandor: ${visual.glowColor}`);
console.log(`📍 Posición: Bottom banner (Y=${bannerY}px, altura=${bannerHeight}px)`);
console.log('');

sharp(baseImagePath)
  .resize(1920, 1080, {
    fit: 'cover',
    position: 'center'
  })
  .composite([{
    input: Buffer.from(svg),
    top: 0,
    left: 0
  }])
  .png({ quality: 95, compressionLevel: 9 })
  .toFile(outputPath)
  .then(() => {
    const stats = fs.statSync(outputPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('✅ Thumbnail generado exitosamente');
    console.log(`   📁 ${outputPath}`);
    console.log(`   📦 Tamaño: ${sizeInMB} MB`);
    console.log('');

    // Validar tamaño YouTube (<2MB)
    if (parseFloat(sizeInMB) > 2) {
      console.log(`⚠️  Tamaño excede 2MB, comprimiendo a JPEG...`);
      const jpgPath = outputPath.replace('.png', '.jpg');
      return sharp(baseImagePath)
        .resize(1920, 1080, { fit: 'cover', position: 'center' })
        .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
        .jpeg({ quality: 85 })
        .toFile(jpgPath)
        .then(() => {
          const jpgStats = fs.statSync(jpgPath);
          const jpgSize = (jpgStats.size / (1024 * 1024)).toFixed(2);
          console.log(`✅ JPEG generado: ${jpgPath} (${jpgSize} MB)\n`);
        });
    } else {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🎉 LISTO PARA SUBIR A YOUTUBE');
      console.log('═══════════════════════════════════════════════════════════════\n');
    }
  })
  .catch(err => {
    console.error('❌ Error componiendo thumbnail:', err);
    process.exit(1);
  });
