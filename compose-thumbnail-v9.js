#!/usr/bin/env node
/**
 * 🎨 THUMBNAIL COMPOSER V9 - BLOQUES DE TEXTO CON \n
 *
 * Fix crítico vs V8.1:
 * ✅ Trata texto como BLOQUES completos (no palabras individuales)
 * ✅ Usa \n para saltos de línea dentro del bloque
 * ✅ ImageMagick maneja el interlineado automáticamente
 * ✅ Una sola anotación por bloque (ref, main, emphasis)
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

// Tamaños base y posiciones (se ajustan dinámicamente)
const BASE_LAYOUTS = {
  sabiduria: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 7 },
    main: { size: 190, y: -30, color: COLORS.white, stroke: 9 },
    emphasis: { size: 230, y: 230, color: COLORS.red, stroke: 10 }
  },
  fortaleza: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 7 },
    main: { size: 200, y: -25, color: COLORS.white, stroke: 9 },
    emphasis: { size: 240, y: 240, color: COLORS.red, stroke: 10 }
  },
  esperanza: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 7 },
    main: { size: 185, y: -35, color: COLORS.white, stroke: 9 },
    emphasis: { size: 225, y: 225, color: COLORS.gold, stroke: 10 }
  },
  amor: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 7 },
    main: { size: 195, y: -28, color: COLORS.white, stroke: 9 },
    emphasis: { size: 235, y: 235, color: COLORS.red, stroke: 10 }
  },
  consuelo: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 7 },
    main: { size: 188, y: -32, color: COLORS.white, stroke: 9 },
    emphasis: { size: 228, y: 228, color: '#9C27B0', stroke: 10 }
  },
  fe: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 7 },
    main: { size: 192, y: -30, color: COLORS.white, stroke: 9 },
    emphasis: { size: 232, y: 232, color: '#2196F3', stroke: 10 }
  }
};

/**
 * Medir ancho máximo de bloque de texto con \n
 */
function measureTextBlock(text, font, size) {
  try {
    // Escapar comillas en el texto
    const escapedText = text.replace(/"/g, '\\"');
    const cmd = `convert -debug annotate xc: -font ${font} -pointsize ${size} -annotate +0+0 "${escapedText}" null: 2>&1 | grep "Metrics:"`;

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
    const lines = text.split('\n');
    const maxLineLength = Math.max(...lines.map(l => l.length));
    return {
      width: maxLineLength * size * 0.6,
      height: size * 1.3 * lines.length
    };
  }

  return { width: 0, height: 0 };
}

/**
 * Ajustar tamaño de bloque para que quepa en la zona de texto
 */
function adjustBlockSize(text, baseSize, font, maxWidth) {
  let size = baseSize;
  let metrics = measureTextBlock(text, font, size);

  // Reducir tamaño si excede el ancho máximo
  while (metrics.width > maxWidth && size > 60) {
    size -= 10;
    metrics = measureTextBlock(text, font, size);
  }

  return { size, width: metrics.width, height: metrics.height };
}

/**
 * Construir comando con bloques de texto
 */
function buildCommand(baseImage, verse, parts, layout, font, output) {
  const maxWidth = CANVAS.textZoneWidth;

  // PASO 1: Construir bloques de texto con \n
  const refText = verse.replace(' ', '\n').toUpperCase();
  const mainText = parts.line2 
    ? `${parts.line1.toUpperCase()}\n${parts.line2.toUpperCase()}`
    : parts.line1.toUpperCase();
  const emphText = parts.emphasis.toUpperCase();

  // PASO 2: Ajustar tamaños dinámicamente por bloque
  const refAdjusted = adjustBlockSize(refText, layout.ref.size, font, maxWidth);
  const mainAdjusted = adjustBlockSize(mainText, layout.main.size, font, maxWidth);
  const emphAdjusted = adjustBlockSize(emphText, layout.emphasis.size, font, maxWidth);

  // PASO 3: Construir comando ImageMagick
  // Escapar comillas en los textos
  const escapedRef = refText.replace(/"/g, '\\"');
  const escapedMain = mainText.replace(/"/g, '\\"');
  const escapedEmph = emphText.replace(/"/g, '\\"');

  const cmd = `convert "${baseImage}" \\
    -font ${font} \\
    -pointsize ${refAdjusted.size} \\
    -fill "${layout.ref.color}" \\
    -stroke "${COLORS.black}" \\
    -strokewidth ${layout.ref.stroke} \\
    -gravity NorthWest \\
    -annotate +${CANVAS.margin}+${layout.ref.y} "${escapedRef}" \\
    \\
    -pointsize ${mainAdjusted.size} \\
    -fill "${layout.main.color}" \\
    -strokewidth ${layout.main.stroke} \\
    -gravity West \\
    -annotate +${CANVAS.margin}+${layout.main.y} "${escapedMain}" \\
    \\
    -pointsize ${emphAdjusted.size} \\
    -fill "${layout.emphasis.color}" \\
    -strokewidth ${layout.emphasis.stroke} \\
    -annotate +${CANVAS.margin}+${layout.emphasis.y} "${escapedEmph}" \\
    \\
    -quality 95 \\
    "${output}"`;

  return {
    cmd,
    sizes: {
      ref: refAdjusted,
      main: mainAdjusted,
      emphasis: emphAdjusted
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
 * Componer thumbnail V9
 */
async function composeThumbnail(baseImagePath, verse, text, category, outputPath) {
  console.log('\n🎨 COMPOSITOR V9 - BLOQUES DE TEXTO CON \\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!fs.existsSync(baseImagePath)) {
    throw new Error(`Imagen base no encontrada: ${baseImagePath}`);
  }

  if (!BASE_LAYOUTS[category]) {
    throw new Error(`Categoría desconocida: ${category}`);
  }

  const font = detectAvailableFont();
  const parts = extractTextParts(text);
  const layout = BASE_LAYOUTS[category];
  const { cmd, sizes } = buildCommand(baseImagePath, verse, parts, layout, font, outputPath);

  console.log(`\n📐 Layout: ${category}`);
  console.log(`   Canvas: ${CANVAS.width}x${CANVAS.height}px`);
  console.log(`   Zona texto: ${CANVAS.textZoneWidth}px`);
  console.log(`   Referencia: ${layout.ref.size}pt → ${sizes.ref.size}pt (${sizes.ref.width}px ancho)`);
  console.log(`   Principal: ${layout.main.size}pt → ${sizes.main.size}pt (${sizes.main.width}px ancho)`);
  console.log(`   Énfasis: ${layout.emphasis.size}pt → ${sizes.emphasis.size}pt (${sizes.emphasis.width}px ancho)`);
  console.log(`   ✅ Texto tratado como bloques coherentes\n`);

  try {
    execSync(cmd, { stdio: 'pipe' });

    const size = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`✅ Thumbnail V9 generado exitosamente`);
    console.log(`   Archivo: ${path.basename(outputPath)}`);
    console.log(`   Tamaño: ${size}KB\n`);

    return { success: true, path: outputPath, size, sizes };
  } catch (error) {
    throw new Error(`Error ejecutando ImageMagick: ${error.message}`);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 5) {
    console.error('\n❌ Uso: node compose-thumbnail-v9.js <base-image> <verse> <text> <category> <output>');
    console.error('\nEjemplo:');
    console.error('  node compose-thumbnail-v9.js base.png "Proverbios 3:5-6" "Confía en Dios SIEMPRE" sabiduria output.jpg\n');
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
