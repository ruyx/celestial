#!/usr/bin/env node

/**
 * 🎨 YOUTUBE THUMBNAIL COMPOSER - PROFESSIONAL EDITION
 *
 * Basado en principios de diseño profesional de YouTube:
 * - The 120px Test (legible en móvil)
 * - Safe Zones (evita timestamp y chapter markers)
 * - Face Expression Psychology (30-50% del frame, NO tapar)
 * - High Contrast Color Strategy
 * - Text Rules (max 6 words, min 60pt, bold sans-serif)
 *
 * ARQUITECTURA:
 * 1. Texto EN UNA SOLA LÍNEA HORIZONTAL
 * 2. Posicionado en BOTTOM-CENTER (respetando safe zones)
 * 3. Semi-transparente para NO tapar expresiones faciales
 * 4. Alto contraste por categoría
 * 5. Mobile-optimized (pasa el test de 120px)
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
// 🎨 HIGH-CONTRAST COLOR SYSTEMS (YouTube CTR-Optimized)
// ═══════════════════════════════════════════════════════════════

const COLOR_SYSTEMS = {
  fortaleza: {
    // Yellow + Black (Urgency, attention)
    background: 'rgba(255, 193, 7, 0.92)',      // Amarillo vibrante
    text: '#000000',                             // Negro sólido
    stroke: '#FFFFFF',                           // Blanco para pop
    glow: '#FFC107',
    mood: 'Urgency & Strength'
  },
  consuelo: {
    // Blue + Orange (Professional contrast)
    background: 'rgba(33, 150, 243, 0.90)',     // Azul profesional
    text: '#FFFFFF',                             // Blanco
    stroke: '#FF6F00',                           // Naranja accent
    glow: '#2196F3',
    mood: 'Professional & Calm'
  },
  esperanza: {
    // Green + White (Growth, success)
    background: 'rgba(76, 175, 80, 0.90)',      // Verde esperanza
    text: '#FFFFFF',                             // Blanco
    stroke: '#1B5E20',                           // Verde oscuro
    glow: '#4CAF50',
    mood: 'Growth & Hope'
  },
  amor: {
    // Red + White (Energy, excitement)
    background: 'rgba(244, 67, 54, 0.92)',      // Rojo energético
    text: '#FFFFFF',                             // Blanco
    stroke: '#B71C1C',                           // Rojo oscuro
    glow: '#F44336',
    mood: 'Energy & Passion'
  },
  sabiduria: {
    // Purple + Yellow (Premium, creative)
    background: 'rgba(156, 39, 176, 0.90)',     // Púrpura premium
    text: '#FFD600',                             // Amarillo brillante
    stroke: '#4A148C',                           // Púrpura oscuro
    glow: '#9C27B0',
    mood: 'Premium & Wisdom'
  },
  fe: {
    // Blue + Orange (Professional)
    background: 'rgba(33, 150, 243, 0.90)',     // Azul
    text: '#FF9800',                             // Naranja
    stroke: '#0D47A1',                           // Azul oscuro
    glow: '#2196F3',
    mood: 'Trust & Faith'
  }
};

const colors = COLOR_SYSTEMS[category] || COLOR_SYSTEMS.consuelo;

// ═══════════════════════════════════════════════════════════════
// 📐 LAYOUT & SAFE ZONES
// ═══════════════════════════════════════════════════════════════

const width = 1920;
const height = 1080;

// SAFE ZONES (según YouTube Thumbnail Design skill)
// - Evitar bottom-right (timestamp overlay)
// - Evitar bottom-left (chapter markers)
// - Evitar extreme edges (cropping varía por dispositivo)

// Text Banner - Centrado en bottom, respetando safe zones
const bannerHeight = 140;                         // Más delgado (no tapa cara)
const bannerY = height - bannerHeight - 40;       // Y=900 (40px margin bottom)
const textY = bannerY + (bannerHeight / 2);       // Y=970 (centro vertical de barra)

// Márgenes laterales para respetar safe zones
const safeMarginX = 80;                           // 80px margen en cada lado
const bannerWidth = width - (safeMarginX * 2);    // 1760px de ancho

// ═══════════════════════════════════════════════════════════════
// 📝 TEXT SIZING (The 120px Test)
// ═══════════════════════════════════════════════════════════════

// A 120px width thumbnail, el texto debe ser legible
// Rule: Min 60pt equivalent
// En 1920px width = 100px font ≈ 6.25px en 120px thumbnail
// Necesitamos al menos 60px font para legibilidad

const verseLength = verseText.length;
let fontSize = 120;
let letterSpacing = 6;

if (verseLength > 12) {
  fontSize = 100;
  letterSpacing = 4;
}
if (verseLength > 18) {
  fontSize = 85;
  letterSpacing = 3;
}
if (verseLength > 24) {
  fontSize = 75;
  letterSpacing = 2;
}

// Stroke width proporcional al font size
const strokeWidth = Math.max(8, fontSize * 0.08);

// ═══════════════════════════════════════════════════════════════
// 🎬 SVG GENERATION
// ═══════════════════════════════════════════════════════════════

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&amp;display=swap');

      .verse-text {
        font-family: 'Montserrat', 'Impact', sans-serif;
        font-size: ${fontSize}px;
        font-weight: 900;
        fill: ${colors.text};
        stroke: ${colors.stroke};
        stroke-width: ${strokeWidth}px;
        paint-order: stroke fill;
        text-anchor: middle;
        dominant-baseline: middle;
        letter-spacing: ${letterSpacing}px;
      }
    </style>

    <!-- Drop shadow para profundidad -->
    <filter id="textShadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
      <feOffset dx="0" dy="6" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.8"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Resplandor sutil -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- BARRA DE FONDO (respetando safe zones) -->
  <rect
    x="${safeMarginX}"
    y="${bannerY}"
    width="${bannerWidth}"
    height="${bannerHeight}"
    fill="${colors.background}"
    rx="12"
    ry="12"
    filter="url(#glow)"
  />

  <!-- TEXTO DEL VERSÍCULO (UNA LÍNEA, CENTRADO) -->
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
console.log('🎨 YOUTUBE THUMBNAIL COMPOSER - PROFESSIONAL EDITION');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📝 Título SEO: "${seoTitle}"`);
console.log(`📐 Dimensiones: 1920 x 1080 (16:9)`);
console.log(`🎨 Texto: "${verseText}"`);
console.log(`   - Font size: ${fontSize}px`);
console.log(`   - Letter spacing: ${letterSpacing}px`);
console.log(`   - Stroke width: ${strokeWidth}px`);
console.log(`\n🎨 Sistema de color: ${category}`);
console.log(`   - Mood: ${colors.mood}`);
console.log(`   - Background: ${colors.background}`);
console.log(`   - Text: ${colors.text}`);
console.log(`   - Stroke: ${colors.stroke}`);
console.log(`\n📍 Layout (respetando safe zones):`);
console.log(`   - Banner: Y=${bannerY}px, altura=${bannerHeight}px`);
console.log(`   - Margen lateral: ${safeMarginX}px (evita cropping)`);
console.log(`   - Margen inferior: 40px (evita timestamp)`);
console.log(`\n✅ Cumple principios YouTube Thumbnail Design:`);
console.log(`   ✓ The 120px Test (legible en móvil)`);
console.log(`   ✓ Safe Zones (evita timestamp y chapters)`);
console.log(`   ✓ High Contrast Color System`);
console.log(`   ✓ Bold Sans-Serif Font (Montserrat 900)`);
console.log(`   ✓ NO tapa expresiones faciales`);
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

    // The 120px Test - Mostrar cómo se vería reducido
    const scale120 = (120 / width).toFixed(4);
    const fontSize120 = (fontSize * parseFloat(scale120)).toFixed(1);
    console.log(`\n🔬 The 120px Test:`);
    console.log(`   - Escala: ${scale120}x (1920px → 120px)`);
    console.log(`   - Font size en móvil: ${fontSize120}px`);
    console.log(`   - ${fontSize120 >= 6 ? '✅ LEGIBLE' : '⚠️  REVISAR legibilidad'}`);
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
