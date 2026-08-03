#!/usr/bin/env node
/**
 * 🎨 THUMBNAIL COMPOSER V8.1 - DINÁMICO Y RESPONSIVE (FIX MEASUREMENT)
 *
 * Cambios vs V8:
 * ✅ Fix regex para parsear formato correcto de ImageMagick
 * ✅ Formato real: "width: 800; height: 128;" no "640x120"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Dimensiones del canvas
const CANVAS = {
  width: 1344,
  height: 768,
  textZoneWidth: 538,  // 40% del ancho (zona izquierda para texto)
  margin: 40
};

// Configuración de fuentes
const FONTS = {
  primary: 'DejaVu-Sans-Bold',
  fallback1: 'Anton-Regular',
  fallback2: 'Arial-Bold'
};

// Colores brillantes
const COLORS = {
  yellow: '#FFED00',
  white: '#FFFFFF',
  red: '#FF0000',
  black: '#000000',
  gold: '#FFD700'
};

// Tamaños base (se ajustan dinámicamente)
const BASE_SIZES = {
  sabiduria: {
    ref: 110,
    main: 190,
    emphasis: 230,
    emphasisColor: COLORS.red
  },
  fortaleza: {
    ref: 110,
    main: 200,
    emphasis: 240,
    emphasisColor: COLORS.red
  },
  esperanza: {
    ref: 110,
    main: 185,
    emphasis: 225,
    emphasisColor: COLORS.gold
  },
  amor: {
    ref: 110,
    main: 195,
    emphasis: 235,
    emphasisColor: COLORS.red
  },
  consuelo: {
    ref: 110,
    main: 188,
    emphasis: 228,
    emphasisColor: '#9C27B0'
  },
  fe: {
    ref: 110,
    main: 192,
    emphasis: 232,
    emphasisColor: '#2196F3'
  }
};

/**
 * Medir ancho de texto con ImageMagick
 */
function measureTextWidth(text, font, size) {
  try {
    const cmd = `convert -debug annotate xc: -font ${font} -pointsize ${size} -annotate +0+0 "${text}" null: 2>&1 | grep "Metrics:"`;

    const output = execSync(cmd, { encoding: 'utf8' });

    // Parse: Metrics: text: PROVERBIOS; width: 800; height: 128; ...
    const widthMatch = output.match(/width:\s*(\d+)/);
    const heightMatch = output.match(/height:\s*(\d+)/);

    if (widthMatch && heightMatch) {
      return {
        width: parseInt(widthMatch[1]),
        height: parseInt(heightMatch[1])
      };
    }
  } catch (e) {
    // Fallback: estimación aproximada
    return {
      width: text.length * size * 0.6,
      height: size * 1.2
    };
  }

  return { width: 0, height: 0 };
}

/**
 * Ajustar tamaño para que quepa en la zona de texto
 */
function adjustSize(text, baseSize, font, maxWidth) {
  let size = baseSize;
  let metrics = measureTextWidth(text, font, size);

  // Reducir tamaño si excede el ancho máximo
  while (metrics.width > maxWidth && size > 60) {
    size -= 10;
    metrics = measureTextWidth(text, font, size);
  }

  return { size, width: metrics.width, height: metrics.height };
}

/**
 * Construir comando dinámico
 */
function buildDynamicCommand(baseImage, verse, parts, category, font, output) {
  const baseSizes = BASE_SIZES[category];
  const maxWidth = CANVAS.textZoneWidth;

  // Separar versículo
  const verseParts = verse.split(' ');
  const refLine1 = verseParts[0].toUpperCase();
  const refLine2 = verseParts.slice(1).join(' ').toUpperCase();

  // PASO 1: Ajustar tamaños dinámicamente
  const ref1 = adjustSize(refLine1, baseSizes.ref, font, maxWidth);
  const ref2 = adjustSize(refLine2, baseSizes.ref, font, maxWidth);
  const main1 = adjustSize(parts.line1.toUpperCase(), baseSizes.main, font, maxWidth);
  const main2 = parts.line2
    ? adjustSize(parts.line2.toUpperCase(), baseSizes.main, font, maxWidth)
    : null;
  const emph = adjustSize(parts.emphasis.toUpperCase(), baseSizes.emphasis, font, maxWidth);

  // PASO 2: Calcular interlineado (1.15x altura)
  const refSpacing = Math.round(ref1.height * 1.15);
  const mainSpacing = Math.round(main1.height * 1.15);

  // PASO 3: Calcular altura total del bloque
  let totalHeight = ref1.height + refSpacing + ref2.height + 40; // Referencia + gap
  totalHeight += main1.height;
  if (main2) totalHeight += mainSpacing + main2.height;
  totalHeight += 40 + emph.height; // Gap + énfasis

  // PASO 4: Centrar verticalmente
  const startY = Math.max(CANVAS.margin, (CANVAS.height - totalHeight) / 2);

  // PASO 5: Calcular posiciones Y
  let currentY = startY;
  const ref1Y = currentY;
  currentY += ref1.height + refSpacing;
  const ref2Y = currentY;
  currentY += ref2.height + 40;
  const main1Y = currentY;
  currentY += main1.height;
  const main2Y = main2 ? (currentY + mainSpacing) : 0;
  if (main2) currentY += mainSpacing + main2.height;
  currentY += 40;
  const emphY = currentY;

  // PASO 6: Construir comando
  let cmd = `convert "${baseImage}" -font ${font}`;

  // Referencia línea 1
  cmd += ` \\
    -pointsize ${ref1.size} \\
    -fill "${COLORS.yellow}" \\
    -stroke "${COLORS.black}" \\
    -strokewidth 7 \\
    -gravity NorthWest \\
    -annotate +${CANVAS.margin}+${ref1Y} "${refLine1}"`;

  // Referencia línea 2
  cmd += ` \\
    -annotate +${CANVAS.margin}+${ref2Y} "${refLine2}"`;

  // Principal línea 1
  cmd += ` \\
    -pointsize ${main1.size} \\
    -fill "${COLORS.white}" \\
    -strokewidth 9 \\
    -annotate +${CANVAS.margin}+${main1Y} "${parts.line1.toUpperCase()}"`;

  // Principal línea 2 (si existe)
  if (main2) {
    cmd += ` \\
    -pointsize ${main2.size} \\
    -annotate +${CANVAS.margin}+${main2Y} "${parts.line2.toUpperCase()}"`;
  }

  // Énfasis
  cmd += ` \\
    -pointsize ${emph.size} \\
    -fill "${baseSizes.emphasisColor}" \\
    -strokewidth 10 \\
    -annotate +${CANVAS.margin}+${emphY} "${parts.emphasis.toUpperCase()}"`;

  cmd += ` \\
    -quality 95 \\
    "${output}"`;

  return {
    cmd,
    layout: {
      ref1: { ...ref1, y: ref1Y },
      ref2: { ...ref2, y: ref2Y },
      main1: { ...main1, y: main1Y },
      main2: main2 ? { ...main2, y: main2Y } : null,
      emphasis: { ...emph, y: emphY },
      totalHeight
    }
  };
}

