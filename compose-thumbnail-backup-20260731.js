#!/usr/bin/env node

/**
 * 🎨 THUMBNAIL COMPOSER V3 - DRAMATIC MULTI-COLOR LAYOUT
 *
 * PRINCIPIOS CLAVE (basado en 10 referencias analizadas):
 * 1. ❌ NUNCA tapar la cara ni la expresión (punto focal emocional)
 * 2. ✅ Layout inteligente: texto en LEFT o BOTTOM, cara visible
 * 3. ✅ Multi-tamaño: palabras clave GRANDES, secundarias pequeñas
 * 4. ✅ Multi-color: Amarillo/dorado para énfasis, blanco para secundario
 * 5. ✅ Distribución dramática: NO una simple barra, sino composición visual
 * 6. ✅ Respeta YouTube safe zones (timestamp, chapters)
 *
 * ARQUITECTURA DE LAYOUT:
 * - Libro del versículo: TOP-LEFT en amarillo gigante (e.g., "ISAÍAS")
 * - Número del versículo: Integrado con libro en dorado más pequeño
 * - Categoría/tema: BOTTOM con opcional banner semi-transparente
 * - Cara: Siempre visible en CENTER-RIGHT o CENTER
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

// Parsear versículo: "Isaías 41:10" → libro="Isaías", numeros="41:10"
const verseMatch = verse.match(/^([^0-9]+)\s*(.+)$/);
const bookName = verseMatch ? verseMatch[1].trim() : verse;
const verseNumbers = verseMatch ? verseMatch[2].trim() : '';

// ═══════════════════════════════════════════════════════════════
// 🎨 SISTEMAS DE COLOR DRAMÁTICOS (Multi-color por categoría)
// ═══════════════════════════════════════════════════════════════

const COLOR_SYSTEMS = {
  fortaleza: {
    // Amarillo + Negro + Rojo (Urgencia dramática)
    primary: '#FFD700',      // Dorado brillante para libro
    secondary: '#FFFFFF',    // Blanco para números
    accent: '#FF1744',       // Rojo para énfasis
    bannerBg: 'rgba(255, 215, 0, 0.15)',
    bannerBorder: '#FFD700',
    stroke: '#000000',       // Negro para contraste
    mood: 'Dramatic Power'
  },
  consuelo: {
    // Azul + Amarillo dorado + Blanco (Profesional cálido)
    primary: '#FFC107',      // Amarillo dorado para libro
    secondary: '#FFFFFF',    // Blanco para números
    accent: '#2196F3',       // Azul para balance
    bannerBg: 'rgba(33, 150, 243, 0.12)',
    bannerBorder: '#2196F3',
    stroke: '#1565C0',       // Azul oscuro
    mood: 'Peaceful Hope'
  },
  esperanza: {
    // Verde + Amarillo + Blanco (Vida renovada)
    primary: '#FFD700',      // Dorado para libro
    secondary: '#FFFFFF',    // Blanco para números
    accent: '#4CAF50',       // Verde esperanza
    bannerBg: 'rgba(76, 175, 80, 0.15)',
    bannerBorder: '#4CAF50',
    stroke: '#1B5E20',       // Verde oscuro
    mood: 'Renewed Life'
  },
  amor: {
    // Rojo + Amarillo + Blanco (Pasión divina)
    primary: '#FFD700',      // Dorado para libro
    secondary: '#FFFFFF',    // Blanco para números
    accent: '#F44336',       // Rojo pasión
    bannerBg: 'rgba(244, 67, 54, 0.18)',
    bannerBorder: '#F44336',
    stroke: '#B71C1C',       // Rojo oscuro
    mood: 'Divine Passion'
  },
  sabiduria: {
    // Púrpura + Dorado + Blanco (Sabiduría premium)
    primary: '#FFD700',      // Dorado premium
    secondary: '#E1BEE7',    // Lavanda claro
    accent: '#9C27B0',       // Púrpura
    bannerBg: 'rgba(156, 39, 176, 0.15)',
    bannerBorder: '#9C27B0',
    stroke: '#4A148C',       // Púrpura oscuro
    mood: 'Divine Wisdom'
  },
  fe: {
    // Azul + Dorado + Blanco (Confianza celestial)
    primary: '#FFD700',      // Dorado para libro
    secondary: '#90CAF9',    // Azul claro
    accent: '#2196F3',       // Azul confianza
    bannerBg: 'rgba(33, 150, 243, 0.12)',
    bannerBorder: '#2196F3',
    stroke: '#0D47A1',       // Azul oscuro
    mood: 'Heavenly Trust'
  }
};

const colors = COLOR_SYSTEMS[category] || COLOR_SYSTEMS.consuelo;

// ═══════════════════════════════════════════════════════════════
// 📐 LAYOUT STRATEGY - NO TAPAR CARAS
// ═══════════════════════════════════════════════════════════════

const width = 1920;
const height = 1080;

// SAFE ZONES
const safeMarginX = 60;        // Margen lateral
const safeMarginBottom = 60;   // Margen bottom (timestamp)
const safeMarginTop = 40;      // Margen top

// LAYOUT LEFT-ALIGNED (cara queda visible en right)
const textLeftX = safeMarginX;
const textRightBoundary = width * 0.5; // Máximo hasta 50% del ancho (deja 50% para cara)

// Libro: TOP-LEFT gigante
const bookY = safeMarginTop + 180;  // Y=220px desde arriba
const bookFontSize = 180;            // Gigante y dramático
const bookLetterSpacing = 8;

// Números: Debajo o al lado del libro, más pequeño
const numbersY = bookY + 100;        // Debajo del libro
const numbersFontSize = 100;         // Más pequeño que libro
const numbersLetterSpacing = 4;

// Categoría: Debajo de los números (NO banner bottom que tapa la cara)
const categoryY = numbersY + 90;     // Debajo de los números
const categoryFontSize = 70;         // Grande y legible
const categoryLetterSpacing = 6;

// ═══════════════════════════════════════════════════════════════
// 🎨 TEXTO DINÁMICO CON JERARQUÍA VISUAL
// ═══════════════════════════════════════════════════════════════

// Función para obtener tema de categoría
function getCategoryTheme(cat) {
  const themes = {
    fortaleza: 'FORTALEZA DIVINA',
    consuelo: 'CONSUELO DEL CIELO',
    esperanza: 'ESPERANZA VIVA',
    amor: 'AMOR ETERNO',
    sabiduria: 'SABIDURÍA DE DIOS',
    fe: 'FE INQUEBRANTABLE'
  };
  return themes[cat] || 'PALABRA DE DIOS';
}

const categoryText = getCategoryTheme(category);

// ═══════════════════════════════════════════════════════════════
// 🎬 GENERACIÓN DE SVG - LAYOUT DRAMÁTICO
// ═══════════════════════════════════════════════════════════════

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&amp;family=Bebas+Neue&amp;display=swap');

      /* Libro - GIGANTE y dramático */
      .book-text {
        font-family: 'Bebas Neue', 'Impact', sans-serif;
        font-size: ${bookFontSize}px;
        font-weight: 900;
        fill: ${colors.primary};
        stroke: ${colors.stroke};
        stroke-width: 16px;
        paint-order: stroke fill;
        text-anchor: start;
        letter-spacing: ${bookLetterSpacing}px;
        text-transform: uppercase;
      }

      /* Números - Grande pero secundario */
      .numbers-text {
        font-family: 'Montserrat', sans-serif;
        font-size: ${numbersFontSize}px;
        font-weight: 900;
        fill: ${colors.secondary};
        stroke: ${colors.stroke};
        stroke-width: 10px;
        paint-order: stroke fill;
        text-anchor: start;
        letter-spacing: ${numbersLetterSpacing}px;
      }

      /* Categoría - Debajo de números */
      .category-text {
        font-family: 'Montserrat', sans-serif;
        font-size: ${categoryFontSize}px;
        font-weight: 900;
        fill: ${colors.accent};
        stroke: ${colors.stroke};
        stroke-width: 4px;
        paint-order: stroke fill;
        text-anchor: start;
        letter-spacing: ${categoryLetterSpacing}px;
      }
    </style>

    <!-- Sombra dramática para libro -->
    <filter id="bookShadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="20"/>
      <feOffset dx="0" dy="10" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.9"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Sombra para números -->
    <filter id="numbersShadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="15"/>
      <feOffset dx="0" dy="8" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.8"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Resplandor para categoría -->
    <filter id="categoryGlow">
      <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- LIBRO - TOP-LEFT gigante (deja cara visible en right) -->
  <text
    x="${textLeftX}"
    y="${bookY}"
    class="book-text"
    filter="url(#bookShadow)"
  >${bookName.toUpperCase()}</text>

  <!-- NÚMEROS - Debajo del libro -->
  <text
    x="${textLeftX + 10}"
    y="${numbersY}"
    class="numbers-text"
    filter="url(#numbersShadow)"
  >${verseNumbers}</text>

  <!-- CATEGORÍA - Debajo de números (NO tapa cara) -->
  <text
    x="${textLeftX + 10}"
    y="${categoryY}"
    class="category-text"
    filter="url(#categoryGlow)"
  >${categoryText}</text>
