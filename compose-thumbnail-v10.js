#!/usr/bin/env node
/**
 * 🎨 THUMBNAIL COMPOSER V10 - LÍNEAS INDIVIDUALES CON MEDICIÓN DINÁMICA
 *
 * Fix crítico:
 * ✅ Cada línea de texto = una anotación separada
 * ✅ Medición dinámica POR LÍNEA
 * ✅ Interlineado calculado entre líneas
 * ✅ Como V7 pero con ajuste automático de tamaño
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CANVAS = {
  width: 1344,
  height: 768,
  textZoneWidth: 538,
  margin: 40
};

const FONTS = {
  primary: 'DejaVu-Sans-Bold',
  fallback1: 'Anton-Regular',
  fallback2: 'Arial-Bold'
};

const COLORS = {
  yellow: '#FFED00',
  white: '#FFFFFF',
  red: '#FF0000',
  black: '#000000',
  gold: '#FFD700'
};

const BASE_LAYOUTS = {
  sabiduria: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 190, y: 250, lineSpacing: 200, color: COLORS.white, stroke: 9 },
    emphasis: { size: 230, y: 580, color: COLORS.red, stroke: 10 }
  },
  fortaleza: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 200, y: 250, lineSpacing: 210, color: COLORS.white, stroke: 9 },
    emphasis: { size: 240, y: 590, color: COLORS.red, stroke: 10 }
  },
  esperanza: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 185, y: 240, lineSpacing: 195, color: COLORS.white, stroke: 9 },
    emphasis: { size: 225, y: 570, color: COLORS.gold, stroke: 10 }
  },
  amor: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 195, y: 245, lineSpacing: 205, color: COLORS.white, stroke: 9 },
    emphasis: { size: 235, y: 585, color: COLORS.red, stroke: 10 }
  },
  consuelo: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 188, y: 242, lineSpacing: 198, color: COLORS.white, stroke: 9 },
    emphasis: { size: 228, y: 575, color: '#9C27B0', stroke: 10 }
  },
  fe: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 192, y: 244, lineSpacing: 202, color: COLORS.white, stroke: 9 },
    emphasis: { size: 232, y: 580, color: '#2196F3', stroke: 10 }
  }
};

/**
 * Medir ancho de UNA línea de texto
 */