/**
 * Detectar fuente
 */
function detectAvailableFont() {
  const fonts = [FONTS.primary, FONTS.fallback1, FONTS.fallback2];
  for (const font of fonts) {
    try {
      execSync(`convert -list font | grep -i "${font}"`, { stdio: 'pipe' });
      console.log(`✅ Fuente detectada: ${font}`);
      return font;
    } catch (e) {}
  }
  throw new Error('❌ Ninguna fuente compatible encontrada');
}

/**
 * Extraer partes del texto
 */
function extractTextParts(text) {
  const emphasisMatch = text.match(/\b([A-ZÁÉÍÓÚ]+)\s*$/);
  const emphasis = emphasisMatch ? emphasisMatch[1] : '';
  const mainText = emphasis ? text.replace(emphasis, '').trim() : text;
  const words = mainText.split(' ');
  const midPoint = Math.ceil(words.length / 2);

  return {
    line1: words.slice(0, midPoint).join(' '),
    line2: words.length > midPoint ? words.slice(midPoint).join(' ') : null,
    emphasis: emphasis
  };
}

/**
 * Componer thumbnail V8.1
 */
async function composeThumbnail(baseImagePath, verse, text, category, outputPath) {
  console.log('\n🎨 COMPOSITOR V8.1 - DINÁMICO Y RESPONSIVE (FIX MEASUREMENT)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!fs.existsSync(baseImagePath)) {
    throw new Error(`Imagen base no encontrada: ${baseImagePath}`);
  }

  if (!BASE_SIZES[category]) {
    throw new Error(`Categoría desconocida: ${category}`);
  }

  const font = detectAvailableFont();
  const parts = extractTextParts(text);
  const { cmd, layout } = buildDynamicCommand(baseImagePath, verse, parts, category, font, outputPath);

  console.log(`\n📐 Layout Dinámico: ${category}`);
  console.log(`   Canvas: ${CANVAS.width}x${CANVAS.height}px`);
  console.log(`   Zona texto: ${CANVAS.textZoneWidth}px`);
  console.log(`   Altura total bloque: ${layout.totalHeight}px`);
  console.log(`   Ref 1: ${layout.ref1.size}pt (${layout.ref1.width}px ancho)`);
  console.log(`   Ref 2: ${layout.ref2.size}pt (${layout.ref2.width}px ancho)`);
  console.log(`   Main 1: ${layout.main1.size}pt (${layout.main1.width}px ancho)`);
  if (layout.main2) {
    console.log(`   Main 2: ${layout.main2.size}pt (${layout.main2.width}px ancho)`);
  }
  console.log(`   Emphasis: ${layout.emphasis.size}pt (${layout.emphasis.width}px ancho)`);
  console.log(`   ✅ Ajustado automáticamente para caber en el canvas\n`);

  try {
    execSync(cmd, { stdio: 'pipe' });

    const size = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`✅ Thumbnail V8.1 generado exitosamente`);
    console.log(`   Archivo: ${path.basename(outputPath)}`);
    console.log(`   Tamaño: ${size}KB\n`);

    return { success: true, path: outputPath, size, layout };
  } catch (error) {
    throw new Error(`Error ejecutando ImageMagick: ${error.message}`);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 5) {
    console.error('\n❌ Uso: node compose-thumbnail-v8.1.js <base-image> <verse> <text> <category> <output>');
    console.error('\nEjemplo:');
    console.error('  node compose-thumbnail-v8.1.js base.png "Proverbios 3:5-6" "Confía en Dios SIEMPRE" sabiduria output.jpg\n');
    process.exit(1);
  }

  const [baseImage, verse, text, category, output] = args;

  composeThumbnail(baseImage, verse, text, category, output)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { composeThumbnail };