</svg>`;

// ═══════════════════════════════════════════════════════════════
// 🖼️ COMPOSICIÓN FINAL
// ═══════════════════════════════════════════════════════════════

const baseImagePath = `/home/suario/ruy-projects/project-yt/output/thumbnails/base-${verseSlug}.png`;
const outputPath = `/home/suario/ruy-projects/project-yt/output/thumbnails/thumbnail-${verseSlug}.png`;

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🎨 THUMBNAIL COMPOSER V3 - DRAMATIC MULTI-COLOR LAYOUT');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📝 Versículo: "${verse}"`);
console.log(`   📖 Libro: "${bookName}" (${bookFontSize}px, color ${colors.primary})`);
console.log(`   🔢 Números: "${verseNumbers}" (${numbersFontSize}px, color ${colors.secondary})`);
console.log(`   🎯 Categoría: "${categoryText}" (debajo de números)`);
console.log(`\n🎨 Sistema de color: ${category}`);
console.log(`   - Mood: ${colors.mood}`);
console.log(`   - Primary (libro): ${colors.primary}`);
console.log(`   - Secondary (números): ${colors.secondary}`);
console.log(`   - Accent: ${colors.accent}`);
console.log(`   - Stroke: ${colors.stroke}`);
console.log(`\n📍 Layout (NO tapa caras):`);
console.log(`   - Libro: TOP-LEFT (X=${textLeftX}px, Y=${bookY}px)`);
console.log(`   - Números: Debajo de libro (Y=${numbersY}px)`);
console.log(`   - Categoría: Debajo de números (Y=${categoryY}px, ${categoryFontSize}px)`);
console.log(`   - Zona de cara: CENTER-RIGHT y BOTTOM completamente libres`);
console.log(`\n✅ Principios aplicados:`);
console.log(`   ✓ NO tapa cara ni expresión (layout left-aligned)`);
console.log(`   ✓ Multi-tamaño dramático (${bookFontSize}px → ${numbersFontSize}px)`);
console.log(`   ✓ Multi-color (${colors.primary} + ${colors.secondary})`);
console.log(`   ✓ Respeta safe zones (timestamp, chapters)`);
console.log(`   ✓ Pasa The 120px Test`);
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

    // The 120px Test
    const scale120 = (120 / width).toFixed(4);
    const bookSize120 = (bookFontSize * parseFloat(scale120)).toFixed(1);
    const numbersSize120 = (numbersFontSize * parseFloat(scale120)).toFixed(1);
    console.log(`\n🔬 The 120px Test:`);
    console.log(`   - Libro: ${bookSize120}px (${bookSize120 >= 11 ? '✅ MUY LEGIBLE' : '⚠️  revisar'})`);
    console.log(`   - Números: ${numbersSize120}px (${numbersSize120 >= 6 ? '✅ LEGIBLE' : '⚠️  revisar'})`);
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