function measureTextLine(text, font, size) {
  try {
    const escapedText = text.replace(/"/g, '\\"');
    const cmd = `convert -debug annotate xc: -font ${font} -pointsize ${size} -annotate +0+0 "${escapedText}" null: 2>&1 | grep "Metrics:"`;
    const output = execSync(cmd, { encoding: 'utf8' });
    
    const widthMatch = output.match(/width:\s*(\d+)/);
    const heightMatch = output.match(/height:\s*(\d+)/);
    
    if (widthMatch && heightMatch) {
      return {
        width: parseInt(widthMatch[1]),
        height: parseInt(heightMatch[1])
      };
    }
  } catch (e) {
    return {
      width: text.length * size * 0.6,
      height: size * 1.2
    };
  }
  return { width: 0, height: 0 };
}

/**
 * Ajustar tamaño de línea
 */
function adjustLineSize(text, baseSize, font, maxWidth) {
  let size = baseSize;
  let metrics = measureTextLine(text, font, size);
  
  while (metrics.width > maxWidth && size > 60) {
    size -= 10;
    metrics = measureTextLine(text, font, size);
  }
  
  return { size, width: metrics.width, height: metrics.height };
}

/**
 * Construir comando con líneas separadas
 */
function buildCommand(baseImage, verse, parts, layout, font, output) {
  const maxWidth = CANVAS.textZoneWidth;
  
  // Separar versículo en dos líneas
  const verseParts = verse.split(' ');
  const refLine1 = verseParts[0].toUpperCase();
  const refLine2 = verseParts.slice(1).join(' ').toUpperCase();
  
  // Ajustar tamaños de cada línea
  const ref1 = adjustLineSize(refLine1, layout.ref.size, font, maxWidth);
  const ref2 = adjustLineSize(refLine2, layout.ref.size, font, maxWidth);
  const main1 = adjustLineSize(parts.line1.toUpperCase(), layout.main.size, font, maxWidth);
  const main2 = parts.line2 
    ? adjustLineSize(parts.line2.toUpperCase(), layout.main.size, font, maxWidth)
    : null;
  const emph = adjustLineSize(parts.emphasis.toUpperCase(), layout.emphasis.size, font, maxWidth);
  
  // Calcular posiciones Y
  const refY2 = layout.ref.y + layout.ref.lineSpacing;
  const mainY2 = main2 ? (layout.main.y + layout.main.lineSpacing) : 0;
  
  // Construir comando
  let cmd = `convert "${baseImage}" -font ${font}`;
  
  // Referencia línea 1
  cmd += ` \\
    -pointsize ${ref1.size} \\
    -fill "${layout.ref.color}" \\
    -stroke "${COLORS.black}" \\
    -strokewidth ${layout.ref.stroke} \\
    -gravity NorthWest \\
    -annotate +${CANVAS.margin}+${layout.ref.y} "${refLine1}"`;
  
  // Referencia línea 2
  cmd += ` \\
    -pointsize ${ref2.size} \\
    -annotate +${CANVAS.margin}+${refY2} "${refLine2}"`;
  
  // Principal línea 1
  cmd += ` \\
    -pointsize ${main1.size} \\
    -fill "${layout.main.color}" \\
    -strokewidth ${layout.main.stroke} \\
    -annotate +${CANVAS.margin}+${layout.main.y} "${parts.line1.toUpperCase()}"`;
  
  // Principal línea 2 (si existe)
  if (main2) {
    cmd += ` \\
    -pointsize ${main2.size} \\
    -annotate +${CANVAS.margin}+${mainY2} "${parts.line2.toUpperCase()}"`;
  }
  
  // Énfasis
  cmd += ` \\
    -pointsize ${emph.size} \\
    -fill "${layout.emphasis.color}" \\
    -strokewidth ${layout.emphasis.stroke} \\
    -annotate +${CANVAS.margin}+${layout.emphasis.y} "${parts.emphasis.toUpperCase()}"`;
  
  cmd += ` \\
    -quality 95 \\
    "${output}"`;
  
  return {
    cmd,
    sizes: { ref1, ref2, main1, main2, emphasis: emph }
  };
}

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

async function composeThumbnail(baseImagePath, verse, text, category, outputPath) {
  console.log('\n🎨 COMPOSITOR V10 - LÍNEAS INDIVIDUALES CON MEDICIÓN DINÁMICA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
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
  console.log(`   Ref 1: ${layout.ref.size}pt → ${sizes.ref1.size}pt (${sizes.ref1.width}px)`);
  console.log(`   Ref 2: ${layout.ref.size}pt → ${sizes.ref2.size}pt (${sizes.ref2.width}px)`);
  console.log(`   Main 1: ${layout.main.size}pt → ${sizes.main1.size}pt (${sizes.main1.width}px)`);
  if (sizes.main2) {
    console.log(`   Main 2: ${layout.main.size}pt → ${sizes.main2.size}pt (${sizes.main2.width}px)`);
  }
  console.log(`   Emphasis: ${layout.emphasis.size}pt → ${sizes.emphasis.size}pt (${sizes.emphasis.width}px)`);
  console.log(`   ✅ Cada línea independiente con medición dinámica\n`);
  
  try {
    execSync(cmd, { stdio: 'pipe' });
    
    const size = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`✅ Thumbnail V10 generado exitosamente`);
    console.log(`   Archivo: ${path.basename(outputPath)}`);
    console.log(`   Tamaño: ${size}KB\n`);
    
    return { success: true, path: outputPath, size, sizes };
  } catch (error) {
    throw new Error(`Error ejecutando ImageMagick: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 5) {
    console.error('\n❌ Uso: node compose-thumbnail-v10.js <base-image> <verse> <text> <category> <output>');
    console.error('\nEjemplo:');
    console.error('  node compose-thumbnail-v10.js base.png "Proverbios 3:5-6" "Confía en Dios SIEMPRE" sabiduria output.jpg\n');
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
